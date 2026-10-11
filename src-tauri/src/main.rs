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
        // Headless CLI execution: do NOT launch GUI app window
        let candidate_paths = [
            "/Applications/Ollama.app/Contents/Resources/ollama",
            "/usr/local/bin/ollama",
            "/opt/homebrew/bin/ollama",
            "ollama",
        ];
        for path in candidate_paths {
            if std::path::Path::new(path).exists() || path == "ollama" {
                if let Ok(_) = Command::new(path)
                    .arg("serve")
                    .env("OLLAMA_ORIGINS", "*")
                    .spawn()
                {
                    return Ok(format!("Ollama daemon started silently in background via {}", path));
                }
            }
        }
        Err("Failed to start Ollama headless daemon. Ensure Ollama is installed in /Applications or in your PATH.".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        // Headless CLI execution on Windows
        Command::new("ollama.exe")
            .arg("serve")
            .env("OLLAMA_ORIGINS", "*")
            .spawn()
            .or_else(|_| {
                Command::new("ollama")
                    .arg("serve")
                    .env("OLLAMA_ORIGINS", "*")
                    .spawn()
            })
            .map_err(|e| format!("Failed to spawn headless ollama daemon: {}", e))?;
        Ok("Ollama daemon spawned silently on Windows".to_string())
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

/// Natively opens any external URL in the user's default system browser (macOS, Windows, Linux)
#[tauri::command]
fn open_external_url(url: String) -> Result<bool, String> {
    let clean_url = url.trim();
    if !clean_url.starts_with("http://")
        && !clean_url.starts_with("https://")
        && !clean_url.starts_with("mailto:")
    {
        return Err("Invalid or unsupported external URL scheme".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(clean_url)
            .spawn()
            .map_err(|e| format!("Failed to open URL in browser: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", "start", "", clean_url])
            .spawn()
            .map_err(|e| format!("Failed to open URL in browser: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(clean_url)
            .spawn()
            .map_err(|e| format!("Failed to open URL in browser: {}", e))?;
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        return Err("Unsupported OS for native browser launch".to_string());
    }

    Ok(true)
}

/// Helper to find arduino-cli on host system
fn find_arduino_cli() -> Option<String> {
    let candidate_paths = [
        "arduino-cli",
        "/opt/homebrew/bin/arduino-cli",
        "/usr/local/bin/arduino-cli",
        "/usr/bin/arduino-cli",
        "C:\\Program Files\\Arduino CLI\\arduino-cli.exe",
    ];

    for path in candidate_paths {
        if let Ok(output) = Command::new(path).arg("version").output() {
            if output.status.success() {
                return Some(path.to_string());
            }
        }
    }
    None
}

/// Checks whether arduino-cli is installed and accessible
#[tauri::command]
fn check_arduino_cli() -> Result<bool, String> {
    Ok(find_arduino_cli().is_some())
}

/// Returns the detected arduino-cli version string
#[tauri::command]
fn get_arduino_cli_version() -> Result<String, String> {
    match find_arduino_cli() {
        Some(path) => {
            let output = Command::new(&path)
                .arg("version")
                .output()
                .map_err(|e| format!("Failed to run arduino-cli version: {}", e))?;
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Ok(stdout)
        }
        None => Err("arduino-cli is not installed or not found in system PATH".to_string()),
    }
}

/// Lists detected serial ports and connected hardware boards
#[tauri::command]
fn list_serial_ports() -> Result<Vec<String>, String> {
    let mut ports = Vec::new();

    // 1. Try arduino-cli board list if available
    if let Some(cli_path) = find_arduino_cli() {
        if let Ok(output) = Command::new(&cli_path).args(&["board", "list"]).output() {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines().skip(1) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if let Some(port) = parts.first() {
                    if !port.is_empty() && !ports.contains(&port.to_string()) {
                        ports.push(port.to_string());
                    }
                }
            }
        }
    }

    // 2. Fallback to scanning /dev on macOS / Linux
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        if let Ok(entries) = std::fs::read_dir("/dev") {
            for entry in entries.flatten() {
                if let Ok(name) = entry.file_name().into_string() {
                    if name.starts_with("cu.usb")
                        || name.starts_with("cu.wch")
                        || name.starts_with("cu.SLAB")
                        || name.starts_with("ttyUSB")
                        || name.starts_with("ttyACM")
                    {
                        let full_path = format!("/dev/{}", name);
                        if !ports.contains(&full_path) {
                            ports.push(full_path);
                        }
                    }
                }
            }
        }
    }

    Ok(ports)
}

/// Compiles an Arduino sketch in a sandboxed temporary directory
#[tauri::command]
fn compile_arduino_sketch(code: String, fqbn: Option<String>) -> Result<String, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH. Install via 'brew install arduino-cli' or official installer.".to_string()
    })?;

    let board_fqbn = fqbn.unwrap_or_else(|| "esp32:esp32:esp32".to_string());
    let temp_dir = std::env::temp_dir().join("resursee_esp32_sketch");
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create sketch directory: {}", e))?;

    let sketch_path = temp_dir.join("resursee_esp32_sketch.ino");
    std::fs::write(&sketch_path, code)
        .map_err(|e| format!("Failed to write sketch file: {}", e))?;

    let output = Command::new(&cli_path)
        .args(&[
            "compile",
            "--fqbn",
            &board_fqbn,
            temp_dir.to_str().unwrap_or(""),
        ])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli compile: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(format!("{}\n{}", stdout, stderr).trim().to_string())
    } else {
        Err(format!("Compilation failed:\n{}\n{}", stderr, stdout).trim().to_string())
    }
}

/// Uploads an Arduino sketch to the selected serial port
#[tauri::command]
fn upload_arduino_sketch(
    port: String,
    fqbn: Option<String>,
    code: String,
) -> Result<String, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH. Install via 'brew install arduino-cli' or official installer.".to_string()
    })?;

    let board_fqbn = fqbn.unwrap_or_else(|| "esp32:esp32:esp32".to_string());
    let temp_dir = std::env::temp_dir().join("resursee_esp32_sketch");
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create sketch directory: {}", e))?;

    let sketch_path = temp_dir.join("resursee_esp32_sketch.ino");
    std::fs::write(&sketch_path, code)
        .map_err(|e| format!("Failed to write sketch file: {}", e))?;

    let output = Command::new(&cli_path)
        .args(&[
            "upload",
            "-p",
            &port,
            "--fqbn",
            &board_fqbn,
            temp_dir.to_str().unwrap_or(""),
        ])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli upload: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(format!("Flash uploaded successfully!\n{}\n{}", stdout, stderr).trim().to_string())
    } else {
        Err(format!("Upload failed:\n{}\n{}", stderr, stdout).trim().to_string())
    }
}

/// Installs an Arduino library natively via arduino-cli
#[tauri::command]
fn install_arduino_library(library_name: String) -> Result<String, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH.".to_string()
    })?;

    let output = Command::new(&cli_path)
        .args(&["lib", "install", &library_name])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli lib install: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(format!("{}\n{}", stdout, stderr).trim().to_string())
    } else {
        Err(format!("Library installation failed:\n{}\n{}", stderr, stdout).trim().to_string())
    }
}

/// Searches the official Arduino library registry via arduino-cli lib search
#[tauri::command]
fn search_arduino_libraries(query: String) -> Result<serde_json::Value, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH.".to_string()
    })?;

    let output = Command::new(&cli_path)
        .args(&["lib", "search", &query, "--format", "json"])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli lib search: {}", e))?;

    if output.status.success() {
        let json: serde_json::Value = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("Failed to parse library search JSON: {}", e))?;
        Ok(json)
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Search failed: {}", err_msg))
    }
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
            ollama_proxy_request,
            open_external_url,
            check_arduino_cli,
            get_arduino_cli_version,
            list_serial_ports,
            compile_arduino_sketch,
            upload_arduino_sketch,
            install_arduino_library,
            search_arduino_libraries
        ])
        .run(tauri::generate_context!())
        .expect("error while running Resursee desktop application");
}

