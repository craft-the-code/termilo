import { useState } from 'react';
import { useStore } from '../../store/useStore';

interface AddProfileModalProps {
    onClose: () => void;
}

export default function AddProfileModal({ onClose }: AddProfileModalProps) {
    const { addProfile } = useStore();
    const [formData, setFormData] = useState({
        name: '',
        host: '',
        port: 22,
        username: '',
        authMethod: 'password' as 'password' | 'key',
        password: '',
        keyPath: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.host || !formData.username) {
            alert('Please fill in required fields');
            return;
        }

        if (formData.authMethod === 'password' && !formData.password) {
            alert('Password is required for password authentication');
            return;
        }

        if (formData.authMethod === 'key' && !formData.keyPath) {
            alert('Key path is required for key authentication');
            return;
        }

        addProfile({
            name: formData.name,
            host: formData.host,
            port: formData.port,
            username: formData.username,
            authMethod: formData.authMethod,
            password: formData.authMethod === 'password' ? formData.password : undefined,
            keyPath: formData.authMethod === 'key' ? formData.keyPath : undefined,
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                <h3 className="text-lg font-semibold mb-4 text-termilo-dark">Add SSH Server</h3>

                <form onSubmit={handleSubmit}>
                    {/* Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-termilo-dark">Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-termilo-border rounded"
                            placeholder="Production Server"
                        />
                    </div>

                    {/* Host */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-termilo-dark">Host *</label>
                        <input
                            type="text"
                            value={formData.host}
                            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                            className="w-full px-3 py-2 border border-termilo-border rounded"
                            placeholder="192.168.1.100"
                        />
                    </div>

                    {/* Port & Username */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-termilo-dark">Port</label>
                            <input
                                type="number"
                                value={formData.port}
                                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 22 })}
                                className="w-full px-3 py-2 border border-termilo-border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-termilo-dark">Username *</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-3 py-2 border border-termilo-border rounded"
                                placeholder="root"
                            />
                        </div>
                    </div>

                    {/* Auth Method */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-termilo-dark">Authentication</label>
                        <select
                            value={formData.authMethod}
                            onChange={(e) => setFormData({ ...formData, authMethod: e.target.value as 'password' | 'key' })}
                            className="w-full px-3 py-2 border border-termilo-border rounded"
                        >
                            <option value="password">Password</option>
                            <option value="key">SSH Key</option>
                        </select>
                    </div>

                    {/* Password or Key Path */}
                    {formData.authMethod === 'password' ? (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1 text-termilo-dark">Password *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border border-termilo-border rounded"
                            />
                        </div>
                    ) : (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1 text-termilo-dark">Private Key Path *</label>
                            <input
                                type="text"
                                value={formData.keyPath}
                                onChange={(e) => setFormData({ ...formData, keyPath: e.target.value })}
                                className="w-full px-3 py-2 border border-termilo-border rounded"
                                placeholder="/home/user/.ssh/id_rsa"
                            />
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-termilo-muted hover:text-termilo-dark"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-termilo-primary text-white rounded hover:bg-termilo-primary"
                        >
                            Add Server
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}