# Termilo

**Termilo** is a modern, privacy-focused SSH terminal manager built for developers who prioritize speed and local control. It combines the performance of a native Rust backend (Tauri) with the flexibility of a modern React UI.

![Termilo Screenshot](https://raw.githubusercontent.com/craft-the-code/termilo/main/docs/screenshot.png)

## 🚀 Features

-   **Local-First & Secure**: All connection data is stored locally on your machine. No cloud sync, no tracking.
-   **Multi-Session Management**: Run multiple SSH connections simultaneously with a persistent tabbed interface.
-   **Connection Dashboard**: Organize your servers with profiles, tags, and status indicators.
-   **Quick Connect**: Instantly connect to a host without creating a permanent profile for ad-hoc tasks.
-   **Modern Terminal**: Powered by `xterm.js`, supporting full colors, resizing, and copy/paste.
-   **Customizable**: Adjust font size, font family, and themes via the Settings panel.
-   **Persistent State**: Your active sessions remain alive even when navigating through the app.

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS
-   **State Management**: Zustand (with local persistence)
-   **Backend**: Rust (Tauri v2)
-   **Terminal**: xterm.js
-   **Icons**: Material Symbols

## 📦 Installation

Download the latest release for your platform from the [Releases](https://github.com/craft-the-code/termilo/releases) page.

## 💻 Development

### Prerequisites

-   Node.js (v20+ LTS)
-   Rust (stable)
-   System dependencies for Tauri (Webkit2GTK on Linux, etc.)

### Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/craft-the-code/termilo.git
    cd termilo
    ```

2.  **Install dependencies**
    ```bash
    yarn install
    ```

3.  **Run in development mode**
    ```bash
    yarn tauri dev
    ```

### Building for Production

To create a release bundle for your OS:

```bash
yarn tauri build
```

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.
