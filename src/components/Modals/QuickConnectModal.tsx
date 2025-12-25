import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProfileStore, Profile } from '@/store/profileStore';
import { useSessionStore } from '@/store/sessionStore';
import { v4 as uuidv4 } from 'uuid';

interface QuickConnectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuickConnectModal({ open, onOpenChange }: QuickConnectModalProps) {
    const { addProfile } = useProfileStore();
    const { connect } = useSessionStore();

    const [connectionStr, setConnectionStr] = useState('');
    const [port, setPort] = useState('22');
    const [password, setPassword] = useState('');

    const handleConnect = () => {
        // Parse user@host or just host
        let user = 'root';
        let host = connectionStr;

        if (connectionStr.includes('@')) {
            const parts = connectionStr.split('@');
            user = parts[0];
            host = parts[1];
        }

        const newProfile: Omit<Profile, 'id' | 'lastActive' | 'status'> & { id?: string } = {
            name: `${user}@${host}`,
            host,
            port: parseInt(port) || 22,
            username: user,
            authType: 'password', // Defaulting to password for quick connect for now
            password: password,
            type: 'vps',
            tags: ['Quick'],
            isTemporary: true,
            id: uuidv4() // Generate ID here
        };

        addProfile(newProfile);
        connect(newProfile.id!, newProfile.name);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-[#1e232b] border-[#282f39] text-white p-0 overflow-hidden gap-0">
                <DialogHeader className="px-6 py-4 bg-[#111418] border-b border-[#282f39]">
                    <DialogTitle className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">bolt</span>
                        Quick Connect
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destination</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">dns</span>
                                <Input
                                    placeholder="user@host"
                                    className="bg-[#111418] border-[#282f39] pl-10 h-11 font-mono"
                                    value={connectionStr}
                                    onChange={e => setConnectionStr(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="w-24 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Port</label>
                            <Input
                                placeholder="22"
                                className="bg-[#111418] border-[#282f39] h-11 text-center font-mono"
                                value={port}
                                onChange={e => setPort(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password (Optional)</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">key</span>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="bg-[#111418] border-[#282f39] pl-10 h-11 font-mono"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-slate-500">Leave empty to be prompted during connection.</p>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-[#111418] hover:text-white">Cancel</Button>
                        <Button onClick={handleConnect} className="bg-primary hover:bg-blue-600 min-w-[120px]">
                            Connect
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
