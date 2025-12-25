import { Button } from '@/components/ui/button';
import { OnboardingLayout } from './OnboardingLayout';

interface WelcomeScreenProps {
    onNext: () => void;
    onSkip: () => void;
}

export function WelcomeScreen({ onNext, onSkip }: WelcomeScreenProps) {
    return (
        <OnboardingLayout>
            <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mb-4 ring-1 ring-white/10 shadow-2xl shadow-primary/20">
                    <span className="material-symbols-outlined text-[48px] text-primary">terminal</span>
                </div>

                <div className="space-y-4 max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                        Welcome to Termilo
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        Your modern, lightning-fast SSH terminal manager built for DevOps excellence.
                        Secure, beautiful, and ready for work.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full max-w-sm">
                    <Button
                        size="lg"
                        className="w-full text-lg h-14 font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
                        onClick={onNext}
                    >
                        Get Started
                        <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full text-lg h-14 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white"
                        onClick={onSkip}
                    >
                        Skip Setup
                    </Button>
                </div>

                <p className="text-sm text-slate-600 pt-8">
                    Version 1.0.0 • Built with Tauri & React
                </p>
            </div>
        </OnboardingLayout>
    );
}
