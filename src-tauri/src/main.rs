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

    let ssh_session = SSHSession { session: sess, channel };
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

    ssh_session.channel.write_all(command.as_bytes())
        .map_err(|e| format!("Write error: {}", e))?;

    Ok("Command sent".to_string())
}

#[tauri::command]
async fn read_output(
    session_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let mut sessions = state.ssh_sessions.lock().unwrap();
    let ssh_session = sessions.get_mut(&session_id)
        .ok_or("Session not found")?;

    let mut buffer = [0; 4096];
    match ssh_session.channel.read(&mut buffer) {
        Ok(0) => {
            // Check if channel is EOF or closed
            if ssh_session.channel.eof() {
                return Err("Connection closed".to_string());
            }
            Ok("".to_string())
        },
        Ok(n) => {
            let output = String::from_utf8_lossy(&buffer[..n]).to_string();
            Ok(output)
        },
        Err(e) => {
            // For non-blocking read, timeout is normal
            if e.kind() == std::io::ErrorKind::TimedOut || e.kind() == std::io::ErrorKind::WouldBlock {
                Ok("".to_string())
            } else {
                Err(format!("Read error: {}", e))
            }
        }
    }
}

#[tauri::command]
async fn disconnect_ssh(
    session_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let mut sessions = state.ssh_sessions.lock().unwrap();
    sessions.remove(&session_id);
    Ok("Disconnected".to_string())
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
            disconnect_ssh
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}