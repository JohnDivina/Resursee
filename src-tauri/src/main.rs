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
    let mut usb_ports = Vec::new();
    let mut other_ports = Vec::new();

    // 1. Try arduino-cli board list --format json if available
    if let Some(cli_path) = find_arduino_cli() {
        if let Ok(output) = Command::new(&cli_path).args(&["board", "list", "--format", "json"]).output() {
            if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&output.stdout) {
                if let Some(detected) = val.get("detected_ports").and_then(|v| v.as_array()) {
                    for item in detected {
                        if let Some(addr) = item.get("port").and_then(|p| p.get("address")).and_then(|a| a.as_str()) {
                            let proto_label = item.get("port").and_then(|p| p.get("protocol_label")).and_then(|l| l.as_str()).unwrap_or("");
                            let addr_lower = addr.to_lowercase();
                            let is_virtual = addr_lower.contains("bluetooth")
                                || addr_lower.contains("debug")
                                || addr_lower.contains("wlan")
                                || addr.ends_with("/dev/cu.F9");

                            let is_usb = proto_label.to_lowercase().contains("usb")
                                || addr_lower.contains("usbmodem")
                                || addr_lower.contains("usbserial")
                                || addr_lower.contains("wch")
                                || addr_lower.contains("slab")
                                || addr_lower.contains("ttyusb")
                                || addr_lower.contains("ttyacm");

                            if is_usb {
                                if !usb_ports.contains(&addr.to_string()) {
                                    usb_ports.push(addr.to_string());
                                }
                            } else if !is_virtual {
                                if !other_ports.contains(&addr.to_string()) {
                                    other_ports.push(addr.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Scan /dev on macOS / Linux for USB hardware serial devices
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        if let Ok(entries) = std::fs::read_dir("/dev") {
            for entry in entries.flatten() {
                if let Ok(name) = entry.file_name().into_string() {
                    if name.starts_with("cu.usbmodem")
                        || name.starts_with("cu.usbserial")
                        || name.starts_with("cu.wch")
                        || name.starts_with("cu.SLAB")
                        || name.starts_with("ttyUSB")
                        || name.starts_with("ttyACM")
                    {
                        let full_path = format!("/dev/{}", name);
                        if !usb_ports.contains(&full_path) {
                            usb_ports.push(full_path);
                        }
                    }
                }
            }
        }
    }

    // Prioritize USB hardware ports first
    usb_ports.extend(other_ports);
    Ok(usb_ports)
}

/// Compiles an Arduino sketch in a sandboxed temporary directory with live line-by-line output
#[tauri::command]
fn compile_arduino_sketch(
    code: String,
    fqbn: Option<String>,
    on_output: tauri::ipc::Channel<String>,
) -> Result<String, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH. Install via 'brew install arduino-cli' or official installer.".to_string()
    })?;

    let mut board_fqbn = fqbn.unwrap_or_else(|| "esp32:esp32:esp32".to_string());
    if (board_fqbn.contains("esp32s3") || board_fqbn.contains("esp32c3")) && !board_fqbn.contains("CDCOnBoot") {
        board_fqbn = format!("{}:CDCOnBoot=cdc", board_fqbn);
    }

    let temp_dir = std::env::temp_dir().join("resursee_esp32_sketch");
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create sketch directory: {}", e))?;

    let sketch_path = temp_dir.join("resursee_esp32_sketch.ino");
    std::fs::write(&sketch_path, code)
        .map_err(|e| format!("Failed to write sketch file: {}", e))?;

    let mut child = Command::new(&cli_path)
        .args(&[
            "compile",
            "--fqbn",
            &board_fqbn,
            temp_dir.to_str().unwrap_or(""),
        ])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start arduino-cli compile: {}", e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let channel_out = on_output.clone();
    let t_out = std::thread::spawn(move || {
        if let Some(stdout) = stdout {
            use std::io::BufRead;
            let reader = std::io::BufReader::new(stdout);
            for line in reader.lines().flatten() {
                let _ = channel_out.send(line);
            }
        }
    });

    let channel_err = on_output.clone();
    let t_err = std::thread::spawn(move || {
        if let Some(stderr) = stderr {
            use std::io::BufRead;
            let reader = std::io::BufReader::new(stderr);
            for line in reader.lines().flatten() {
                let _ = channel_err.send(line);
            }
        }
    });

    let _ = t_out.join();
    let _ = t_err.join();

    let status = child.wait().map_err(|e| format!("Process error: {}", e))?;
    if status.success() {
        Ok("✓ Compilation successful! Ready to upload.".to_string())
    } else {
        Err(format!("Compilation failed with exit status {:?}", status.code()))
    }
}

/// Uploads an Arduino sketch to the selected serial port with live line-by-line output
#[tauri::command]
fn upload_arduino_sketch(
    port: String,
    fqbn: Option<String>,
    code: String,
    on_output: tauri::ipc::Channel<String>,
) -> Result<String, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH. Install via 'brew install arduino-cli' or official installer.".to_string()
    })?;

    // Release port from any active serial monitor session before uploading
    let _ = Command::new("pkill").args(&["-f", "arduino-cli monitor"]).output();

    let mut board_fqbn = fqbn.unwrap_or_else(|| "esp32:esp32:esp32".to_string());
    if (board_fqbn.contains("esp32s3") || board_fqbn.contains("esp32c3")) && !board_fqbn.contains("CDCOnBoot") {
        board_fqbn = format!("{}:CDCOnBoot=cdc", board_fqbn);
    }

    let temp_dir = std::env::temp_dir().join("resursee_esp32_sketch");
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create sketch directory: {}", e))?;

    let sketch_path = temp_dir.join("resursee_esp32_sketch.ino");
    std::fs::write(&sketch_path, code)
        .map_err(|e| format!("Failed to write sketch file: {}", e))?;

    let mut child = Command::new(&cli_path)
        .args(&[
            "compile",
            "--upload",
            "-p",
            &port,
            "--fqbn",
            &board_fqbn,
            temp_dir.to_str().unwrap_or(""),
        ])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start arduino-cli compile --upload: {}", e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let channel_out = on_output.clone();
    let t_out = std::thread::spawn(move || {
        if let Some(stdout) = stdout {
            use std::io::BufRead;
            let reader = std::io::BufReader::new(stdout);
            for line in reader.lines().flatten() {
                let _ = channel_out.send(line);
            }
        }
    });

    let channel_err = on_output.clone();
    let t_err = std::thread::spawn(move || {
        if let Some(stderr) = stderr {
            use std::io::BufRead;
            let reader = std::io::BufReader::new(stderr);
            for line in reader.lines().flatten() {
                let _ = channel_err.send(line);
            }
        }
    });

    let _ = t_out.join();
    let _ = t_err.join();

    let status = child.wait().map_err(|e| format!("Process error: {}", e))?;
    if status.success() {
        Ok("✓ Flash uploaded successfully! ESP32 reset and running new firmware.".to_string())
    } else {
        Err(format!("Upload failed with exit status {:?}", status.code()))
    }
}

static ACTIVE_MONITOR_STDIN: std::sync::Mutex<Option<std::process::ChildStdin>> = std::sync::Mutex::new(None);

/// Natively streams serial monitor characters in real time without block buffering
#[tauri::command]
fn start_serial_monitor(
    port: String,
    baudrate: Option<u32>,
    on_line: tauri::ipc::Channel<String>,
) -> Result<(), String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH.".to_string()
    })?;

    // Stop any existing monitor before starting a new one
    {
        let mut stdin_guard = ACTIVE_MONITOR_STDIN.lock().unwrap();
        *stdin_guard = None;
    }
    let _ = Command::new("pkill").args(&["-f", "arduino-cli monitor"]).output();

    let baud = baudrate.unwrap_or(115200);
    let baud_config = format!("baudrate={},dtr=on,rts=off", baud);

    std::thread::spawn(move || {
        use std::io::Read;
        if let Ok(mut child) = Command::new(&cli_path)
            .args(&[
                "monitor",
                "-p",
                &port,
                "-c",
                &baud_config,
                "-q",
            ])
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
        {
            // Hold stdin handle in static Mutex so it is never closed/EOF'd
            if let Some(stdin) = child.stdin.take() {
                let mut stdin_guard = ACTIVE_MONITOR_STDIN.lock().unwrap();
                *stdin_guard = Some(stdin);
            }

            let on_line_err = on_line.clone();
            if let Some(mut stderr) = child.stderr.take() {
                std::thread::spawn(move || {
                    let mut err_buf = [0u8; 512];
                    while let Ok(n) = stderr.read(&mut err_buf) {
                        if n == 0 {
                            break;
                        }
                        let text = String::from_utf8_lossy(&err_buf[..n]).to_string();
                        let _ = on_line_err.send(text);
                    }
                });
            }

            if let Some(mut stdout) = child.stdout.take() {
                let mut buf = [0u8; 512];
                while let Ok(n) = stdout.read(&mut buf) {
                    if n == 0 {
                        break;
                    }
                    let text = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = on_line.send(text);
                }
            }
        }
    });

    Ok(())
}

/// Stops the native serial monitor process
#[tauri::command]
fn stop_serial_monitor() -> Result<(), String> {
    {
        let mut stdin_guard = ACTIVE_MONITOR_STDIN.lock().unwrap();
        *stdin_guard = None;
    }
    let _ = Command::new("pkill").args(&["-f", "arduino-cli monitor"]).output();
    Ok(())
}

/// Sends raw ASCII input directly to the running serial monitor's stdin
#[tauri::command]
fn send_serial_monitor_input(input: String) -> Result<(), String> {
    let mut stdin_guard = ACTIVE_MONITOR_STDIN.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut stdin) = *stdin_guard {
        use std::io::Write;
        stdin.write_all(format!("{}\n", input).as_bytes()).map_err(|e| e.to_string())?;
        stdin.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Serial monitor is not currently running".to_string())
    }
}

/// Sends a hardware reset pulse to the ESP32 board
#[tauri::command]
fn reset_esp32_board(port: String) -> Result<String, String> {
    // Release any active monitor so port is free
    {
        let mut stdin_guard = ACTIVE_MONITOR_STDIN.lock().unwrap();
        *stdin_guard = None;
    }
    let _ = Command::new("pkill").args(&["-f", "arduino-cli monitor"]).output();

    #[cfg(target_os = "macos")]
    let esptool_candidates = [
        "/Users/johnrey/Library/Arduino15/packages/esp32/tools/esptool_py/5.3.1/esptool",
        "/Users/johnrey/Library/Arduino15/packages/esp32/tools/esptool_py/4.5.1/esptool",
    ];
    #[cfg(not(target_os = "macos"))]
    let esptool_candidates = ["esptool.exe", "esptool"];

    for tool in esptool_candidates {
        if std::path::Path::new(tool).exists() {
            let res = Command::new(tool)
                .args(&["--port", &port, "run"])
                .output();
            if let Ok(out) = res {
                if out.status.success() {
                    return Ok("ESP32 hardware reset pulse sent successfully via RTS pin.".to_string());
                }
            }
        }
    }

    Ok("Reset signal dispatched.".to_string())
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

/// Lists installed board cores via arduino-cli core list
#[tauri::command]
fn list_installed_cores() -> Result<serde_json::Value, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH.".to_string()
    })?;

    let output = Command::new(&cli_path)
        .args(&["core", "list", "--format", "json"])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli core list: {}", e))?;

    if output.status.success() {
        let json: serde_json::Value = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("Failed to parse core list JSON: {}", e))?;
        Ok(json)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Installs an Arduino board core package (e.g. "esp32:esp32", "esp8266:esp8266")
#[tauri::command]
fn install_arduino_core(core_name: String) -> Result<String, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH.".to_string()
    })?;

    let output = Command::new(&cli_path)
        .args(&["core", "install", &core_name])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli core install: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(format!("{}\n{}", stdout, stderr).trim().to_string())
    } else {
        Err(format!("Core installation failed:\n{}\n{}", stderr, stdout).trim().to_string())
    }
}

/// Uninstalls an Arduino board core package
#[tauri::command]
fn uninstall_arduino_core(core_name: String) -> Result<String, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH.".to_string()
    })?;

    let output = Command::new(&cli_path)
        .args(&["core", "uninstall", &core_name])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli core uninstall: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(format!("{}\n{}", stdout, stderr).trim().to_string())
    } else {
        Err(format!("Core uninstallation failed:\n{}\n{}", stderr, stdout).trim().to_string())
    }
}

/// Lists installed libraries via arduino-cli lib list
#[tauri::command]
fn list_installed_libraries() -> Result<serde_json::Value, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH.".to_string()
    })?;

    let output = Command::new(&cli_path)
        .args(&["lib", "list", "--format", "json"])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli lib list: {}", e))?;

    if output.status.success() {
        let json: serde_json::Value = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("Failed to parse lib list JSON: {}", e))?;
        Ok(json)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Uninstalls an Arduino library via arduino-cli lib uninstall
#[tauri::command]
fn uninstall_arduino_library(library_name: String) -> Result<String, String> {
    let cli_path = find_arduino_cli().ok_or_else(|| {
        "arduino-cli is not installed or not in PATH.".to_string()
    })?;

    let output = Command::new(&cli_path)
        .args(&["lib", "uninstall", &library_name])
        .output()
        .map_err(|e| format!("Failed to execute arduino-cli lib uninstall: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(format!("{}\n{}", stdout, stderr).trim().to_string())
    } else {
        Err(format!("Library uninstallation failed:\n{}\n{}", stderr, stdout).trim().to_string())
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
            uninstall_arduino_library,
            search_arduino_libraries,
            list_installed_cores,
            install_arduino_core,
            uninstall_arduino_core,
            list_installed_libraries,
            start_serial_monitor,
            stop_serial_monitor,
            send_serial_monitor_input,
            reset_esp32_board
        ])
        .run(tauri::generate_context!())
        .expect("error while running Resursee desktop application");
}

