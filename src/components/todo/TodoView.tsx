export default function TodoView() {
    return (
        <div className="h-full flex flex-col bg-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-6">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-termilo-primary rounded-lg flex items-center justify-center text-white text-xl mr-4">
                        📝
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-termilo-dark">Todo Notes</h1>
                        <p className="text-termilo-muted mt-1">Manage your tasks and notes</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-termilo-card rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🚀</span>
                            </div>
                            <h2 className="text-xl font-semibold text-termilo-dark mb-2">Coming Soon</h2>
                            <p className="text-termilo-muted mb-6">
                                Todo notes functionality will be implemented here.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-8">
                            <div className="bg-termilo-card rounded-lg p-4">
                                <h3 className="font-medium text-termilo-dark mb-2">Task Management</h3>
                                <ul className="space-y-1 text-sm text-termilo-muted">
                                    <li>• Create and manage todo items</li>
                                    <li>• Mark tasks as complete</li>
                                    <li>• Set priorities and due dates</li>
                                </ul>
                            </div>
                            <div className="bg-termilo-card rounded-lg p-4">
                                <h3 className="font-medium text-termilo-dark mb-2">Organization</h3>
                                <ul className="space-y-1 text-sm text-termilo-muted">
                                    <li>• Organize notes by projects</li>
                                    <li>• Search and filter functionality</li>
                                    <li>• Tag and categorize tasks</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}