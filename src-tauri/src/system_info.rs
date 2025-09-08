use serde::{Deserialize, Serialize};
use sysinfo::{System, Cpu, Disks};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub total_memory: u64,
    pub available_memory: u64,
    pub used_memory: u64,
    pub cpu_count: usize,
    pub cpu_model: String,
    pub cpu_frequency: u64,
    pub cpu_usage: f32,
    pub username: String,
    pub hostname: String,
    pub uptime: u64,
    pub disk_total: u64,
    pub disk_available: u64,
}

#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu();

    let cpus = sys.cpus();
    let cpu_count = cpus.len();
    let cpu_model = if !cpus.is_empty() {
        cpus[0].brand().to_string()
    } else {
        "Unknown".to_string()
    };
    
    let cpu_frequency = if !cpus.is_empty() {
        cpus[0].frequency()
    } else {
        0
    };
    
    let cpu_usage = if !cpus.is_empty() {
        cpus.iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / cpus.len() as f32
    } else {
        0.0
    };

    let total_memory = sys.total_memory();
    let available_memory = sys.available_memory();
    let used_memory = sys.used_memory();

    let disks = Disks::new_with_refreshed_list();
    let (disk_total, disk_available) = if !disks.is_empty() {
        let main_disk = &disks[0];
        (main_disk.total_space(), main_disk.available_space())
    } else {
        (0, 0)
    };

    let uptime = System::uptime();

    let username = env::var("USER")
        .or_else(|_| env::var("USERNAME"))
        .unwrap_or("Unknown".to_string());
        
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());

    Ok(SystemInfo {
        total_memory,
        available_memory,
        used_memory,
        cpu_count,
        cpu_model,
        cpu_frequency,
        cpu_usage,
        username,
        hostname,
        uptime,
        disk_total,
        disk_available,
    })
}