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

## Phase 3: Terminal & Session Logic (🚧 In Progress)
**Goal**: Implement the active terminal interface and session management.
- **State Management**: `SessionStore` (Manages active tabs/connections).
- **Components**:
    - `TerminalPage`: Main view for active sessions.
    - `TerminalTabs`: Tab bar for switching sessions.
    - `Terminal`: Wrapper for xterm.js.
- **Key Tasks**:
    - [x] Create SessionStore.
    - [x] Create TerminalPage UI.
    - [x] Route switching (Dashboard <-> Terminal).
    - [ ] Enhance `Terminal.tsx` with `fit-addon` and ResizeObserver.
    - [ ] Verify SSH/Native connection logic (Mocked for now).

## Phase 4: Advanced Features (📅 Planned)
**Goal**: Add professional developer features.
- **Script Library**: Store and run snippets.
- **Split View**: Multiple terminals side-by-side.
- **Cloud Sync**: Google Drive integration for profiles.
- **SSH Advanced**: Key management, Agent forwarding, SFTP.

## Components & File Structure Map
- `src/stores/`: `profileStore.ts`, `sessionStore.ts`
- `src/components/Modals/`: `ConnectionModal.tsx`, `DeleteConfirmDialog.tsx`
- `src/pages/`: `ConnectionsDashboard.tsx`, `TerminalPage.tsx`
- `src/components/Terminal/`: `Terminal.tsx`
