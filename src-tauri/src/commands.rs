use tauri::State;
use std::sync::Arc;
use crate::ssh_manager::{SshManager, SshProfile};

#[tauri::command]
pub async fn connect_ssh(
    profile: SshProfile,
    session_id: String,
    manager: State<'_, Arc<SshManager>>,
) -> Result<String, String> {
    manager.connect(profile, session_id).await
}

#[tauri::command]
pub async fn send_command(
    session_id: String,
    command: String,
    manager: State<'_, Arc<SshManager>>,
) -> Result<(), String> {
    manager.send_input(&session_id, &command).await
}

#[tauri::command]
pub async fn read_output_stream(
    session_id: String,
    manager: State<'_, Arc<SshManager>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    manager.start_output_stream(session_id, app).await
}

#[tauri::command]
pub async fn disconnect_ssh(
    session_id: String,
    manager: State<'_, Arc<SshManager>>,
) -> Result<(), String> {
    manager.disconnect(&session_id).await
}

#[tauri::command]
pub async fn resize_terminal(
    session_id: String,
    cols: u32,
    rows: u32,
    manager: State<'_, Arc<SshManager>>,
) -> Result<(), String> {
    manager.resize_pty(&session_id, cols, rows).await
}
