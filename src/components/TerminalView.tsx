import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store/useStore';
import '@xterm/xterm/css/xterm.css';

interface TerminalViewProps {
    sessionId: string;
}

export default function TerminalView({ sessionId }: TerminalViewProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const readIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isActiveRef = useRef(true);
    const { sessions, profiles, updateSession } = useStore();

    const session = sessions.find(s => s.id === sessionId);
    const profile = profiles.find(p => p.id === session?.profileId);

    const readOutput = useCallback(async () => {
        if (!session?.isConnected || !isActiveRef.current) return;

        try {
            const output = await invoke('read_output', { sessionId });
            if (output && terminal.current) {
                terminal.current.write(output as string);
            }
        } catch (error) {
            // Only disconnect on persistent errors, not temporary throttling
            console.warn('Read error (non-fatal):', error);
            // Don't immediately disconnect - let connection persist
        }
    }, [sessionId, session?.isConnected]);

    const startPolling = useCallback(() => {
        if (readIntervalRef.current) return;
        // Increase interval to reduce server load during fast typing
        readIntervalRef.current = setInterval(readOutput, 150);
    }, [readOutput]);

    const stopPolling = useCallback(() => {
        if (readIntervalRef.current) {
            clearInterval(readIntervalRef.current);
            readIntervalRef.current = null;
        }
    }, []);

    const connectToSSH = useCallback(async () => {
        if (!session || !profile || session.isConnected || session.isConnecting) return;

        updateSession(sessionId, { isConnecting: true });

        try {
            await invoke('connect_ssh', {
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

            terminal.current?.writeln(`Connected to ${profile.name}`);
            updateSession(sessionId, {
                isConnected: true,
                isConnecting: false
            });

            // Focus terminal after successful connection
            terminal.current?.focus();

            if (isActiveRef.current) {
                startPolling();
            }
        } catch (error) {
            updateSession(sessionId, {
                isConnected: false,
                isConnecting: false
            });
            terminal.current?.writeln(`Connection failed: ${error}`);
        }
    }, [session, profile, sessionId, startPolling, updateSession]);

    // Handle tab visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            isActiveRef.current = !document.hidden;

            if (document.hidden) {
                stopPolling();
            } else if (session?.isConnected) {
                startPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [session?.isConnected, startPolling, stopPolling]);

    // Handle window focus/blur for additional safety
    useEffect(() => {
        const handleFocus = () => {
            isActiveRef.current = true;
            if (session?.isConnected) {
                startPolling();
            }
        };

        const handleBlur = () => {
            isActiveRef.current = false;
            stopPolling();
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [session?.isConnected, startPolling, stopPolling]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (terminal.current && fitAddonRef.current) {
                fitAddonRef.current.fit();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize terminal and connection
    useEffect(() => {
        if (!terminalRef.current || !session || !profile) return;

        // Initialize terminal only once
        if (!terminal.current) {
            terminal.current = new Terminal({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                theme: {
                    background: '#1a1a1a',
                    foreground: '#ffffff',
                    cursor: '#ffffff',
                    selectionBackground: '#ffffff40',
                },
            });

            terminal.current.open(terminalRef.current);

            // Fit terminal to container size
            const fitAddon = new FitAddon();
            fitAddonRef.current = fitAddon;
            terminal.current.loadAddon(fitAddon);
            fitAddon.fit();

            // Focus terminal immediately after opening
            terminal.current.focus();

            // Handle terminal input
            terminal.current.onData((data) => {
                if (session.isConnected) {
                    invoke('send_command', { sessionId, command: data }).catch(console.error);
                }
            });
        }

        // Connect if not already connected
        if (!session.isConnected && !session.isConnecting) {
            connectToSSH();
        } else if (session.isConnected && isActiveRef.current) {
            startPolling();
        }

        return () => {
            stopPolling();
        };
    }, [sessionId, session?.isConnected, session?.isConnecting, connectToSSH, startPolling, stopPolling]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling();
            if (terminal.current) {
                terminal.current.dispose();
                terminal.current = null;
            }
        };
    }, [stopPolling]);

    return (
        <div className="h-full bg-black relative">
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
                className="h-full w-full p-2"
                onClick={() => terminal.current?.focus()}
            />
        </div>
    );
}