# SSH Manager Fixes Applied

## Overview
Fixed compilation errors in `src-tauri/src/ssh_manager.rs` based on correct ssh2 crate API usage.

---

## Compilation Errors Fixed

### 1. ✅ Missing I/O Trait Imports

**Error:**
```
error[E0599]: no method named `write` found for reference `&ssh2::Channel`
  = help: items from traits can only be used if the trait is in scope
help: trait `Write` which provides `write` is implemented but not in scope
```

**Fix:**
```rust
use std::io::{Read, Write};
```

**Why:** The `read()` and `write()` methods come from `std::io::Read` and `std::io::Write` traits which must be in scope.

---

### 2. ✅ set_blocking() Method Location

**Error:**
```
error[E0599]: no method named `set_blocking` found for struct `ssh2::Channel`
```

**Fix:**
```rust
// WRONG: channel.set_blocking(false);
// CORRECT:
session.set_blocking(false);  // Set on Session, not Channel
```

**Why:** In ssh2 crate, blocking mode is controlled at the Session level, not per-Channel. The Session's blocking setting affects all channels created from it.

**Location in code:** Line 79 in `ssh_manager.rs`

---

### 3. ✅ Tauri 2 Event Emission API

**Error:**
```
error[E0599]: no method named `emit_all` found for struct `AppHandle`
help: there is a method `emit` with a similar name
```

**Fix:**
```rust
// WRONG: app_handle.emit_all("ssh-output", payload)
// CORRECT:
app_handle.emit("ssh-output", payload)
```

**Why:** Tauri 2.x changed the event API. `emit()` now broadcasts to all windows by default. The `emit_all()` method doesn't exist in Tauri 2.

**Changed in:**
- Line 204: `ssh-output-closed` event
- Line 215: `ssh-output` event
- Line 228: `ssh-output-error` event

---

### 4. ✅ Mutable Channel Borrowing

**Error:**
```
error[E0596]: cannot borrow `*channel` as mutable, as it is behind a `&` reference
```

**Fix:**
```rust
// WRONG: Get immutable reference
let session = sessions.get(session_id)?;
if let Some(channel) = &session.channel {
    channel.write(...) // Can't mutate through & reference
}

// CORRECT: Get mutable reference
let mut sessions = self.sessions.lock();
let session = sessions.get_mut(session_id)?;
if let Some(channel) = &mut session.channel {
    channel.write_all(...) // Can mutate through &mut
}
```

**Why:** Writing to a channel requires mutable access. Must use `get_mut()` on the HashMap and `&mut` when destructuring.

**Fixed in:**
- `send_input()` method (line 135-140)
- `start_output_stream()` method (line 186-189)
- `resize_pty()` method (line 254-259)

---

### 5. ✅ Write Method Usage

**Change:**
```rust
// OLD: Manual loop with partial write handling
while total_written < data_bytes.len() {
    match channel.write(&data_bytes[total_written..]) {
        Ok(0) => return Err("Channel closed"),
        Ok(n) => total_written += n,
        Err(e) if e.kind() == WouldBlock => continue,
        Err(e) => return Err(e),
    }
}

// NEW: Use write_all() which handles partial writes
channel.write_all(data.as_bytes())?;
channel.flush()?;
```

**Why:** `write_all()` is a convenience method that handles partial writes internally, making the code cleaner and less error-prone.

---

### 6. ✅ Payload Structs Must Implement Clone

**Error (implicit):**
```
Events require Clone trait for payload types
```

**Fix:**
```rust
#[derive(Debug, Serialize, Clone)]  // Added Clone
pub struct SshOutputPayload {
    pub session_id: String,
    pub data: String,
}
```

**Why:** Tauri's event system clones payloads when broadcasting, so all event payload types must implement `Clone`.

**Applied to:**
- `SshOutputPayload`
- `SshErrorPayload`
- `SshClosedPayload`

---

### 7. ✅ Output Loop Optimization

**Added:**
```rust
loop {
    // Small delay to prevent tight loop
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

    // Read from channel...
}
```

**Why:** Without a delay, the non-blocking read loop would spin at 100% CPU when no data is available. A 10ms delay prevents excessive CPU usage while keeping latency low.

**Location:** Line 182 in `start_output_stream()`

---

## Complete Diff Summary

### Imports Added
```rust
+ use std::io::{Read, Write};
```

### Session Setup
```rust
- channel.set_blocking(false);  // WRONG
+ session.set_blocking(false);  // CORRECT
```

### Event Emission
```rust
- app_handle.emit_all("event", payload)  // Tauri 1.x
+ app_handle.emit("event", payload)      // Tauri 2.x
```

### Mutable Borrows
```rust
- let sessions = self.sessions.lock();
- let session = sessions.get(session_id)?;
+ let mut sessions = self.sessions.lock();
+ let session = sessions.get_mut(session_id)?;

- if let Some(channel) = &session.channel {
+ if let Some(channel) = &mut session.channel {
```

### Write Operations
```rust
- channel.write(&data[..])?;
+ channel.write_all(data.as_bytes())?;
+ channel.flush()?;
```

### Payload Derives
```rust
- #[derive(Debug, Serialize)]
+ #[derive(Debug, Serialize, Clone)]
```

---

## Testing Recommendations

### 1. Unit Test Send Input
```rust
#[tokio::test]
async fn test_send_input() {
    // Create SSH manager
    // Connect to localhost SSH
    // Send test string
    // Verify it arrives
}
```

### 2. Test Non-Blocking Behavior
```rust
#[tokio::test]
async fn test_output_stream_non_blocking() {
    // Start output stream
    // Verify CPU usage stays low
    // Verify data arrives when available
}
```

### 3. Test Event Emission
```rust
#[tokio::test]
async fn test_events_emitted() {
    // Listen for ssh-output event
    // Connect and read data
    // Verify event received
}
```

---

## Build Requirements

### Linux
```bash
# Install GTK dependencies (required for Tauri on Linux)
sudo apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    libssl-dev \
    pkg-config

# Then build
cargo build --manifest-path src-tauri/Cargo.toml
```

### macOS
```bash
# No additional dependencies needed
cargo build --manifest-path src-tauri/Cargo.toml
```

### Windows
```bash
# Install WebView2 runtime (usually pre-installed on Windows 11)
# Then build
cargo build --manifest-path src-tauri/Cargo.toml
```

---

## API Reference

### ssh2 Crate Key Points

1. **Session Blocking Mode**
   - Controls blocking for ALL channels from that session
   - Set BEFORE creating channels
   - `session.set_blocking(false)` for non-blocking I/O

2. **Channel Lifetime**
   - Channels must outlive the session they came from
   - Dropping a channel doesn't close the session
   - Must call `channel.close()` and `channel.wait_close()` for clean shutdown

3. **Read/Write Methods**
   - `channel.read(&mut buf)` - Returns bytes read or WouldBlock
   - `channel.write_all(data)` - Writes all data, handles partial writes
   - `channel.flush()` - Ensures data is sent

4. **PTY Methods**
   - `request_pty(term, modes, dim)` - Request pseudo-terminal
   - `request_pty_size(cols, rows, width_px, height_px)` - Resize PTY
   - `shell()` - Start interactive shell

### Tauri 2 Event System

1. **Emit Events**
   ```rust
   app_handle.emit("event-name", payload)?;
   ```
   - Broadcasts to all windows
   - Payload must be Serializable + Clone

2. **Listen from Frontend**
   ```typescript
   import { listen } from '@tauri-apps/api/event';

   const unlisten = await listen('event-name', (event) => {
       console.log(event.payload);
   });
   ```

---

## Performance Considerations

### 1. Mutex Lock Duration
```rust
// BAD: Hold lock during async operation
let sessions = self.sessions.lock();
tokio::time::sleep(...).await;  // Lock held too long!

// GOOD: Release lock before await
let data = {
    let sessions = self.sessions.lock();
    sessions.get(id).clone()
}; // Lock released
tokio::time::sleep(...).await;
```

### 2. Buffer Size
```rust
let mut buffer = vec![0u8; 8192];  // 8KB optimal for terminal I/O
```
- Smaller buffers increase overhead
- Larger buffers increase latency
- 8KB is sweet spot for SSH terminal traffic

### 3. Loop Delay
```rust
tokio::time::sleep(Duration::from_millis(10)).await;
```
- 10ms = 100Hz polling rate
- Balances CPU usage vs. responsiveness
- Adjust if needed based on profiling

---

## Troubleshooting

### Build Fails on Linux
**Problem:** Missing GTK/WebKit libraries
**Solution:** Install system dependencies (see Build Requirements)

### SSH Connection Hangs
**Problem:** Blocking mode not set correctly
**Solution:** Verify `session.set_blocking(false)` is called before handshake

### Terminal Not Responding
**Problem:** Event listeners not receiving data
**Solution:** Check that `read_output_stream()` was called after connection

### High CPU Usage
**Problem:** Tight loop in output reading
**Solution:** Ensure delay is present in read loop (line 182)

---

**Last Updated:** 2025-12-25
**Commit:** 8185063
**Status:** ✅ All compilation errors fixed
