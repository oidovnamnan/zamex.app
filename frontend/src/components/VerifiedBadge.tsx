import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface VerifiedBadgeProps {
    isVerified?: boolean;
    className?: string;
    showText?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
    isVerified = false,
    className,
    showText = false
}) => {
    if (!isVerified) return null;

    return (
        <div className={cn("inline-flex items-center gap-1 text-blue-500", className)}>
            <BadgeCheck className="w-4 h-4 fill-blue-500 text-white" />
            {showText && <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>}
        </div>
    );
};
