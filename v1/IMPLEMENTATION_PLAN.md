# XTerm SSH Terminal Implementation Plan

## Overview
This document outlines the complete implementation plan for integrating SSH terminal functionality into Termilo, based on v1 legacy code analysis and current codebase requirements.

---

## 📊 V1 vs Current Code Comparison

### ✅ V1 Strengths (Legacy Code - What We Should Adopt)

#### **Frontend Architecture:**

1. **Robust Terminal Lifecycle Management** (`v1/src/components/terminal/TerminalPanel.tsx`)
   - Proper ref-based state tracking to prevent double initialization
   - `isInitialized`, `isConnecting`, `streamStarted` flags
   - Cleanup handlers with proper disposal patterns
   - Auto-connect logic with debouncing

2. **Event-Driven SSH Communication**
   - Uses Tauri events for bidirectional streaming:
     - `ssh-output` - Terminal output from backend
     - `ssh-output-closed` - Connection closed notification
     - `ssh-output-error` - Error handling
   - Separate invoke commands:
     - `connect_ssh` - Initiate connection
     - `send_command` - Send keyboard input
     - `read_output_stream` - Start output streaming
     - `disconnect_ssh` - Cleanup connection

3. **Better State Management** (`v1/src/store/useStore.ts`)
   - Cleaner session/profile separation
   - Runtime-only sessions (not persisted)
   - Better connection state tracking:
     ```typescript
     interface Session {
         id: string;
         profileId: string;
         profileName: string;
         isConnected: boolean;
         isConnecting: boolean;
     }
     ```

4. **Visual Connection Feedback**
   - Loading overlay during connection
   - Connection status messages in terminal
   - Proper error display with ANSI colors

5. **Keyboard Input Handling**
   - Dedicated ref for keyboard handler disposal
   - Only active when connected
   - Proper cleanup on disconnect

### ⚠️ Current Code Gaps

1. **No Backend SSH Implementation**
   - Missing Tauri commands (connect_ssh, send_command, etc.)
   - No SSH client integration
   - No event emission system

2. **Terminal Component Oversimplified** (`src/components/Terminal/Terminal.tsx`)
   - No connection state management
   - No event listeners
   - Basic demo mode only
   - Missing auto-connect logic

3. **Session Store Missing Connection States**
   - Only has basic connecting/connected/disconnected
   - No isConnecting flag
   - No connection result tracking

---

## 🎯 Implementation Roadmap

### **Phase 1: Backend SSH Foundation** ⭐ PRIORITY

#### 1.1 Rust Dependencies Setup

**File:** `src-tauri/Cargo.toml`

```toml
[dependencies]
# Existing dependencies...
ssh2 = "0.9.5"              # SSH client library
tokio = { version = "1.47", features = ["full"] }
parking_lot = "0.12"        # Better mutex performance
bytes = "1.5"               # Buffer management
```

**Why these libraries:**
- `ssh2`: Mature, well-tested SSH2 protocol implementation (libssh2 bindings)
- `tokio`: Async runtime for non-blocking I/O
- `parking_lot`: More efficient mutexes than std
- `bytes`: Zero-copy buffer handling for terminal streams

#### 1.2 SSH Session Manager Module

**File:** `src-tauri/src/ssh_manager.rs` (NEW)

**Key Components:**

```rust
use ssh2::Session;
use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::Mutex;
use tauri::Manager;

// Session data structure
pub struct SshSession {
    pub id: String,
    pub session: Session,
    pub channel: Option<ssh2::Channel>,
    pub is_connected: bool,
}

// Global session manager
pub struct SshManager {
    sessions: Arc<Mutex<HashMap<String, SshSession>>>,
}

impl SshManager {
    pub fn new() -> Self {
        SshManager {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn connect(&self, profile: SshProfile, session_id: String) -> Result<(), String>;
    pub async fn send_input(&self, session_id: &str, data: &str) -> Result<(), String>;
    pub async fn disconnect(&self, session_id: &str) -> Result<(), String>;
    pub async fn start_output_stream(&self, session_id: String, app_handle: tauri::AppHandle) -> Result<(), String>;
}
```

**Core Responsibilities:**
1. Manage SSH connections lifecycle
2. Handle authentication (password & key-based)
3. Spawn PTY channels
4. Bridge terminal I/O

#### 1.3 Tauri Commands Implementation

**File:** `src-tauri/src/commands.rs` (NEW)

```rust
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
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

#[tauri::command]
pub async fn connect_ssh(
    profile: SshProfile,
    session_id: String,
    manager: State<'_, Arc<SshManager>>,
    app: tauri::AppHandle,
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
```

#### 1.4 Event System for Terminal Output

**Events to emit:**

1. **`ssh-output`**
   ```json
   { "session_id": "uuid", "data": "terminal output" }
   ```

2. **`ssh-output-closed`**
   ```json
   { "session_id": "uuid", "message": "Connection closed by remote host" }
   ```

3. **`ssh-output-error`**
   ```json
   { "session_id": "uuid", "error": "Authentication failed" }
   ```

**Implementation Pattern:**
```rust
// In output stream reader
tokio::spawn(async move {
    let mut buf = [0u8; 8192];
    loop {
        match channel.read(&mut buf) {
            Ok(n) if n > 0 => {
                let data = String::from_utf8_lossy(&buf[..n]).to_string();
                app_handle.emit_all("ssh-output", SshOutputPayload {
                    session_id: session_id.clone(),
                    data,
                }).ok();
            },
            Ok(_) => break, // EOF
            Err(e) => {
                app_handle.emit_all("ssh-output-error", SshErrorPayload {
                    session_id: session_id.clone(),
                    error: e.to_string(),
                }).ok();
                break;
            }
        }
    }
});
```

#### 1.5 Update lib.rs

**File:** `src-tauri/src/lib.rs`

```rust
mod ssh_manager;
mod commands;

use ssh_manager::SshManager;
use std::sync::Arc;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

### **Phase 2: Frontend Integration** ⭐ HIGH PRIORITY

#### 2.1 Enhanced Terminal Component

**File:** `src/components/Terminal/Terminal.tsx`

**Changes needed:**
1. Add session connection logic from v1
2. Implement Tauri event listeners
3. Add keyboard input forwarding
4. Add connection state UI
5. Add auto-connect functionality

**Key additions:**
```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface TerminalProps {
    sessionId: string;
    profileId: string;
    onConnectionChange?: (connected: boolean) => void;
}

// Add event listeners for ssh-output, ssh-output-closed, ssh-output-error
// Add invoke calls for connect_ssh, send_command, disconnect_ssh
// Add proper lifecycle management with refs
```

#### 2.2 Update Session Store

**File:** `src/store/sessionStore.ts`

**Add missing fields:**
```typescript
export interface Session {
    id: string;
    profileId: string;
    title: string;
    status: 'connecting' | 'connected' | 'disconnected';
    timestamp: number;
    // ADD THESE:
    isConnected: boolean;
    isConnecting: boolean;
}
```

#### 2.3 Update TerminalPage

**File:** `src/pages/TerminalPage.tsx`

**Changes:**
1. Pass sessionId and profileId to Terminal component
2. Handle connection state updates
3. Add loading overlay like v1
4. Update status bar with real connection info

---

### **Phase 3: Authentication & Error Handling**

#### 3.1 SSH Key File Picker

**Implementation:**
- Use Tauri dialog plugin to select key files
- Validate key format before connection
- Support passphrase-protected keys

#### 3.2 Password Authentication Modal

**Create:** `src/components/Modals/PasswordPromptModal.tsx`
- Prompt for password if not stored
- Option to save password (encrypted in store)
- Retry mechanism

#### 3.3 Error Handling

**Backend:**
- Detailed error messages (auth failed, timeout, unreachable)
- Connection retry logic
- Graceful disconnect handling

**Frontend:**
- Display connection errors in terminal
- Show retry button on failure
- Log errors to console for debugging

---

### **Phase 4: Advanced Features**

#### 4.1 Terminal Resize Handling

**Backend:**
```rust
#[tauri::command]
pub async fn resize_terminal(
    session_id: String,
    cols: u32,
    rows: u32,
    manager: State<'_, Arc<SshManager>>,
) -> Result<(), String> {
    manager.resize_pty(&session_id, cols, rows).await
}
```

**Frontend:**
```typescript
// In Terminal component
useEffect(() => {
    const handleResize = () => {
        if (fitAddon) {
            fitAddon.fit();
            const dims = fitAddon.proposeDimensions();
            if (dims && session?.isConnected) {
                invoke('resize_terminal', {
                    sessionId,
                    cols: dims.cols,
                    rows: dims.rows,
                }).catch(console.error);
            }
        }
    };
    // ... attach listener
}, []);
```

#### 4.2 Session Reconnection

- Auto-reconnect on connection loss
- Reconnect button in UI
- Session state preservation

#### 4.3 Multiple Simultaneous Sessions

- Already supported by session manager architecture
- Each session has unique ID
- Sessions managed independently

---

## 🔧 Technical Implementation Details

### SSH Connection Flow

```
1. User clicks "Connect" on profile
   ↓
2. Frontend: sessionStore.addSession(profileId)
   ↓
3. Terminal component mounts with sessionId
   ↓
4. Auto-connect triggered
   ↓
5. invoke('connect_ssh', { profile, sessionId })
   ↓
6. Backend: SshManager.connect()
   - TCP connect to host:port
   - SSH handshake
   - Authentication (password/key)
   - Request PTY channel
   - Start shell
   ↓
7. invoke('read_output_stream', { sessionId })
   ↓
8. Backend: Spawn tokio task to read channel output
   - Read data in chunks
   - Emit 'ssh-output' events to frontend
   ↓
9. Frontend: listen('ssh-output')
   - Write data to xterm instance
   ↓
10. User types → terminal.onData()
   ↓
11. invoke('send_command', { sessionId, command })
   ↓
12. Backend: Write to SSH channel
```

### Authentication Methods

#### Password Authentication
```rust
session.userauth_password(&username, &password)?;
```

#### Key-based Authentication
```rust
session.userauth_pubkey_file(
    &username,
    None,
    Path::new(&key_path),
    None, // or Some(passphrase)
)?;
```

### Buffer Management

**Backend:**
- Use 8KB read buffer for optimal performance
- Non-blocking reads with timeout
- UTF-8 validation before emitting

**Frontend:**
- xterm.js handles buffer internally
- Direct write for max performance
- No intermediate buffering needed

---

## 📋 File Checklist

### Backend (New Files)
- [ ] `src-tauri/src/ssh_manager.rs` - SSH session management
- [ ] `src-tauri/src/commands.rs` - Tauri command handlers

### Backend (Modified)
- [ ] `src-tauri/src/lib.rs` - Add command handlers and state
- [ ] `src-tauri/Cargo.toml` - Add dependencies

### Frontend (Modified)
- [ ] `src/components/Terminal/Terminal.tsx` - Add SSH integration
- [ ] `src/store/sessionStore.ts` - Add connection state fields
- [ ] `src/pages/TerminalPage.tsx` - Update with connection handling

### Frontend (Optional New)
- [ ] `src/components/Modals/PasswordPromptModal.tsx`
- [ ] `src/hooks/useSSHConnection.ts` - Custom hook for SSH logic

---

## 🚀 Quick Start Implementation Order

### Step 1: Minimal Viable SSH (1-2 days)
1. Add Rust dependencies
2. Create basic `ssh_manager.rs` with password auth only
3. Implement `connect_ssh` and `send_command` commands
4. Update `Terminal.tsx` with v1 patterns
5. Test with single session

### Step 2: Output Streaming (1 day)
1. Implement `read_output_stream` with tokio spawn
2. Add event listeners in Terminal component
3. Test bidirectional I/O

### Step 3: Multi-Session Support (1 day)
1. Test multiple concurrent sessions
2. Handle session switching
3. Proper cleanup on disconnect

### Step 4: Polish (1-2 days)
1. Add key-based auth
2. Error handling and UI
3. Terminal resize
4. Connection state UI

---

## ⚠️ Important Implementation Notes

### From V1 Analysis:

1. **Prevent Double Initialization**
   ```typescript
   const isInitialized = useRef(false);
   // Check this before creating terminal
   ```

2. **Debounce Auto-Connect**
   ```typescript
   setTimeout(() => connectToSSH(), 100);
   ```

3. **Separate Stream Start from Connection**
   - First call `connect_ssh`
   - Then call `read_output_stream` after 500ms delay
   - This prevents race conditions

4. **Cleanup Pattern**
   ```typescript
   useEffect(() => {
       return () => {
           // Cleanup code with empty deps array
       };
   }, []); // Only on unmount
   ```

5. **Keyboard Handler Disposal**
   - Must dispose previous handler before attaching new one
   - Store in ref for cleanup

### Backend Performance Tips:

1. **Use parking_lot::Mutex instead of std::sync::Mutex**
   - Faster lock acquisition
   - No poisoning

2. **Channel Reading**
   - Non-blocking reads with timeout
   - Use `channel.set_blocking(false)`
   - Read in chunks (8KB optimal)

3. **Event Emission**
   - Emit frequently but not per-byte
   - Batch small reads

---

## 🧪 Testing Strategy

### Backend Testing
1. Unit tests for SshManager methods
2. Mock SSH server for integration tests
3. Connection pooling stress tests

### Frontend Testing
1. Component tests with mocked invoke
2. Event listener cleanup verification
3. Multi-tab switching tests

### End-to-End
1. Real SSH connection to localhost
2. Long-running session stability
3. Reconnection scenarios
4. Terminal resize verification

---

## 📚 Reference Links

- [ssh2-rs Documentation](https://docs.rs/ssh2/latest/ssh2/)
- [Tauri Events Guide](https://tauri.app/v1/guides/features/events)
- [xterm.js API](https://xtermjs.org/docs/api/terminal/classes/terminal/)
- [Tokio Async Book](https://tokio.rs/tokio/tutorial)

---

**Last Updated:** 2025-12-25
**Status:** Ready for Implementation
**Estimated Completion:** 4-6 days
