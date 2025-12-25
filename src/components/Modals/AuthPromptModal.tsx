import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Profile } from '@/store/profileStore';

interface AuthPromptModalProps {
    isOpen: boolean;
    profile: Profile | null;
    onConfirm: (credentials: { password?: string; keyPath?: string }) => void;
    onCancel: () => void;
}

export function AuthPromptModal({ isOpen, profile, onConfirm, onCancel }: AuthPromptModalProps) {
    const [password, setPassword] = useState('');
    const [keyPath, setKeyPath] = useState('');

    if (!profile) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (profile.authType === 'password') {
            onConfirm({ password });
        } else {
            onConfirm({ keyPath });
        }
    };

    const handleOpenKeyFile = async () => {
        try {
            // @ts-ignore - Tauri dialog
            const { open } = await import('@tauri-apps/plugin-dialog');
            const { homeDir, join } = await import('@tauri-apps/api/path');
            const home = await homeDir();
            const sshDir = await join(home, '.ssh');

            const selected = await open({
                defaultPath: sshDir,
                multiple: false,
                directory: false,
            });

            if (selected) {
                setKeyPath(selected);
            }
        } catch (error) {
            console.error('Failed to open file dialog:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Authentication Required</DialogTitle>
                        <DialogDescription>
                            Connecting to {profile.username}@{profile.host}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {profile.authType === 'password' ? (
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    autoFocus
                                    required
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="keyPath">SSH Private Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="keyPath"
                                        type="text"
                                        value={keyPath}
                                        onChange={(e) => setKeyPath(e.target.value)}
                                        placeholder="/path/to/private/key"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleOpenKeyFile}
                                    >
                                        Browse
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Common locations: ~/.ssh/id_rsa, ~/.ssh/id_ed25519
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Connect
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
