import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConnectionCard } from '@/components/ConnectionCard';
import { useProfileStore } from '@/store/profileStore';
import { ConnectionModal } from '@/components/Modals/ConnectionModal';
import { DeleteConfirmDialog } from '@/components/Modals/DeleteConfirmDialog';
import { useSessionStore } from '@/store/sessionStore';

export function ConnectionsDashboard() {
    const { profiles, deleteProfile } = useProfileStore();

    // Modal State
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProfiles = profiles.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsConnectionModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingId) {
            deleteProfile(deletingId);
            setDeletingId(null);
        }
    };

    const handleAddNew = () => {
        setEditingId(null);
        setIsConnectionModalOpen(true);
    };

    const handleModalOpenChange = (open: boolean) => {
        setIsConnectionModalOpen(open);
        if (!open) setEditingId(null);
    };

    return (
        <div className="flex-1 h-full flex flex-col bg-background text-foreground overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur top-0 z-10 sticky">
                <div className="flex items-center gap-6 flex-1">
                    <h1 className="text-xl font-bold tracking-tight">Connections</h1>
                    <div className="relative max-w-lg w-full">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 text-[20px]">
                            search
                        </span>
                        <Input
                            placeholder="Search host, tag, or ip..."
                            className="pl-10 h-10 bg-secondary/50 border-transparent focus:bg-background focus:border-input focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <span className="material-symbols-outlined text-[20px]">file_upload</span>
                        Import
                    </Button>
                    <Button className="gap-2" onClick={handleAddNew}>
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Add Connection
                    </Button>
                </div>
            </div>

            {/* Main Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">All Connections ({profiles.length})</h2>

                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-foreground">
                            <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <span className="material-symbols-outlined text-[20px]">list</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProfiles.map(conn => (
                        <ConnectionCard
                            key={conn.id}
                            connection={conn}
                            onDelete={handleDeleteClick}
                            onEdit={handleEdit}
                            onConnect={(id) => {
                                const profile = profiles.find(p => p.id === id);
                                if (profile) {
                                    useSessionStore.getState().connect(id, profile.name);
                                }
                            }}
                        />
                    ))}

                    {/* Add New Placeholder Card */}
                    <button
                        onClick={handleAddNew}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all group h-auto min-h-[200px]"
                    >
                        <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[28px] text-muted-foreground group-hover:text-primary">add</span>
                        </div>
                        <span className="font-medium text-muted-foreground group-hover:text-primary">New Connection</span>
                    </button>
                </div>
            </div>

            {/* Modals */}
            <ConnectionModal
                open={isConnectionModalOpen}
                onOpenChange={handleModalOpenChange}
                editId={editingId}
            />

            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                connectionName={profiles.find(p => p.id === deletingId)?.name}
            />
        </div>
    );
}
