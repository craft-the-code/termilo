import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useStore } from '../../store/useStore';
import '@xterm/xterm/css/xterm.css';

interface TerminalPanelProps {
    sessionId: string;
}

export default function TerminalPanel({ sessionId }: TerminalPanelProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const isInitialized = useRef(false);
    const isConnecting = useRef(false);
    const streamStarted = useRef(false);
    const keyboardHandlerRef = useRef<any>(null);
    const { sessions, profiles, updateSession } = useStore();

    const session = sessions.find(s => s.id === sessionId);
    const profile = profiles.find(p => p.id === session?.profileId);

    const connectToSSH = useCallback(async () => {
        if (!session || !profile || session.isConnected || isConnecting.current) {
            return;
        }

        isConnecting.current = true;
        updateSession(sessionId, { isConnecting: true });

        try {
            const result = await invoke('connect_ssh', {
                profile: {
                    id: profile.id,
                    name: profile.name,
                    host: profile.host,
                    port: profile.port,
                    username: profile.username,
                    auth_method: profile.authMethod,
                    password: profile.password,
                    key_path: profile.keyPath,
                },
                sessionId
            });

            console.log('Connection result:', result);

            if (terminal.current) {
                terminal.current.writeln(`Connected to ${profile.name}`);
            }

            updateSession(sessionId, {
                isConnected: true,
                isConnecting: false
            });

            // Start reading output stream with a small delay
            setTimeout(async () => {
                if (!streamStarted.current) {
                    streamStarted.current = true;
                    try {
                        await invoke('read_output_stream', { sessionId });
                        console.log('Output stream started');
                    } catch (error) {
                        console.error('Failed to start output stream:', error);
                        streamStarted.current = false;
                    }
                }
            }, 500);

            // Focus terminal after successful connection
            if (terminal.current) {
                terminal.current.focus();
            }
        } catch (error) {
            console.error('Connection error:', error);
            updateSession(sessionId, {
                isConnected: false,
                isConnecting: false
            });

            if (terminal.current) {
                terminal.current.writeln(`Connection failed: ${error}`);
            }
        } finally {
            isConnecting.current = false;
        }
    }, [session, profile, sessionId, updateSession]);

    // Listen for SSH output events
    useEffect(() => {
        let outputUnlisten: (() => void) | null = null;
        let closedUnlisten: (() => void) | null = null;
        let errorUnlisten: (() => void) | null = null;

        const setupListeners = async () => {
            // Optimized output handling - expect structured events from new backend
            outputUnlisten = await listen<{ session_id: string; data: string }>('ssh-output', (event) => {
                if (event.payload.session_id === sessionId) {
                    if (terminal.current) {
                        // Direct write for maximum performance
                        terminal.current.write(event.payload.data);
                    }
                }
            });

            closedUnlisten = await listen<{ session_id: string; message?: string }>('ssh-output-closed', (event) => {
                if (event.payload.session_id === sessionId) {
                    updateSession(sessionId, { isConnected: false, isConnecting: false });
                    if (terminal.current) {
                        terminal.current.writeln('\r\n\x1b[31mConnection closed\x1b[0m');
                    }
                }
            });

            errorUnlisten = await listen<{ session_id: string; error: string }>('ssh-output-error', (event) => {
                if (event.payload.session_id === sessionId) {
                    if (terminal.current) {
                        terminal.current.writeln(`\r\n\x1b[31mError: ${event.payload.error}\x1b[0m`);
                    }
                    updateSession(sessionId, { isConnected: false, isConnecting: false });
                }
            });
        };

        setupListeners();

        return () => {
            outputUnlisten?.();
            closedUnlisten?.();
            errorUnlisten?.();
        };
    }, [sessionId, updateSession]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (terminal.current && fitAddonRef.current) {
                try {
                    fitAddonRef.current.fit();
                } catch (error) {
                    console.warn('Resize error:', error);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize terminal - prevent double initialization
    useEffect(() => {
        if (!terminalRef.current || terminal.current || isInitialized.current) return;

        console.log('Initializing terminal for session:', sessionId);
        isInitialized.current = true;

        terminal.current = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            theme: {
                background: 'var(--termilo-terminal)',
                foreground: 'var(--termilo-text-primary)',
                cursor: 'var(--termilo-primary)',
                selectionBackground: 'var(--termilo-primary)',
            },
        });

        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        terminal.current.loadAddon(fitAddon);
        terminal.current.open(terminalRef.current);

        // Small delay before fitting to ensure DOM is ready
        setTimeout(() => {
            if (fitAddon && terminal.current) {
                try {
                    fitAddon.fit();
                    terminal.current.focus();
                } catch (error) {
                    console.warn('Initial fit error:', error);
                }
            }
        }, 100);
    }, [sessionId]);

    // Handle keyboard input
    useEffect(() => {
        if (!terminal.current) return;

        // Remove existing handler if any
        if (keyboardHandlerRef.current) {
            keyboardHandlerRef.current.dispose();
            keyboardHandlerRef.current = null;
        }

        console.log('binding keyboard');
        // Add new handler
        keyboardHandlerRef.current = terminal.current.onData((data) => {
            if (session?.isConnected) {
                invoke('send_command', { sessionId, command: data }).catch(console.error);
            }
        });

        return () => {
            if (keyboardHandlerRef.current) {
                keyboardHandlerRef.current.dispose();
                keyboardHandlerRef.current = null;
            }
        };
    }, [session?.isConnected, sessionId]);

    // Auto-connect - only once when ready
    useEffect(() => {
        if (!session || !profile || !terminal.current) return;
        if (session.isConnected || session.isConnecting) return;

        // Add a small delay to prevent multiple rapid connections
        const timeoutId = setTimeout(() => {
            console.log('Auto-connecting session:', sessionId);
            connectToSSH();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [session?.id, profile?.id]); // Removed connectToSSH to prevent loops

    // Cleanup on unmount only
    useEffect(() => {
        return () => {
            console.log('Cleaning up terminal for session:', sessionId);

            if (session?.isConnected) {
                invoke('disconnect_ssh', { sessionId }).catch(console.error);
            }

            if (terminal.current) {
                terminal.current.dispose();
            }

            terminal.current = null;
            fitAddonRef.current = null;
            isInitialized.current = false;
            isConnecting.current = false;
            streamStarted.current = false;

            if (keyboardHandlerRef.current) {
                keyboardHandlerRef.current.dispose();
                keyboardHandlerRef.current = null;
            }
        };
    }, []); // Empty dependency array - only on unmount

    return (
        <div className="h-full bg-termilo-terminal relative">
            {session?.isConnecting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <div>Connecting to {profile?.name}...</div>
                    </div>
                </div>
            )}
            <div
                ref={terminalRef}
                className="h-full w-full p-2 terminal-container"
                onClick={() => {
                    if (terminal.current) {
                        terminal.current.focus();
                    }
                }}
            />
        </div>
    );
}