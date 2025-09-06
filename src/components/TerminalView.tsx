import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store/useStore';
import '@xterm/xterm/css/xterm.css';

interface TerminalViewProps {
    sessionId: string;
}

export default function TerminalView({ sessionId }: TerminalViewProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal | null>(null);
    const { sessions, profiles, updateSession } = useStore();

    const session = sessions.find(s => s.id === sessionId);
    const profile = profiles.find(p => p.id === session?.profileId);

    useEffect(() => {
        if (!terminalRef.current || !session || !profile) return;

        // Initialize terminal
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
            rows: 24,
            cols: 80,
        });

        terminal.current.open(terminalRef.current);

        // Handle terminal input
        terminal.current.onData((data) => {
            if (session.isConnected) {
                invoke('send_command', { sessionId, command: data });
            }
        });

        // Connect to SSH
        connectToSSH();

        // Start output reading loop
        const outputInterval = setInterval(readOutput, 100);

        return () => {
            clearInterval(outputInterval);
            terminal.current?.dispose();
        };
    }, [sessionId]);

    const connectToSSH = async () => {
        if (!session || !profile) return;

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

            updateSession(sessionId, {
                isConnected: true,
                isConnecting: false
            });

            terminal.current?.writeln(`Connected to ${profile.name}`);
        } catch (error) {
            updateSession(sessionId, {
                isConnected: false,
                isConnecting: false
            });

            terminal.current?.writeln(`Connection failed: ${error}`);
        }
    };

    const readOutput = async () => {
        if (!session?.isConnected) return;

        try {
            const output = await invoke('read_output', { sessionId });
            if (output && terminal.current) {
                terminal.current.write(output as string);
            }
        } catch (error) {
            console.error('Read error:', error);
        }
    };

    return (
        <div className="h-full bg-black relative">
            {session?.isConnecting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white z-10">
                    Connecting to {profile?.name}...
                </div>
            )}
            <div ref={terminalRef} className="h-full w-full p-2" />
        </div>
    );
}