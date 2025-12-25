mod ssh_manager;
mod commands;

use ssh_manager::SshManager;
use std::sync::Arc;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ssh_manager = Arc::new(SshManager::new());

    tauri::Builder::default()
        .manage(ssh_manager)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::connect_ssh,
            commands::send_command,
            commands::read_output_stream,
            commands::disconnect_ssh,
            commands::resize_terminal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
