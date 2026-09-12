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
        // 1. Try opening the macOS Ollama app first
        if let Ok(output) = Command::new("open").arg("-a").arg("Ollama").output() {
            if output.status.success() {
                return Ok("Ollama launched via macOS Application bundle".to_string());
            }
        }
        if let Ok(output) = Command::new("open").arg("/Applications/Ollama.app").output() {
            if output.status.success() {
                return Ok("Ollama launched via /Applications/Ollama.app".to_string());
            }
        }
        // 2. Fallback to known CLI binary locations
        let candidate_paths = [
            "/usr/local/bin/ollama",
            "/opt/homebrew/bin/ollama",
            "ollama",
        ];
        for path in candidate_paths {
            if let Ok(_) = Command::new(path).arg("serve").spawn() {
                return Ok(format!("Ollama daemon spawned via {}", path));
            }
        }
        Err("Failed to start Ollama. Ensure Ollama is installed in /Applications or in your PATH.".to_string())
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
    #[cfg(target_os = "macos")]
    {
        // 1. Terminate the macOS GUI menu-bar app (watchdog) and standalone CLI daemon
        let _ = Command::new("killall").args(&["-9", "Ollama"]).output();
        let _ = Command::new("killall").args(&["-9", "ollama"]).output();
        let _ = Command::new("pkill").args(&["-9", "-i", "-f", "ollama"]).output();
    }

    #[cfg(target_os = "linux")]
    {
        let _ = Command::new("systemctl").args(&["--user", "stop", "ollama"]).output();
        let _ = Command::new("systemctl").args(&["stop", "ollama"]).output();
        let _ = Command::new("pkill").args(&["-9", "-f", "ollama"]).output();
    }

    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("taskkill")
            .args(&["/F", "/IM", "ollama.exe", "/T"])
            .output();
        let _ = Command::new("taskkill")
            .args(&["/F", "/IM", "ollama app.exe", "/T"])
            .output();
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        return Err("Unsupported operating system for native process termination".to_string());
    }

    // Actively verify that port 11434 is closed (poll up to 15 times with 100ms interval)
    let addr: SocketAddr = "127.0.0.1:11434"
        .parse()
        .map_err(|e| format!("Invalid socket address: {}", e))?;

    for _ in 0..15 {
        std::thread::sleep(Duration::from_millis(100));
        if TcpStream::connect_timeout(&addr, Duration::from_millis(100)).is_err() {
            return Ok("Ollama daemon stopped successfully".to_string());
        }
    }

    Ok("Ollama termination signal sent".to_string())
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

/// Queries Ollama /api/tags for installed models natively
#[tauri::command]
fn query_ollama_tags() -> Result<serde_json::Value, String> {
    let response = ureq::get("http://127.0.0.1:11434/api/tags")
        .timeout(Duration::from_millis(2500))
        .call()
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

    let json: serde_json::Value = response
        .into_json()
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    Ok(json)
}

/// Queries Ollama /api/ps for currently running models in VRAM
#[tauri::command]
fn query_ollama_ps() -> Result<serde_json::Value, String> {
    let response = ureq::get("http://127.0.0.1:11434/api/ps")
        .timeout(Duration::from_millis(2500))
        .call()
        .map_err(|e| format!("Failed to connect to Ollama ps: {}", e))?;

    let json: serde_json::Value = response
        .into_json()
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    Ok(json)
}

/// Streams chat tokens from Ollama /api/chat via Tauri Channel
#[tauri::command]
fn stream_ollama_chat(
    options: serde_json::Value,
    on_chunk: tauri::ipc::Channel<String>,
) -> Result<String, String> {
    use std::io::BufRead;

    let response = ureq::post("http://127.0.0.1:11434/api/chat")
        .send_json(options)
        .map_err(|e| format!("Inference error: {}", e))?;

    let reader = std::io::BufReader::new(response.into_reader());
    let mut full_accumulated = String::new();

    for line in reader.lines() {
        let l = line.map_err(|e| format!("Stream read error: {}", e))?;
        if !l.trim().is_empty() {
            let _ = on_chunk.send(l.clone());
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&l) {
                if let Some(content) = v.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
                    full_accumulated.push_str(content);
                }
            }
        }
    }

    Ok(full_accumulated)
}

/// Generic proxy for any Ollama JSON endpoint (e.g. /api/show, /api/delete, /api/embeddings)
#[tauri::command]
fn ollama_proxy_request(
    method: String,
    path: String,
    body: Option<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let clean_path = path.trim_start_matches('/');
    let url = format!("http://127.0.0.1:11434/{}", clean_path);

    let res = match method.to_uppercase().as_str() {
        "POST" => {
            let req = ureq::post(&url).timeout(Duration::from_millis(30000));
            if let Some(b) = body {
                req.send_json(b)
            } else {
                req.call()
            }
        }
        "DELETE" => {
            let req = ureq::delete(&url).timeout(Duration::from_millis(15000));
            if let Some(b) = body {
                req.send_json(b)
            } else {
                req.call()
            }
        }
        _ => ureq::get(&url).timeout(Duration::from_millis(15000)).call(),
    };

    let response = res.map_err(|e| format!("Ollama request error: {}", e))?;
    let json: serde_json::Value = response
        .into_json()
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    Ok(json)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_ollama_status,
            start_ollama_daemon,
            stop_ollama_daemon,
            get_system_telemetry,
            query_ollama_tags,
            query_ollama_ps,
            stream_ollama_chat,
            ollama_proxy_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running Resursee desktop application");
}
