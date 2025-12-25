import { Sidebar } from '@/components/Sidebar/Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex h-screen w-screen bg-background overflow-hidden text-foreground">
            <Sidebar />
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {children}
            </main>
        </div>
    );
}
