import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { useProfileStore, Profile, ConnectionType } from '@/store/profileStore';

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
}

const defaultValues: FormValues = {
    name: '',
    host: '',
    username: '',
    port: 22,
    type: 'vps',
    tags: '',
};

export function ConnectionModal({ open, onOpenChange, editId }: ConnectionModalProps) {
    const { addProfile, updateProfile, getProfile } = useProfileStore();
    const form = useForm<FormValues>({
        defaultValues,
    });

    // Reset or populate form when opening
    useEffect(() => {
        if (open) {
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
            authType: 'password' as const, // Placeholder default
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editId ? 'Edit Connection' : 'New Connection'}</DialogTitle>
                    <DialogDescription>
                        {editId ? 'Update your connection details below.' : 'Add a new SSH connection to your library.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Friendly Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Production DB" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="host"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Host / IP</FormLabel>
                                        <FormControl>
                                            <Input placeholder="192.168.1.1" {...field} />
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
                                            <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
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
                                            <Input placeholder="root" {...field} />
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
                                                <SelectTrigger>
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
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tags (comma separated)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="production, database, eu-west" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editId ? 'Save Changes' : 'Create Connection'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
