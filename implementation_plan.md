# Termilo Implementation Plan

## Phase 1: Core UI & Dashboard (✅ Completed)
**Goal**: Establish the application shell, styling, and main dashboard view.
- **Tech Stack**: React, Tailwind CSS (v4), Shadcn UI, Tauri.
- **Theme**: Premium Dark (Slate/Blue palette).
- **Components**:
    - `MainLayout`: Sidebar + Content Shell.
    - `Sidebar`: Collapsible navigation.
    - `ConnectionsDashboard`: Grid view of server profiles.
    - `ConnectionCard`: UI for individual servers.
- **Status**: Implemented and verified (UI Polish complete).

## Phase 2: Connection Management (✅ Completed)
**Goal**: Enable CRUD operations for connection profiles.
- **State Management**: `ProfileStore` (Zustand + LocalStorage persistence).
- **Features**:
    - **Create**: `NewConnectionModal` with name, host, user, tags.
    - **Read**: Dynamic list in Dashboard.
    - **Update**: `EditConnectionModal`.
    - **Delete**: `DeleteConfirmDialog`.
- **Status**: Verified. Modals and Store are fully functional.

## Phase 3: Terminal & Session Logic (✅ Completed)
**Goal**: Implement the active terminal interface and session management.
- **State Management**: `SessionStore` (Manages active tabs/connections).
- **Components**:
    - `TerminalPage`: Main view for active sessions.
    - `TerminalTabs`: Tab bar for switching sessions.
    - `Terminal`: Wrapper for xterm.js.
- **Status**: Core functionality verified.

## Phase 4: Connection Management & Tree View (🚧 In Progress)
**Goal**: Implement a robust tree-view hierarchy for connection management and refine UI layout.
- **Features**:
    - **Tree View System**:
        - Support for nested folders (Country/Region > City > Sub Group).
        - Client grouping (Clients > Project Group).
        - Label/Tag-based organization (Personal/Company).
    - **UI Layout Reconsolidation**:
        - Update Sidebar/Dashboard to support collapsible tree structures.
        - Improve layout for dense hierarchies.
- **Process & Conventions**:
    - Proactive documentation updates (Task & Implementation Plan).
    - Document technical conventions (Icons, Store patterns).
- **Deferred Tasks**:
    - Cloud Sync (Moved to Phase 5).
    - SSH Advanced Features (Moved to Phase 5).

## Phase 5: Advanced Features (Scripting & Automation)
Goal: Add scripting capabilities and multi-session automation.

### Script Library
- [ ] Create `scriptStore` (id, name, content, description).
- [ ] Implement `ScriptManagerModal` for CRUD operations.
- [ ] Add built-in scripts (System Info, Docker Stats, etc.).

### Multi-Execution Logic
- [ ] Update `Session` interface to include `initialCommand`.
- [ ] Update `Terminal` component to execute `initialCommand` on connection success.
- [ ] Create `ScriptRunnerModal` to select multiple target connections.
- [ ] Implement execution logic:
    - If session active: Send command.
    - If not active: Open new session with `initialCommand`.
- **Split View**: Multiple terminals side-by-side.
- **Cloud Sync**: Google Drive integration for profiles.
- **SSH Advanced**: Key management, Agent forwarding.

## Components & File Structure Map
- `src/stores/`: `profileStore.ts`, `sessionStore.ts`
- `src/components/Modals/`: `ConnectionModal.tsx`, `DeleteConfirmDialog.tsx`
- `src/pages/`: `ConnectionsDashboard.tsx`, `TerminalPage.tsx`
- `src/components/Terminal/`: `Terminal.tsx`
