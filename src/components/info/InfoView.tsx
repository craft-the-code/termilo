import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { invoke } from '@tauri-apps/api/core';
import { platform, arch } from '@tauri-apps/plugin-os';

interface SystemInfo {
    os: string;
    arch: string;
    totalMemory: string;
    availableMemory: string;
    usedMemory: string;
    memoryUsagePercent: number;
    cpuCount: number;
    cpuModel?: string;
    cpuFrequency: string;
    cpuUsage: number;
    username: string;
    hostname: string;
    uptime: string;
    diskTotal: string;
    diskAvailable: string;
    diskUsagePercent: number;
}

interface ChartDataPoint {
    timestamp: number;
    cpu: number;
    memory: number;
}

type TabType = 'app-info' | 'system-monitor' | 'contact';

// Real system info function using Tauri commands
const getRealSystemInfo = async () => {
    try {
        // Get system info from Rust backend
        const sysInfo = await invoke('get_system_info') as any;
        const platformName = await platform();
        const archName = await arch();

        return {
            ...sysInfo,
            os: `${platformName} ${archName}`,
            arch: archName,
        };
    } catch (error) {
        console.error('Failed to get real system info:', error);
        throw error;
    }
};

export default function InfoView() {
    const [activeTab, setActiveTab] = useState<TabType>('app-info');
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

    // Real-time data collection for system monitor
    useEffect(() => {
        if (activeTab !== 'system-monitor') return;

        const interval = setInterval(async () => {
            try {
                // Get real-time system data
                const sysInfo = await getRealSystemInfo();
                const now = Date.now();

                const totalMem = sysInfo.total_memory || 0;
                const usedMem = sysInfo.used_memory || 0;
                const memoryPercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;

                setChartData(prev => {
                    const newData = [...prev, {
                        timestamp: now,
                        cpu: Math.round(sysInfo.cpu_usage || 0),
                        memory: Math.round(memoryPercent)
                    }];
                    // Keep the last 5 minutes of data (approx. 60 points at 5s interval)
                    return newData.slice(-60);
                });
            } catch (error) {
                console.error('Failed to fetch real-time data:', error);
            }
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [activeTab]);

    useEffect(() => {
        const fetchSystemInfo = async () => {
            try {
                // Get real system information
                const sysInfo = await getRealSystemInfo();

                const totalMem = sysInfo.total_memory || 0;
                const usedMem = sysInfo.used_memory || 0;
                const memoryPercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;

                const diskTotal = sysInfo.disk_total || 0;
                const diskUsed = diskTotal - (sysInfo.disk_available || 0);
                const diskPercent = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0;

                setSystemInfo({
                    os: sysInfo.os,
                    arch: sysInfo.arch,
                    totalMemory: formatBytes(totalMem),
                    availableMemory: formatBytes(sysInfo.available_memory || 0),
                    usedMemory: formatBytes(usedMem),
                    memoryUsagePercent: Math.round(memoryPercent),
                    cpuCount: sysInfo.cpu_count || 0,
                    cpuModel: sysInfo.cpu_model || 'Unknown',
                    cpuFrequency: formatFrequency(sysInfo.cpu_frequency || 0),
                    cpuUsage: Math.round(sysInfo.cpu_usage || 0),
                    username: sysInfo.username || 'Unknown',
                    hostname: sysInfo.hostname || 'Unknown',
                    uptime: formatUptime(sysInfo.uptime || 0),
                    diskTotal: formatBytes(diskTotal),
                    diskAvailable: formatBytes(sysInfo.disk_available || 0),
                    diskUsagePercent: Math.round(diskPercent),
                });
            } catch (error) {
                console.error('Failed to fetch system info:', error);
                setSystemInfo({
                    os: 'Unable to fetch',
                    arch: 'Unable to fetch',
                    totalMemory: 'N/A',
                    availableMemory: 'N/A',
                    usedMemory: 'N/A',
                    memoryUsagePercent: 0,
                    cpuCount: 0,
                    cpuModel: 'Unable to fetch',
                    cpuFrequency: 'N/A',
                    cpuUsage: 0,
                    username: 'Unable to fetch',
                    hostname: 'Unable to fetch',
                    uptime: 'N/A',
                    diskTotal: 'N/A',
                    diskAvailable: 'N/A',
                    diskUsagePercent: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSystemInfo();
    }, []);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatFrequency = (mhz: number): string => {
        if (mhz === 0) return 'N/A';
        if (mhz >= 1000) {
            return `${(mhz / 1000).toFixed(2)} GHz`;
        }
        return `${mhz} MHz`;
    };

    const formatUptime = (seconds: number): string => {
        if (seconds === 0) return 'N/A';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    const ProgressBar = ({ value, max = 100, color = "bg-sky-500" }: { value: number; max?: number; color?: string }) => (
        <div className="w-24 bg-slate-200 rounded-full h-2">
            <div
                className={`${color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
            />
        </div>
    );

    const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
            {children}
        </div>
    );

    const InfoItem = ({ label, value, icon, progress }: {
        label: string;
        value: string;
        icon?: string;
        progress?: { current: number; color?: string }
    }) => (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
            <div className="flex items-center">
                {icon && <span className="mr-2 text-lg">{icon}</span>}
                <span className="text-slate-500 font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-slate-800 font-mono text-sm">{value}</span>
                {progress && <ProgressBar value={progress.current} color={progress.color} />}
            </div>
        </div>
    );

    const TabButton = ({ tab, label, icon }: { tab: TabType; label: string; icon: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
            <span className="mr-2">{icon}</span>
            {label}
        </button>
    );

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-2"></div>
                    <div className="text-slate-500">Loading system information...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white text-xl mr-4">
                            ℹ️
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-800">App Information</h1>
                            <p className="text-slate-500 mt-1">System details and application info</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2">
                        <TabButton tab="app-info" label="App Info" icon="🚀" />
                        <TabButton tab="system-monitor" label="System Monitor" icon="📊" />
                        <TabButton tab="contact" label="Contact" icon="📧" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {/* App Info Tab */}
                    {activeTab === 'app-info' && (
                        <div className="space-y-6">
                            {/* System Information */}
                            <InfoCard title="System Information">
                                <div className="space-y-1">
                                    <InfoItem icon="💻" label="Operating System" value={systemInfo?.os || 'N/A'} />
                                    <InfoItem icon="🏠" label="Hostname" value={systemInfo?.hostname || 'N/A'} />
                                    <InfoItem icon="⏱️" label="Uptime" value={systemInfo?.uptime || 'N/A'} />
                                    <InfoItem icon="👤" label="Username" value={systemInfo?.username || 'N/A'} />
                                </div>
                            </InfoCard>

                            {/* Hardware Summary */}
                            <InfoCard title="Hardware Summary">
                                <div className="space-y-1">
                                    <InfoItem icon="🧠" label="CPU" value={`${systemInfo?.cpuModel || 'N/A'}`} />
                                    <InfoItem icon="💾" label="Memory" value={systemInfo?.totalMemory || 'N/A'} />
                                    <InfoItem icon="💽" label="Storage" value={systemInfo?.diskTotal || 'N/A'} />
                                </div>
                            </InfoCard>

                            {/* Application Information */}
                            <InfoCard title="Application Information">
                                <div className="space-y-1">
                                    <InfoItem icon="🚀" label="Application" value="Termilo" />
                                    <InfoItem icon="🔢" label="Version" value="1.0.0-beta" />
                                    <InfoItem icon="📜" label="License" value="Free" />
                                    <InfoItem icon="⚖️" label="License Type" value="Personal Use" />
                                    <InfoItem icon="🗓️" label="Build Date" value={new Date().toLocaleDateString()} />
                                    <InfoItem icon="💻" label="Framework" value="Tauri + React" />
                                    <InfoItem icon="🎨" label="UI Library" value="Tailwind CSS" />
                                </div>
                            </InfoCard>
                        </div>
                    )}

                    {/* System Monitor Tab */}
                    {activeTab === 'system-monitor' && (
                        <div className="space-y-6">
                            {/* Real-time Charts */}
                            <InfoCard title="Real-time Performance">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-sm text-slate-500">
                                        {chartData.length > 0 && (
                                            <>
                                                Data points: {chartData.length} |
                                                Update interval: {5000/1000}s |
                                                Window: {chartData.length > 0 ?
                                                `${Math.round((Date.now() - chartData[0].timestamp) / 60000)}min` : '0min'
                                            }
                                            </>
                                        )}
                                        {chartData.length === 0 && "Collecting data..."}
                                    </div>
                                    <button
                                        onClick={() => setChartData([])}
                                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                                    >
                                        Clear Data
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 mb-3">CPU Usage (%)</h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart
                                                    data={chartData}
                                                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                                                >
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        tick={{ fontSize: 10 }}
                                                        interval="preserveStartEnd"
                                                        minTickGap={50}
                                                        tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
                                                    />
                                                    <YAxis
                                                        domain={[0, 100]}
                                                        tick={{ fontSize: 10 }}
                                                        width={30}
                                                    />
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <Tooltip
                                                        labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString()}`}
                                                        formatter={(value, name) => [`${value}%`, name]}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="cpu"
                                                        stroke="#0ea5e9"
                                                        fill="#0ea5e9"
                                                        fillOpacity={0.3}
                                                        strokeWidth={2}
                                                        dot={false}
                                                        isAnimationActive={false}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2 text-center">
                                            Current: {chartData.length > 0 ? chartData[chartData.length - 1]?.cpu : 0}%
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 mb-3">Memory Usage (%)</h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart
                                                    data={chartData}
                                                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                                                >
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        tick={{ fontSize: 10 }}
                                                        interval="preserveStartEnd"
                                                        minTickGap={50}
                                                        tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
                                                    />
                                                    <YAxis
                                                        domain={[0, 100]}
                                                        tick={{ fontSize: 10 }}
                                                        width={30}
                                                    />
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <Tooltip
                                                        labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString()}`}
                                                        formatter={(value, name) => [`${value}%`, name]}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="memory"
                                                        stroke="#14b8a6"
                                                        fill="#14b8a6"
                                                        fillOpacity={0.3}
                                                        strokeWidth={2}
                                                        dot={false}
                                                        isAnimationActive={false}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2 text-center">
                                            Current: {chartData.length > 0 ? chartData[chartData.length - 1]?.memory : 0}%
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Current Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InfoCard title="CPU">
                                    <div className="space-y-1">
                                        <InfoItem
                                            label="Usage"
                                            value={`${systemInfo?.cpuUsage || 0}%`}
                                            progress={{
                                                current: systemInfo?.cpuUsage || 0,
                                                color: systemInfo && systemInfo.cpuUsage > 80 ? "bg-red-500" : "bg-sky-500"
                                            }}
                                        />
                                        <InfoItem label="Model" value={systemInfo?.cpuModel || 'N/A'} />
                                        <InfoItem label="Cores" value={`${systemInfo?.cpuCount || 0}`} />
                                    </div>
                                </InfoCard>

                                <InfoCard title="Memory">
                                    <div className="space-y-1">
                                        <InfoItem
                                            label="Usage"
                                            value={`${systemInfo?.memoryUsagePercent || 0}%`}
                                            progress={{
                                                current: systemInfo?.memoryUsagePercent || 0,
                                                color: systemInfo && systemInfo.memoryUsagePercent > 85 ? "bg-red-500" : "bg-teal-500"
                                            }}
                                        />
                                        <InfoItem label="Used" value={systemInfo?.usedMemory || 'N/A'} />
                                        <InfoItem label="Available" value={systemInfo?.availableMemory || 'N/A'} />
                                    </div>
                                </InfoCard>

                                <InfoCard title="Storage">
                                    <div className="space-y-1">
                                        <InfoItem
                                            label="Usage"
                                            value={`${systemInfo?.diskUsagePercent || 0}%`}
                                            progress={{
                                                current: systemInfo?.diskUsagePercent || 0,
                                                color: systemInfo && systemInfo.diskUsagePercent > 90 ? "bg-red-500" : "bg-emerald-500"
                                            }}
                                        />
                                        <InfoItem label="Total" value={systemInfo?.diskTotal || 'N/A'} />
                                        <InfoItem label="Available" value={systemInfo?.diskAvailable || 'N/A'} />
                                    </div>
                                </InfoCard>
                            </div>
                        </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === 'contact' && (
                        <div className="space-y-6">
                            <InfoCard title="Contact Information">
                                <div className="space-y-1">
                                    <InfoItem icon="🌐" label="Website" value="https://termilo.app" />
                                    <InfoItem icon="📧" label="Email" value="dev.edward2212@gmail.com" />
                                    <InfoItem icon="💬" label="Support" value="GitHub Issues" />
                                    <InfoItem icon="🐙" label="Repository" value="github.com/termilo/termilo" />
                                </div>
                            </InfoCard>

                            <InfoCard title="Quick Actions">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => window.open('https://termilo.app', '_blank')}
                                        className="flex items-center justify-center p-4 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                                    >
                                        <span className="mr-2">🌐</span>
                                        Visit Website
                                    </button>
                                    <button
                                        onClick={() => window.open('mailto:dev.edward2212@gmail.com?subject=Termilo Feedback', '_blank')}
                                        className="flex items-center justify-center p-4 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                                    >
                                        <span className="mr-2">📧</span>
                                        Contact Support
                                    </button>
                                    <button
                                        onClick={() => window.open('https://github.com/termilo/termilo/issues', '_blank')}
                                        className="flex items-center justify-center p-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                    >
                                        <span className="mr-2">🐛</span>
                                        Report Issue
                                    </button>
                                    <button
                                        onClick={() => window.open('https://github.com/termilo/termilo', '_blank')}
                                        className="flex items-center justify-center p-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                    >
                                        <span className="mr-2">⭐</span>
                                        Star on GitHub
                                    </button>
                                </div>
                            </InfoCard>

                            <InfoCard title="About">
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-600">
                                        Termilo is a modern, cross-platform SSH terminal manager designed for developers.
                                        Built with Tauri and React, it provides a consistent Ubuntu-like terminal experience
                                        across Mac, Windows, and Linux.
                                    </p>
                                    <p className="text-slate-600 mt-4">
                                        Our mission is to simplify SSH connection management while maintaining the power
                                        and flexibility that developers need for their daily workflows.
                                    </p>
                                </div>
                            </InfoCard>

                            <div className="text-center text-slate-500 text-sm">
                                <p>© 2024 Termilo. Built with ❤️ for developers.</p>
                                <p className="mt-1">Cross-platform SSH terminal management made simple.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}