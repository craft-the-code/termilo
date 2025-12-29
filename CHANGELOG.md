# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2025-12-30

### 🚀 Added
- **Scripting Engine**: Added a comprehensive scripting system to automate tasks.
  - **Script Manager**: Create, edit, and manage Bash/Shell scripts.
  - **Multi-Execution**: Run scripts on multiple connections simultaneously.
  - **Auto-Connect**: Automatically opens tabs and connects when running scripts on disconnected profiles.
  - **Built-in Scripts**: Included starter scripts for System Info, Docker Stats, and OS Release.
  - **Read-Only Mode**: Built-in scripts are protected but can be duplicated for customization.
- **Connection Management**:
  - **Tree View**: New hierarchical sidebar for managing connections with infinite nesting.
  - **Folder Operations**: Create, Delete (with safety move-to-root), and Move folders.
  - **Context Menus**: Right-click actions for moving and deleting profiles/folders.
  - **Move Modal**: Quickly move connections between folders.

### 🐛 Fixed
- Resolved React `ref` warnings in UI components (Button/Dropdown integration).
- Fixed issues with `selectedProfileIds` state in Script Manager.

### 🧹 Chores
- **Cleanup**: Removed legacy `v1/` directory and unused artifacts.
- **Conventions**: Standardized project constraints in `conventions.md`.
