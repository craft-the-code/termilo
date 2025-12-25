import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
    onData?: (data: string) => void;
}

export function Terminal({ onData }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

        // Initialize xterm
        const term = new XTerm({
            theme: {
                background: '#0F172A', // slate-900
                foreground: '#E2E8F0', // slate-200
                cursor: '#0EA5E9',     // sky-500
                selectionBackground: 'rgba(14, 165, 233, 0.4)',
            },
            fontFamily: 'JetBrains Mono, monospace', // Need to ensure font is available or fallback
            fontSize: 14,
            cursorBlink: true,
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        term.writeln('\x1b[1;34mWelcome to Termilo\x1b[0m');
        term.writeln('Initializing terminal...');

        term.onData(data => {
            onData?.(data);
            // Echo for demo purposes if no backend connected yet
            if (!onData) {
                term.write(data === '\r' ? '\r\n' : data);
            }
        });

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
        });

        resizeObserver.observe(terminalRef.current);

        return () => {
            resizeObserver.disconnect();
            term.dispose();
            xtermRef.current = null;
        };
    }, [onData]);

    return (
        <div className="h-full w-full bg-slate-900 p-1 overflow-hidden" ref={terminalRef} />
    );
}
