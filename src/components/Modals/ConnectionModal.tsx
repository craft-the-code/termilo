import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Key, Lock, Eye, EyeOff, FolderOpen } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { homeDir, join } from '@tauri-apps/api/path';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useProfileStore, ConnectionType } from '@/store/profileStore';

interface ConnectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editId?: string | null; // If present, we are editing
}

interface FormValues {
    name: string;
    host: string;
    username: string;
    port: number;
    type: ConnectionType;
    tags: string; // Comma separated for input
    authType: 'password' | 'key';
    password?: string;
    keyPath?: string;
    groupId?: string | null;
}

const defaultValues: FormValues = {
    name: '',
    host: '',
    username: '',
    port: 22,
    type: 'vps',
    tags: '',
    authType: 'password',
    password: '',
    keyPath: '',
    groupId: null,
};

export function ConnectionModal({ open, onOpenChange, editId }: ConnectionModalProps) {
    const { addProfile, updateProfile, getProfile, groups } = useProfileStore();
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<FormValues>({
        defaultValues,
    });

    const authType = form.watch('authType');

    // Reset or populate form when opening
    useEffect(() => {
        if (open) {
            setShowPassword(false);
            if (editId) {
                const profile = getProfile(editId);
                if (profile) {
                    form.reset({
                        name: profile.name,
                        host: profile.host,
                        username: profile.username,
                        port: profile.port,
                        type: profile.type,
                        tags: profile.tags.join(', '),
                        authType: profile.authType,
                        password: profile.password || '',
                        keyPath: profile.keyPath || '',
                        groupId: profile.groupId || null,
                    });
                }
            } else {
                form.reset(defaultValues);
            }
        }
    }, [open, editId, getProfile, form]);

    const onSubmit = (data: FormValues) => {
        const profileData = {
            ...data,
            tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
            // Clean up unused fields based on auth type
            password: data.authType === 'password' ? data.password : undefined,
            keyPath: data.authType === 'key' ? data.keyPath : undefined,
            groupId: data.groupId,
        };

        if (editId) {
            updateProfile(editId, profileData);
        } else {
            addProfile(profileData);
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editId ? 'Edit Connection' : 'New Connection'}</DialogTitle>
                    <DialogDescription>
                        {editId ? 'Update your connection details below.' : 'Add a new SSH connection to your library.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="p-4 bg-slate-900 rounded-lg space-y-4 border border-slate-800">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Production DB" {...field} className="bg-slate-950 border-slate-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-[1fr_100px] gap-4">
                                <FormField
                                    control={form.control}
                                    name="host"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hostname / IP</FormLabel>
                                            <FormControl>
                                                <Input placeholder="192.168.1.1" {...field} className="bg-slate-950 border-slate-800" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="port"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Port</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} className="bg-slate-950 border-slate-800" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <Input placeholder="root" {...field} className="bg-slate-950 border-slate-800" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="vps">VPS / Server</SelectItem>
                                                    <SelectItem value="aws">AWS</SelectItem>
                                                    <SelectItem value="iot">IoT Device</SelectItem>
                                                    <SelectItem value="local">Local</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="groupId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Group</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                                            value={field.value || "none"}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                                    <SelectValue placeholder="No Group" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">No Group (Root)</SelectItem>
                                                {groups.map((group) => (
                                                    <SelectItem key={group.id} value={group.id}>
                                                        {group.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Authentication Section */}
                        <div className="space-y-3">
                            <FormLabel>Authentication Type</FormLabel>
                            <FormField
                                control={form.control}
                                name="authType"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                type="button"
                                                variant={field.value === 'password' ? 'default' : 'secondary'}
                                                className={`h-auto py-3 justify-start ${field.value === 'password' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'}`}
                                                onClick={() => field.onChange('password')}
                                            >
                                                <Key className="mr-2 h-4 w-4" />
                                                Password
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={field.value === 'key' ? 'default' : 'secondary'}
                                                className={`h-auto py-3 justify-start ${field.value === 'key' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'}`}
                                                onClick={() => field.onChange('key')}
                                            >
                                                <Lock className="mr-2 h-4 w-4" />
                                                SSH Key
                                            </Button>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {authType === 'password' && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••••••••"
                                                        {...field}
                                                        className="bg-slate-900 border-slate-800 pr-10"
                                                    />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {authType === 'key' && (
                                <FormField
                                    control={form.control}
                                    name="keyPath"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Private Key Path</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input placeholder="/home/user/.ssh/id_rsa" {...field} className="bg-slate-900 border-slate-800" />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
                                                        onClick={async () => {
                                                            try {
                                                                const home = await homeDir();
                                                                const sshDir = await join(home, '.ssh');
                                                                const selected = await openDialog({
                                                                    defaultPath: sshDir,
                                                                    multiple: false,
                                                                    directory: false,
                                                                });

                                                                console.log('Opening dialog at:', sshDir);
                                                                if (selected && typeof selected === 'string') {
                                                                    field.onChange(selected);
                                                                }
                                                            } catch (err) {
                                                                console.error('Failed to open dialog:', err);
                                                            }
                                                        }}
                                                    >
                                                        <FolderOpen className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">
                                                Path to your private key file
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tags (comma separated)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="production, database, eu-west" {...field} className="bg-slate-900 border-slate-800" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 border-t border-slate-800">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-slate-800 hover:text-white">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                                {editId ? 'Save Changes' : 'Create Connection'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
