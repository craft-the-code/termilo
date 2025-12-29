import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfileStore } from "@/store/profileStore";

interface MoveToGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profileId: string | null;
}

export function MoveToGroupModal({ open, onOpenChange, profileId }: MoveToGroupModalProps) {
    const { groups, moveProfile, getProfile } = useProfileStore();
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    const profile = profileId ? getProfile(profileId) : null;

    useEffect(() => {
        if (open && profile) {
            setSelectedGroupId(profile.groupId || "none");
        }
    }, [open, profile]);

    const handleMove = () => {
        if (profileId) {
            moveProfile(profileId, selectedGroupId === "none" ? null : selectedGroupId);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Move Connection</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Connection</Label>
                        <div className="col-span-3 text-sm text-muted-foreground">
                            {profile?.name}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">To Group</Label>
                        <Select
                            value={selectedGroupId || "none"}
                            onValueChange={setSelectedGroupId}
                        >
                            <SelectTrigger className="col-span-3 bg-muted border-input">
                                <SelectValue placeholder="Select destination..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Group (Root)</SelectItem>
                                {groups.map(g => (
                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleMove}>Move</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
