import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useSessionStore } from '@/store/sessionStore';
import { useProfileStore } from '@/store/profileStore';
import { useUIStore } from '@/store/uiStore';
import { AuthPromptModal } from '@/components/Modals/AuthPromptModal';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
    sessionId: string;
}

export function Terminal({ sessionId }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const isInitialized = useRef(false);
    const isConnecting = useRef(false);
    const streamStarted = useRef(false);
    const keyboardHandlerRef = useRef<any>(null);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [, setAuthCredentials] = useState<{ password?: string; keyPath?: string } | null>(null);
    const [systemThemeIsDark, setSystemThemeIsDark] = useState(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    const { sessions, updateSession } = useSessionStore();
    const { getProfile, updateProfile } = useProfileStore();
    const { fontSize, fontFamily, lineHeight, theme } = useUIStore();

    const session = sessions.find(s => s.id === sessionId);
    const profile = session ? getProfile(session.profileId) : undefined;

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemThemeIsDark(e.matches);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Determine if we should use dark theme
    const isDarkTheme = useMemo(() => {
        if (theme === 'system') {
            return systemThemeIsDark;
        }
        return theme === 'dark';
    }, [theme, systemThemeIsDark]);

    const connectToSSH = useCallback(async (credentials?: { password?: string; keyPath?: string }) => {
        if (!session || !profile || session.isConnected || isConnecting.current) {
            return;
        }

        // Check if we need credentials
        const needsPassword = profile.authType === 'password' && !profile.password && !credentials?.password;
        const needsKey = profile.authType === 'key' && !profile.keyPath && !credentials?.keyPath;

        if (needsPassword || needsKey) {
            setShowAuthModal(true);
            return;
        }

        isConnecting.current = true;
        updateSession(sessionId, { isConnecting: true, status: 'connecting' });

        try {
            const result = await invoke('connect_ssh', {
                profile: {
                    id: profile.id,
                    name: profile.name,
                    host: profile.host,
                    port: profile.port,
                    username: profile.username,
                    auth_method: profile.authType,
                    password: credentials?.password || profile.password,
                    key_path: credentials?.keyPath || profile.keyPath,
                },
                sessionId
            });

            console.log('Connection result:', result);

            if (xtermRef.current) {
                xtermRef.current.writeln(`\x1b[1;32m✓ Connected to ${profile.name}\x1b[0m`);
            }

            // Execute initial command if present
            if (session.initialCommand) {
                const cmd = session.initialCommand;
                // Add a small delay to ensure shell is ready
                setTimeout(async () => {
                    if (xtermRef.current) {
                        xtermRef.current.writeln(`\r\n\x1b[36m> Executing script...\x1b[0m\r\n`);
                    }
                    await invoke('send_command', { sessionId, command: cmd + '\r' });
                }, 800);
            }

            updateSession(sessionId, {
                isConnected: true,
                isConnecting: false,
                status: 'connected',
                initialCommand: undefined // Clear prompt so it doesn't run again if we had re-connection logic
            });

            // Update profile status to live
            updateProfile(profile.id, {
                status: 'live',
                lastActive: 'Just now'
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
            if (xtermRef.current) {
                xtermRef.current.focus();
            }
        } catch (error) {
            console.error('Connection error:', error);
            updateSession(sessionId, {
                isConnected: false,
                isConnecting: false,
                status: 'disconnected'
            });

            // Update profile status to error
            updateProfile(profile.id, { status: 'error' });

            if (xtermRef.current) {
                xtermRef.current.writeln(`\x1b[1;31m✗ Connection failed: ${error}\x1b[0m`);
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
            // Optimized output handling - expect structured events from backend
            outputUnlisten = await listen<{ session_id: string; data: string }>('ssh-output', (event) => {
                if (event.payload.session_id === sessionId) {
                    if (xtermRef.current) {
                        // Direct write for maximum performance
                        xtermRef.current.write(event.payload.data);
                    }
                }
            });

            closedUnlisten = await listen<{ session_id: string; message?: string }>('ssh-output-closed', (event) => {
                if (event.payload.session_id === sessionId) {
                    updateSession(sessionId, {
                        isConnected: false,
                        isConnecting: false,
                        status: 'disconnected'
                    });
                    if (xtermRef.current) {
                        xtermRef.current.writeln('\r\n\x1b[31mConnection closed\x1b[0m');
                    }
                }
            });

            errorUnlisten = await listen<{ session_id: string; error: string }>('ssh-output-error', (event) => {
                if (event.payload.session_id === sessionId) {
                    if (xtermRef.current) {
                        xtermRef.current.writeln(`\r\n\x1b[31mError: ${event.payload.error}\x1b[0m`);
                    }
                    updateSession(sessionId, {
                        isConnected: false,
                        isConnecting: false,
                        status: 'disconnected'
                    });
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
            if (xtermRef.current && fitAddonRef.current) {
                try {
                    fitAddonRef.current.fit();

                    // Send resize to backend if connected
                    if (session?.isConnected) {
                        const dims = fitAddonRef.current.proposeDimensions();
                        if (dims) {
                            invoke('resize_terminal', {
                                sessionId,
                                cols: dims.cols,
                                rows: dims.rows,
                            }).catch(console.error);
                        }
                    }
                } catch (error) {
                    console.warn('Resize error:', error);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sessionId, session?.isConnected]);

    // Initialize terminal - prevent double initialization
    useEffect(() => {
        // Warning: We are using a ref to track initialization, but if sessionId changes,
        // we might need to re-init. Currently sessionId shouldn't change for the same component instance.
        if (!terminalRef.current || xtermRef.current || isInitialized.current) return;

        console.log('Initializing terminal for session:', sessionId);
        isInitialized.current = true;

        const term = new XTerm({
            cursorBlink: true,
            fontSize: fontSize,
            fontFamily: fontFamily,
            lineHeight: lineHeight,
            theme: isDarkTheme ? {
                background: '#0F172A', // slate-900
                foreground: '#E2E8F0', // slate-200
                cursor: '#0EA5E9',     // sky-500
                selectionBackground: 'rgba(14, 165, 233, 0.4)',
            } : {
                background: '#FFFFFF', // white
                foreground: '#0F172A', // slate-900
                cursor: '#0EA5E9',     // sky-500
                selectionBackground: 'rgba(14, 165, 233, 0.3)',
            },
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);

        // Small delay before fitting to ensure DOM is ready
        setTimeout(() => {
            if (fitAddon && term) {
                try {
                    fitAddon.fit();
                    term.focus();
                } catch (error) {
                    console.warn('Initial fit error:', error);
                }
            }
        }, 100);

        xtermRef.current = term;

        // term.writeln('\x1b[1;34mWelcome to Termilo\x1b[0m'); // Optional welcome message
        // term.writeln('Initializing connection...'); // Optional status
    }, [sessionId]);

    // Update options when settings change
    useEffect(() => {
        if (xtermRef.current) {
            console.log('[Terminal Settings] Updating:', { fontSize, fontFamily, lineHeight, isDarkTheme });

            // Update font settings
            xtermRef.current.options.fontSize = fontSize;
            xtermRef.current.options.fontFamily = fontFamily;
            xtermRef.current.options.lineHeight = lineHeight;

            // Update theme colors
            xtermRef.current.options.theme = isDarkTheme ? {
                background: '#0F172A',
                foreground: '#E2E8F0',
                cursor: '#0EA5E9',
                selectionBackground: 'rgba(14, 165, 233, 0.4)',
            } : {
                background: '#FFFFFF',
                foreground: '#0F172A',
                cursor: '#0EA5E9',
                selectionBackground: 'rgba(14, 165, 233, 0.3)',
            };

            // Force terminal to refresh and refit
            // This ensures the changes are immediately visible
            xtermRef.current.refresh(0, xtermRef.current.rows - 1);

            // Refresh layout with a small delay to ensure font is loaded
            setTimeout(() => {
                if (fitAddonRef.current && xtermRef.current) {
                    try {
                        fitAddonRef.current.fit();
                        console.log('[Terminal Settings] Applied successfully');
                    } catch (e) {
                        console.warn('[Terminal Settings] Fit error:', e);
                    }
                }
            }, 50);
        }
    }, [fontSize, fontFamily, lineHeight, isDarkTheme]);

    // Handle keyboard input
    useEffect(() => {
        if (!xtermRef.current) return;

        // Remove existing handler if any
        if (keyboardHandlerRef.current) {
            keyboardHandlerRef.current.dispose();
            keyboardHandlerRef.current = null;
        }

        console.log('Binding keyboard for session:', sessionId);
        // Add new handler
        keyboardHandlerRef.current = xtermRef.current.onData((data) => {
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
        if (!session || !profile || !xtermRef.current) return;
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

            if (xtermRef.current) {
                xtermRef.current.dispose();
            }

            xtermRef.current = null;
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

    const handleAuthConfirm = (credentials: { password?: string; keyPath?: string }) => {
        setShowAuthModal(false);
        setAuthCredentials(credentials);
        // Retry connection with credentials
        connectToSSH(credentials);
    };

    const handleAuthCancel = () => {
        setShowAuthModal(false);
        updateSession(sessionId, {
            isConnecting: false,
            isConnected: false,
            status: 'disconnected'
        });
        if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[1;33mConnection cancelled\x1b[0m');
        }
    };

    return (
        <div className={`h-full w-full relative overflow-hidden ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
            {session?.isConnecting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-2"></div>
                        <div className="text-sm">Connecting to {profile?.name}...</div>
                    </div>
                </div>
            )}
            <div
                ref={terminalRef}
                className="h-full w-full p-1"
                onClick={() => {
                    if (xtermRef.current) {
                        xtermRef.current.focus();
                    }
                }}
            />

            <AuthPromptModal
                isOpen={showAuthModal}
                profile={profile || null}
                onConfirm={handleAuthConfirm}
                onCancel={handleAuthCancel}
            />
        </div>
    );
}
