// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::net::{SocketAddr, TcpStream};
use std::process::Command;
use std::time::Duration;
use sysinfo::System;

#[derive(Serialize)]
struct SystemTelemetry {
    total_ram_mb: u64,
    available_ram_mb: u64,
    os_name: String,
    os_version: String,
    cpu_arch: String,
    recommended_tier: String,
}

/// Checks whether Ollama's default port 11434 is listening locally
#[tauri::command]
fn check_ollama_status() -> Result<bool, String> {
    let addr: SocketAddr = "127.0.0.1:11434"
        .parse()
        .map_err(|e| format!("Invalid socket address: {}", e))?;

    match TcpStream::connect_timeout(&addr, Duration::from_millis(1200)) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Natively launches the Ollama daemon with cross-platform OS handling
#[tauri::command]
fn start_ollama_daemon() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        // Try opening the macOS Ollama app first
        let open_res = Command::new("open").arg("-a").arg("Ollama").output();
        if let Ok(output) = open_res {
            if output.status.success() {
                return Ok("Ollama launched via macOS Application bundle".to_string());
            }
        }
        // Fallback to spawning background CLI daemon
        Command::new("ollama")
            .arg("serve")
            .spawn()
            .map_err(|e| format!("Failed to spawn ollama serve: {}", e))?;
        Ok("Ollama daemon spawned in background".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        // Try Windows start command
        let win_res = Command::new("cmd")
            .args(&["/C", "start", "", "ollama", "app"])
            .output();
        if let Ok(output) = win_res {
            if output.status.success() {
                return Ok("Ollama launched via Windows Start".to_string());
            }
        }
        // Fallback to spawning binary
        Command::new("ollama.exe")
            .arg("serve")
            .spawn()
            .map_err(|e| format!("Failed to spawn ollama.exe: {}", e))?;
        Ok("Ollama daemon spawned on Windows".to_string())
    }

    #[cfg(target_os = "linux")]
    {
        // Try systemctl first on Linux
        let systemctl_res = Command::new("systemctl")
            .args(&["start", "ollama"])
            .output();
        if let Ok(output) = systemctl_res {
            if output.status.success() {
                return Ok("Ollama service started via systemctl".to_string());
            }
        }
        // Fallback to spawning CLI
        Command::new("ollama")
            .arg("serve")
            .spawn()
            .map_err(|e| format!("Failed to spawn ollama serve: {}", e))?;
        Ok("Ollama daemon spawned on Linux".to_string())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("Unsupported operating system for native Ollama management".to_string())
    }
}

/// Natively terminates the Ollama daemon across macOS, Windows, and Linux
#[tauri::command]
fn stop_ollama_daemon() -> Result<String, String> {
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        let res = Command::new("pkill")
            .args(&["-f", "ollama"])
            .output()
            .map_err(|e| format!("Failed to execute pkill: {}", e))?;

        if res.status.success() {
            Ok("Ollama process stopped successfully".to_string())
        } else {
            Ok("No running Ollama process found to terminate".to_string())
        }
    }

    #[cfg(target_os = "windows")]
    {
        let res = Command::new("taskkill")
            .args(&["/F", "/IM", "ollama.exe", "/T"])
            .output()
            .map_err(|e| format!("Failed to execute taskkill: {}", e))?;

        if res.status.success() {
            Ok("Ollama process terminated via taskkill".to_string())
        } else {
            Ok("No running Ollama process found on Windows".to_string())
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("Unsupported operating system for native process termination".to_string())
    }
}

/// Reads host system telemetry (RAM, CPU, OS) to suggest optimal model sizes
#[tauri::command]
fn get_system_telemetry() -> SystemTelemetry {
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_ram_mb = sys.total_memory() / (1024 * 1024);
    let available_ram_mb = sys.available_memory() / (1024 * 1024);

    let recommended_tier = if total_ram_mb >= 16000 {
        "16gb_plus".to_string()
    } else if total_ram_mb >= 8000 {
        "8gb".to_string()
    } else {
        "4gb".to_string()
    };

    SystemTelemetry {
        total_ram_mb,
        available_ram_mb,
        os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "".to_string()),
        cpu_arch: std::env::consts::ARCH.to_string(),
        recommended_tier,
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_ollama_status,
            start_ollama_daemon,
            stop_ollama_daemon,
            get_system_telemetry
        ])
        .run(tauri::generate_context!())
        .expect("error while running Resursee desktop application");
}
