import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/store/profileStore';

interface ConnectionCardProps {
    connection: Profile;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onConnect?: (id: string) => void;
}

export function ConnectionCard({ connection, onEdit, onDelete, onConnect }: ConnectionCardProps) {
    const statusColor = {
        online: 'bg-green-500',
        offline: 'bg-gray-500',
        unknown: 'bg-slate-500',
        unreachable: 'bg-red-500',
    }[connection.status];

    const statusText = {
        online: 'Online',
        offline: 'Offline',
        unknown: 'Unknown',
        unreachable: 'Unreachable',
    }[connection.status];

    const statusTextColor = {
        online: 'text-green-500',
        offline: 'text-muted-foreground',
        unknown: 'text-muted-foreground',
        unreachable: 'text-red-500',
    }[connection.status];

    const iconName = {
        aws: 'cloud',
        vps: 'terminal',
        iot: 'memory',
        local: 'laptop',
    }[connection.type] || 'terminal';

    return (
        <Card className="group flex flex-col p-5 gap-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 bg-card border-border">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground border border-border/50">
                        <span className="material-symbols-outlined text-[24px]">{iconName}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{connection.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={cn("relative inline-flex rounded-full h-2 w-2", statusColor)}></span>
                            <span className={cn("text-xs font-medium", statusTextColor)}>{statusText}</span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <span className="material-symbols-outlined">more_horiz</span>
                </Button>
            </div>

            <div className="flex flex-col gap-2 py-2 border-t border-b border-border/50 border-dashed">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">person</span> User
                    </span>
                    <span className="font-mono text-foreground">{connection.username}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">lan</span> Host
                    </span>
                    <span className="font-mono text-foreground">{connection.host}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">schedule</span> Last Active
                    </span>
                    <span className="text-foreground">{connection.lastActive || 'Never'}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {connection.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                        {tag}
                    </Badge>
                ))}
            </div>

            <div className="mt-auto pt-2 flex items-center gap-2">
                <Button
                    className="flex-1 gap-2 font-bold shadow-md shadow-primary/10"
                    onClick={() => onConnect?.(connection.id)}
                >
                    <span className="material-symbols-outlined text-[20px] fill-1">terminal</span>
                    Connect
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="border border-border"
                    onClick={() => onEdit?.(connection.id)}
                >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete?.(connection.id)}
                >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                </Button>
            </div>
        </Card>
    );
}
