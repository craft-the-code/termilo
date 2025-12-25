export default function AutomationView() {
    return (
        <div className="h-full flex flex-col bg-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-6">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-termilo-teal rounded-lg flex items-center justify-center text-white text-xl mr-4">
                        ⚙️
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-termilo-dark">Automation Scripts</h1>
                        <p className="text-termilo-muted mt-1">Create and run scripts across multiple servers</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-termilo-card rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🔧</span>
                            </div>
                            <h2 className="text-xl font-semibold text-termilo-dark mb-2">Coming Soon</h2>
                            <p className="text-termilo-muted mb-6">
                                Automation scripts functionality will be implemented here.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-8">
                            <div className="bg-termilo-card rounded-lg p-4">
                                <h3 className="font-medium text-termilo-dark mb-2">Script Management</h3>
                                <ul className="space-y-1 text-sm text-termilo-muted">
                                    <li>• Create reusable shell scripts</li>
                                    <li>• Save and organize script templates</li>
                                    <li>• Version control for scripts</li>
                                </ul>
                            </div>
                            <div className="bg-termilo-card rounded-lg p-4">
                                <h3 className="font-medium text-termilo-dark mb-2">Execution</h3>
                                <ul className="space-y-1 text-sm text-termilo-muted">
                                    <li>• Select multiple server profiles</li>
                                    <li>• View execution results and logs</li>
                                    <li>• Schedule automated script runs</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}