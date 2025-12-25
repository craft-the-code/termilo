use serde::{Deserialize, Serialize};
use ssh2::Session;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpStream;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{Emitter, State, Window};
mod system_info;
use system_info::get_system_info;

#[derive(Serialize, Deserialize, Clone)]
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

#[derive(Serialize, Clone)]
struct SSHOutputEvent {
    session_id: String,
    data: String,
}

#[derive(Serialize, Clone)]
struct SSHClosedEvent {
    session_id: String,
    message: Option<String>,
}

#[derive(Serialize, Clone)]
struct SSHErrorEvent {
    session_id: String,
    error: String,
}

struct SSHSession {
    session: Session,
    channel: ssh2::Channel,
    is_connected: bool,
}

// Wrap the Mutex in an Arc for thread-safe cloning
struct AppState {
    ssh_sessions: Arc<Mutex<HashMap<String, SSHSession>>>,
}

#[tauri::command]
async fn connect_ssh(
    profile: ServerProfile,
    session_id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    println!("Connecting to SSH session: {}", session_id);

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
    sess.handshake()
        .map_err(|e| format!("Handshake failed: {}", e))?;

    match profile.auth_method.as_str() {
        "password" => {
            let password = profile.password.ok_or("Password required")?;
            sess.userauth_password(&profile.username, &password)
                .map_err(|e| format!("Auth failed: {}", e))?;
        }
        "key" => {
            let key_path = profile.key_path.ok_or("Key path required")?;
            sess.userauth_pubkey_file(
                &profile.username,
                None,
                std::path::Path::new(&key_path),
                None,
            )
            .map_err(|e| format!("Key auth failed: {}", e))?;
        }
        _ => return Err("Invalid auth method".to_string()),
    }

    if !sess.authenticated() {
        return Err("Authentication failed".to_string());
    }

    let mut channel = sess
        .channel_session()
        .map_err(|e| format!("Channel error: {}", e))?;

    channel
        .request_pty("xterm-256color", None, Some((80, 24, 0, 0)))
        .map_err(|e| format!("PTY error: {}", e))?;

    channel.shell().map_err(|e| format!("Shell error: {}", e))?;

    sess.set_blocking(false);

    channel
        .handle_extended_data(ssh2::ExtendedData::Merge)
        .map_err(|e| format!("Extended data error: {}", e))?;

    println!("SSH session {} connected successfully", session_id);

    let ssh_session = SSHSession {
        session: sess,
        channel,
        is_connected: true,
    };

    state
        .ssh_sessions
        .lock()
        .unwrap()
        .insert(session_id.clone(), ssh_session);

    Ok("Connected".to_string())
}

#[tauri::command]
async fn send_command(
    session_id: String,
    command: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut sessions = state.ssh_sessions.lock().unwrap();
    let ssh_session = sessions.get_mut(&session_id).ok_or("Session not found")?;

    if !ssh_session.is_connected {
        return Err("Session not connected".to_string());
    }

    match ssh_session.channel.write_all(command.as_bytes()) {
        Ok(_) => {
            let _ = ssh_session.channel.flush();
            Ok("Command sent".to_string())
        }
        Err(e) => {
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
async fn read_output_stream(
    window: Window,
    session_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Clone the Arc to pass it into the async task
    let sessions_arc = state.ssh_sessions.clone();

    // Use tokio::spawn from the Tauri runtime
    tauri::async_runtime::spawn(async move {
        let mut buffer = [0; 8192]; // Larger buffer for better performance
        let mut output_buffer = String::new();
        let mut last_emit = Instant::now();

        // Batch output for better performance
        const EMIT_INTERVAL_MS: u64 = 16; // ~60fps
        const MAX_BUFFER_SIZE: usize = 4096;

        loop {
            let should_continue = {
                // Minimize mutex lock time
                let mut sessions = sessions_arc.lock().unwrap();

                let ssh_session = match sessions.get_mut(&session_id) {
                    Some(s) => s,
                    None => break, // Session removed
                };

                if !ssh_session.is_connected {
                    let _ = window.emit(
                        "ssh-output-closed",
                        SSHClosedEvent {
                            session_id: session_id.clone(),
                            message: Some("Session disconnected".to_string()),
                        },
                    );
                    break;
                }

                match ssh_session.channel.read(&mut buffer) {
                    Ok(0) => {
                        if ssh_session.channel.eof() {
                            ssh_session.is_connected = false;
                            let _ = window.emit(
                                "ssh-output-closed",
                                SSHClosedEvent {
                                    session_id: session_id.clone(),
                                    message: Some("EOF reached".to_string()),
                                },
                            );
                            false // Stop loop
                        } else {
                            true // Continue, no data available yet
                        }
                    }
                    Ok(n) => {
                        let new_output = String::from_utf8_lossy(&buffer[..n]);
                        output_buffer.push_str(&new_output);
                        true // Continue
                    }
                    Err(e) => {
                        if e.kind() == std::io::ErrorKind::WouldBlock {
                            true // Continue, no data available
                        } else {
                            eprintln!("Read error for session {}: {}", session_id, e);
                            let _ = window.emit(
                                "ssh-output-error",
                                SSHErrorEvent {
                                    session_id: session_id.clone(),
                                    error: e.to_string(),
                                },
                            );
                            sessions.remove(&session_id);
                            false // Stop loop
                        }
                    }
                }
            }; // Mutex lock released here

            if !should_continue {
                break;
            }

            // Emit buffered output at intervals or when buffer is large
            let now = Instant::now();
            let should_emit = !output_buffer.is_empty()
                && (now.duration_since(last_emit).as_millis() >= EMIT_INTERVAL_MS as u128
                    || output_buffer.len() >= MAX_BUFFER_SIZE);

            if should_emit {
                let _ = window.emit(
                    "ssh-output",
                    SSHOutputEvent {
                        session_id: session_id.clone(),
                        data: output_buffer.clone(),
                    },
                );
                output_buffer.clear();
                last_emit = now;
            }

            // Small sleep only when no data was read
            if output_buffer.is_empty() {
                std::thread::sleep(Duration::from_millis(1)); // Reduced from 10ms
            }
        }

        // Emit any remaining buffered output
        if !output_buffer.is_empty() {
            let _ = window.emit(
                "ssh-output",
                SSHOutputEvent {
                    session_id: session_id.clone(),
                    data: output_buffer,
                },
            );
        }
    });

    Ok(())
}

#[tauri::command]
async fn disconnect_ssh(session_id: String, state: State<'_, AppState>) -> Result<String, String> {
    let mut sessions = state.ssh_sessions.lock().unwrap();
    if let Some(mut ssh_session) = sessions.remove(&session_id) {
        ssh_session.is_connected = false;
        let _ = ssh_session.channel.close();
        let _ = ssh_session
            .session
            .disconnect(None, "User disconnected", None);
    }
    Ok("Disconnected".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        ssh_sessions: Arc::new(Mutex::new(HashMap::new())),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            connect_ssh,
            send_command,
            read_output_stream,
            disconnect_ssh,
            get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
