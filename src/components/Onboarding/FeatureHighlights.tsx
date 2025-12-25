import { Button } from '@/components/ui/button';
import { OnboardingLayout } from './OnboardingLayout';

interface FeatureHighlightsProps {
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

export function FeatureHighlights({ onNext, onBack, onSkip }: FeatureHighlightsProps) {
    return (
        <OnboardingLayout>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
                {/* Left Column: Content */}
                <div className="flex flex-col gap-8 order-2 lg:order-1 text-left">
                    <div className="flex flex-col gap-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                            <span className="material-symbols-outlined text-sm">folder_open</span>
                            Features
                        </div>
                        <h1 className="text-white tracking-tight text-4xl md:text-5xl font-bold leading-tight">
                            Organize Your <br /> <span className="text-primary">Infrastructure</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-normal leading-relaxed max-w-[500px]">
                            Group servers by project, environment, or region. Tag your connections for instant filtering and launch multi-tab sessions in a single click.
                        </p>
                    </div>

                    {/* Progress Stepper */}
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-slate-700"></div>
                            <div className="h-1.5 w-12 rounded-full bg-primary shadow-[0_0_10px_rgba(37,123,244,0.5)]"></div>
                            <div className="h-1.5 w-12 rounded-full bg-slate-700"></div>
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Step 2 of 3</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-4 mt-4">
                        <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={onSkip}>
                            Skip
                        </Button>
                        <div className="flex-1"></div>
                        <Button variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-800" onClick={onBack}>
                            Back
                        </Button>
                        <Button className="bg-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20" onClick={onNext}>
                            Next <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
                        </Button>
                    </div>
                </div>

                {/* Right Column: Visual */}
                <div className="order-1 lg:order-2 flex items-center justify-center">
                    <div className="relative w-full max-w-[420px] bg-slate-900 rounded-xl border border-slate-700/50 shadow-2xl p-6 flex flex-col gap-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                        {/* Header Stats */}
                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-4">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Server Health</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-white text-3xl font-bold">98.2%</p>
                                    <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                                        Operational
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs">Total Nodes</p>
                                <p className="text-white font-bold text-lg">24</p>
                            </div>
                        </div>

                        {/* Groups */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">dns</span>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-bold">Production</p>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold">us-east-1 • 12 Nodes</p>
                                    </div>
                                </div>
                                <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[90%] bg-blue-500 rounded-full"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-orange-500/20 text-orange-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">code_blocks</span>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-bold">Staging</p>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold">eu-west • 8 Nodes</p>
                                    </div>
                                </div>
                                <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[65%] bg-orange-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">#database</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">#redis</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">#api-gateway</span>
                        </div>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
