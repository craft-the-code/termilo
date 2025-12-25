use ssh2::Session;
use std::collections::HashMap;
use std::net::TcpStream;
use std::path::Path;
use std::sync::Arc;
use std::io::{Read, Write};
use parking_lot::Mutex;
use tauri::{Manager, Emitter};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshProfile {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_method: String,
    pub password: Option<String>,
    pub key_path: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct SshOutputPayload {
    pub session_id: String,
    pub data: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct SshErrorPayload {
    pub session_id: String,
    pub error: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct SshClosedPayload {
    pub session_id: String,
    pub message: Option<String>,
}

pub struct SshSession {
    pub id: String,
    pub session: Session,
    pub channel: Option<ssh2::Channel>,
    pub is_connected: bool,
}

pub struct SshManager {
    sessions: Arc<Mutex<HashMap<String, SshSession>>>,
}

impl SshManager {
    pub fn new() -> Self {
        SshManager {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn connect(&self, profile: SshProfile, session_id: String) -> Result<String, String> {
        // Check if session already exists and is connected
        {
            let sessions = self.sessions.lock();
            if let Some(existing) = sessions.get(&session_id) {
                if existing.is_connected {
                    return Err("Session already connected".to_string());
                }
            }
        }

        // Create TCP connection
        let tcp = TcpStream::connect(format!("{}:{}", profile.host, profile.port))
            .map_err(|e| format!("Failed to connect to {}:{} - {}", profile.host, profile.port, e))?;

        // Create SSH session
        let mut session = Session::new()
            .map_err(|e| format!("Failed to create SSH session: {}", e))?;

        session.set_tcp_stream(tcp);

        // Complete handshake in BLOCKING mode
        session.handshake()
            .map_err(|e| format!("SSH handshake failed: {}", e))?;

        // Authenticate in BLOCKING mode
        match profile.auth_method.as_str() {
            "password" => {
                let password = profile.password.ok_or("Password required but not provided")?;
                session.userauth_password(&profile.username, &password)
                    .map_err(|e| format!("Password authentication failed: {}", e))?;
            }
            "key" => {
                let key_path = profile.key_path.ok_or("Key path required but not provided")?;
                session.userauth_pubkey_file(
                    &profile.username,
                    None,
                    Path::new(&key_path),
                    None,
                ).map_err(|e| format!("Key authentication failed: {}", e))?;
            }
            _ => return Err(format!("Unknown authentication method: {}", profile.auth_method)),
        }

        if !session.authenticated() {
            return Err("Authentication failed".to_string());
        }

        // NOW set to non-blocking mode AFTER authentication succeeds
        session.set_blocking(false);

        // Request PTY and shell
        let mut channel = session.channel_session()
            .map_err(|e| format!("Failed to open channel: {}", e))?;

        channel.request_pty("xterm-256color", None, None)
            .map_err(|e| format!("Failed to request PTY: {}", e))?;

        channel.shell()
            .map_err(|e| format!("Failed to start shell: {}", e))?;

        // Store session
        let ssh_session = SshSession {
            id: session_id.clone(),
            session,
            channel: Some(channel),
            is_connected: true,
        };

        {
            let mut sessions = self.sessions.lock();
            sessions.insert(session_id.clone(), ssh_session);
        }

        Ok(format!("Connected to {}", profile.name))
    }

    pub async fn send_input(&self, session_id: &str, data: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock();
        let session = sessions.get_mut(session_id)
            .ok_or("Session not found")?;

        if let Some(channel) = &mut session.channel {
            channel.write_all(data.as_bytes())
                .map_err(|e| format!("Failed to write to channel: {}", e))?;

            channel.flush()
                .map_err(|e| format!("Failed to flush channel: {}", e))?;

            Ok(())
        } else {
            Err("Channel not available".to_string())
        }
    }

    pub async fn disconnect(&self, session_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock();

        if let Some(mut session) = sessions.remove(session_id) {
            session.is_connected = false;

            // Close channel
            if let Some(mut channel) = session.channel.take() {
                let _ = channel.close();
                let _ = channel.wait_close();
            }

            Ok(())
        } else {
            Err("Session not found".to_string())
        }
    }

    pub async fn start_output_stream(&self, session_id: String, app_handle: tauri::AppHandle) -> Result<(), String> {
        // Clone the sessions Arc for the spawned task
        let sessions = Arc::clone(&self.sessions);

        // Spawn tokio task to read output
        tokio::spawn(async move {
            let mut buffer = vec![0u8; 8192];
            let mut consecutive_errors = 0;
            let max_consecutive_errors = 10;

            loop {
                // Small delay to prevent tight loop
                tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

                // Read from channel
                let read_result = {
                    let mut sessions_lock = sessions.lock();
                    if let Some(session) = sessions_lock.get_mut(&session_id) {
                        if let Some(channel) = &mut session.channel {
                            match channel.read(&mut buffer) {
                                Ok(n) => Some(Ok(n)),
                                Err(e) => Some(Err(e)),
                            }
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                };

                match read_result {
                    Some(Ok(0)) => {
                        // EOF - connection closed
                        let _ = app_handle.emit("ssh-output-closed", SshClosedPayload {
                            session_id: session_id.clone(),
                            message: Some("Connection closed by remote host".to_string()),
                        });
                        break;
                    }
                    Some(Ok(n)) => {
                        // Successfully read data
                        consecutive_errors = 0;
                        let data = String::from_utf8_lossy(&buffer[..n]).to_string();

                        let _ = app_handle.emit("ssh-output", SshOutputPayload {
                            session_id: session_id.clone(),
                            data,
                        });
                    }
                    Some(Err(e)) => {
                        if e.kind() == std::io::ErrorKind::WouldBlock {
                            // No data available, wait a bit
                            consecutive_errors = 0;
                        } else {
                            consecutive_errors += 1;

                            if consecutive_errors >= max_consecutive_errors {
                                let _ = app_handle.emit("ssh-output-error", SshErrorPayload {
                                    session_id: session_id.clone(),
                                    error: format!("Read error: {}", e),
                                });
                                break;
                            }

                            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                        }
                    }
                    None => {
                        // Session no longer exists
                        break;
                    }
                }
            }

            // Cleanup session on exit
            let mut sessions_lock = sessions.lock();
            sessions_lock.remove(&session_id);
        });

        Ok(())
    }

    pub async fn resize_pty(&self, session_id: &str, cols: u32, rows: u32) -> Result<(), String> {
        let mut sessions = self.sessions.lock();
        let session = sessions.get_mut(session_id)
            .ok_or("Session not found")?;

        if let Some(channel) = &mut session.channel {
            channel.request_pty_size(cols, rows, None, None)
                .map_err(|e| format!("Failed to resize PTY: {}", e))?;
            Ok(())
        } else {
            Err("Channel not available".to_string())
        }
    }
}
