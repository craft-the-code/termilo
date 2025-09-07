use std::collections::HashMap;
use std::sync::Mutex;
use ssh2::Session;
use std::net::TcpStream;
use std::io::{Read, Write};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct ServerProfile {
    id: String,
    name: String,
    host: String,
    port: u16,
    username: String,
    auth_method: String,
    password: Option<String>,
    key_path: Option<String>,
}

struct SSHSession {
    session: Session,
    channel: ssh2::Channel,
    is_connected: bool,
}

struct AppState {
    ssh_sessions: Mutex<HashMap<String, SSHSession>>,
}

#[tauri::command]
async fn connect_ssh(
    profile: ServerProfile,
    session_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    // Check if session already exists and is connected
    {
        let sessions = state.ssh_sessions.lock().unwrap();
        if let Some(existing_session) = sessions.get(&session_id) {
            if existing_session.is_connected {
                return Ok("Already connected".to_string());
            }
        }
    }

    let tcp = TcpStream::connect(format!("{}:{}", profile.host, profile.port))
        .map_err(|e| format!("Connection failed: {}", e))?;

    let mut sess = Session::new().map_err(|e| format!("Session error: {}", e))?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| format!("Handshake failed: {}", e))?;

    // Authentication
    match profile.auth_method.as_str() {
        "password" => {
            let password = profile.password.ok_or("Password required")?;
            sess.userauth_password(&profile.username, &password)
                .map_err(|e| format!("Auth failed: {}", e))?;
        }
        "key" => {
            let key_path = profile.key_path.ok_or("Key path required")?;
            sess.userauth_pubkey_file(&profile.username, None, std::path::Path::new(&key_path), None)
                .map_err(|e| format!("Key auth failed: {}", e))?;
        }
        _ => return Err("Invalid auth method".to_string()),
    }

    if !sess.authenticated() {
        return Err("Authentication failed".to_string());
    }

    let mut channel = sess.channel_session()
        .map_err(|e| format!("Channel error: {}", e))?;

    channel.request_pty("xterm", None, None)
        .map_err(|e| format!("PTY error: {}", e))?;

    channel.shell().map_err(|e| format!("Shell error: {}", e))?;

    // Set session to non-blocking mode (affects all channels)
    sess.set_blocking(false);

    // Enable input streaming - merge stderr with stdout
    channel.handle_extended_data(ssh2::ExtendedData::Merge)
        .map_err(|e| format!("Extended data error: {}", e))?;

    let ssh_session = SSHSession {
        session: sess,
        channel,
        is_connected: true
    };

    state.ssh_sessions.lock().unwrap().insert(session_id.clone(), ssh_session);

    Ok("Connected".to_string())
}

#[tauri::command]
async fn send_command(
    session_id: String,
    command: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let mut sessions = state.ssh_sessions.lock().unwrap();
    let ssh_session = sessions.get_mut(&session_id)
        .ok_or("Session not found")?;

    if !ssh_session.is_connected {
        return Err("Session not connected".to_string());
    }

    // Handle fast typing by batching small writes
    match ssh_session.channel.write_all(command.as_bytes()) {
        Ok(_) => {
            // Only flush occasionally to avoid overwhelming the connection
            if command.contains('\n') || command.contains('\r') || command.len() > 10 {
                let _ = ssh_session.channel.flush();
            }
            Ok("Command sent".to_string())
        },
        Err(e) => {
            // Don't immediately mark as disconnected for write errors during fast typing
            if e.kind() == std::io::ErrorKind::WouldBlock {
                Ok("Command queued".to_string())
            } else {
                ssh_session.is_connected = false;
                Err(format!("Write error: {}", e))
            }
        }
    }
}

#[tauri::command]
async fn read_output(
    session_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let mut sessions = state.ssh_sessions.lock().unwrap();
    let ssh_session = sessions.get_mut(&session_id)
        .ok_or("Session not found")?;

    if !ssh_session.is_connected {
        return Err("Session not connected".to_string());
    }

    let mut buffer = [0; 4096];
    match ssh_session.channel.read(&mut buffer) {
        Ok(0) => {
            // Check if channel is EOF or closed
            if ssh_session.channel.eof() {
                ssh_session.is_connected = false;
                return Err("Connection closed".to_string());
            }
            Ok("".to_string())
        },
        Ok(n) => {
            let output = String::from_utf8_lossy(&buffer[..n]).to_string();
            Ok(output)
        },
        Err(e) => {
            match e.kind() {
                std::io::ErrorKind::WouldBlock => {
                    // Non-blocking read with no data available
                    Ok("".to_string())
                },
                std::io::ErrorKind::TimedOut => {
                    // Timeout is normal for non-blocking reads
                    Ok("".to_string())
                },
                _ => {
                    // Real error, mark session as disconnected
                    ssh_session.is_connected = false;
                    Err(format!("Read error: {}", e))
                }
            }
        }
    }
}

#[tauri::command]
async fn check_connection(
    session_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    let sessions = state.ssh_sessions.lock().unwrap();
    if let Some(ssh_session) = sessions.get(&session_id) {
        Ok(ssh_session.is_connected && !ssh_session.channel.eof())
    } else {
        Ok(false)
    }
}

#[tauri::command]
async fn disconnect_ssh(
    session_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let mut sessions = state.ssh_sessions.lock().unwrap();
    if let Some(mut ssh_session) = sessions.remove(&session_id) {
        ssh_session.is_connected = false;
        let _ = ssh_session.channel.close();
        let _ = ssh_session.session.disconnect(None, "User disconnected", None);
    }
    Ok("Disconnected".to_string())
}

#[tauri::command]
async fn get_active_sessions(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let sessions = state.ssh_sessions.lock().unwrap();
    let active_sessions: Vec<String> = sessions
        .iter()
        .filter(|(_, session)| session.is_connected)
        .map(|(id, _)| id.clone())
        .collect();
    Ok(active_sessions)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        ssh_sessions: Mutex::new(HashMap::new()),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            connect_ssh,
            send_command,
            read_output,
            check_connection,
            disconnect_ssh,
            get_active_sessions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}