import { ReactNode } from 'react';

interface OnboardingLayoutProps {
    children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
    return (
        <div className="h-screen w-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-4xl animate-in fade-in zoom-in duration-500">
                {children}
            </div>
        </div>
    );
}
