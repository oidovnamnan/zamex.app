'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './store';

const PUBLIC_PATHS = ['/auth', '/page']; // Add any other public paths

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading, fetchMe } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            // If we are on a public path, just allow it
            if (PUBLIC_PATHS.includes(pathname) || pathname === '/') {
                setAuthorized(true);
                return;
            }

            // Check if we have a token
            const token = localStorage.getItem('zamex_token');
            if (!token) {
                setAuthorized(false);
                router.push('/auth');
                return;
            }

            // If user is null but we have a token, fetchMe
            if (!user && !loading) {
                try {
                    await fetchMe();
                } catch {
                    router.push('/auth');
                    return;
                }
            }

            setAuthorized(true);
        };

        checkAuth();
    }, [user, loading, pathname, router]);

    if (!authorized && !PUBLIC_PATHS.includes(pathname) && pathname !== '/') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="w-8 h-8 border-3 border-zamex-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
