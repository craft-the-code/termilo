import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useScriptStore, Script } from "@/store/scriptStore";
import { useProfileStore } from "@/store/profileStore";
import { useSessionStore } from "@/store/sessionStore";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import { invoke } from '@tauri-apps/api/core';

interface ScriptManagerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ScriptManagerModal({ open, onOpenChange }: ScriptManagerModalProps) {
    const { scripts, addScript, updateScript, deleteScript } = useScriptStore();
    const [editingScript, setEditingScript] = useState<Script | null>(null);
    const [mode, setMode] = useState<'list' | 'edit' | 'run'>('list');
    const [runScriptId, setRunScriptId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', description: '', content: '' });

    const handleEdit = (script: Script) => {
        setEditingScript(script);
        setFormData({ name: script.name, description: script.description || '', content: script.content });
        setMode('edit');
    };

    const handleCreate = () => {
        setEditingScript(null);
        setFormData({ name: '', description: '', content: '' });
        setMode('edit');
    };

    const handleSave = () => {
        if (!formData.name || !formData.content) return;

        if (editingScript) {
            updateScript(editingScript.id, formData);
        } else {
            addScript(formData);
        }
        setMode('list');
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this script?')) {
            deleteScript(id);
        }
    };

    const handleRunClick = (id: string) => {
        setRunScriptId(id);
        setMode('run');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-card h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'list' && 'Script Library'}
                        {mode === 'edit' && (editingScript ? 'Edit Script' : 'New Script')}
                        {mode === 'run' && 'Run Script'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'list' && 'Manage and execute your automation scripts.'}
                        {mode === 'run' && 'Select connections to execute this script on.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-1">
                    {mode === 'list' && (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-end mb-4">
                                <Button onClick={handleCreate}>
                                    <span className="material-symbols-outlined mr-2">add</span>
                                    New Script
                                </Button>
                            </div>
                            <ScrollArea className="flex-1 pr-4">
                                <div className="grid gap-3">
                                    {scripts.map(script => (
                                        <div key={script.id} className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50">
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {script.name}
                                                    {script.isBuiltin && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 rounded">Built-in</span>}
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate max-w-[400px]">
                                                    {script.description}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleRunClick(script.id)}>
                                                    <span className="material-symbols-outlined mr-1 text-[16px]">play_arrow</span>
                                                    Run
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(script)} title={script.isBuiltin ? "View" : "Edit"}>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {script.isBuiltin ? 'visibility' : 'edit'}
                                                    </span>
                                                </Button>
                                                {!script.isBuiltin && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(script.id)}>
                                                        <span className="material-symbols-outlined text-[18px] text-red-500">delete</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {mode === 'edit' && (
                        <div className="space-y-4 h-full flex flex-col">
                            {editingScript?.isBuiltin && (
                                <div className="bg-blue-500/10 text-blue-500 text-sm p-2 rounded flex items-center">
                                    <span className="material-symbols-outlined text-[18px] mr-2">info</span>
                                    Built-in scripts are read-only. Duplicate to edit.
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. System Update"
                                        readOnly={!!editingScript?.isBuiltin}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What does it do?"
                                        readOnly={!!editingScript?.isBuiltin}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 flex-1 flex flex-col">
                                <Label>Script Content (Bash/Shell)</Label>
                                <Textarea
                                    className="flex-1 font-mono text-sm resize-none"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="#!/bin/bash..."
                                    readOnly={!!editingScript?.isBuiltin}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setMode('list')}>Cancel</Button>
                                {editingScript?.isBuiltin ? (
                                    <Button onClick={() => {
                                        // Duplicate logic
                                        addScript({
                                            ...formData,
                                            name: `${formData.name} (Copy)`
                                        });
                                        setMode('list');
                                    }}>
                                        <span className="material-symbols-outlined mr-2">content_copy</span>
                                        Duplicate & Edit
                                    </Button>
                                ) : (
                                    <Button onClick={handleSave}>Save Script</Button>
                                )}
                            </div>
                        </div>
                    )}

                    {mode === 'run' && runScriptId && (
                        <RunScriptView
                            scriptId={runScriptId}
                            onCancel={() => setMode('list')}
                            onComplete={() => onOpenChange(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Sub-component for Run View
function RunScriptView({ scriptId, onCancel, onComplete }: { scriptId: string, onCancel: () => void, onComplete: () => void }) {
    const { getScript } = useScriptStore();
    const { profiles } = useProfileStore();
    const { sessions, addSession } = useSessionStore();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const script = getScript(scriptId);

    const toggleProfile = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleExecute = () => {
        if (!script) return;

        // Parallel execution logic
        Array.from(selectedIds).forEach(profileId => {
            const existingSession = sessions.find(s => s.profileId === profileId && s.isConnected);

            if (existingSession) {
                // If already connected, inject command directly
                // We add a newline to ensure it runs
                invoke('send_command', { sessionId: existingSession.id, command: script.content + '\n' })
                    .catch(console.error);
            } else {
                // Open new session with initial command
                const profile = profiles.find(p => p.id === profileId);
                if (profile) {
                    addSession(profile.id, profile.name, script.content);
                }
            }
        });

        onComplete();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 p-3 bg-muted rounded-md text-sm font-mono line-clamp-3">
                {script?.content}
            </div>
            <Label className="mb-2 block">Select Targets ({selectedIds.size})</Label>
            <ScrollArea className="flex-1 border rounded-md p-2">
                <div className="grid gap-1">
                    {profiles.map(profile => (
                        <div
                            key={profile.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                            onClick={() => toggleProfile(profile.id)}
                        >
                            <Checkbox checked={selectedIds.has(profile.id)} />
                            <span className="text-sm">{profile.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto bg-muted px-1.5 rounded">{profile.type}</span>
                        </div>
                    ))}
                    {profiles.length === 0 && <div className="text-sm text-muted-foreground p-2">No connections available.</div>}
                </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={onCancel}>Back</Button>
                <Button onClick={handleExecute} disabled={selectedIds.size === 0}>
                    <span className="material-symbols-outlined mr-2">bolt</span>
                    Execute
                </Button>
            </div>
        </div>
    );
}
