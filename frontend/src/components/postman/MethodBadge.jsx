import React from 'react';
import { cn } from '@/lib/utils';
import { methodBgMap } from '@/data/mockData';

const SIZE_CLASS = {
    xs: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    sm: 'text-[11px] px-2 py-0.5',
};

export const MethodBadge = ({ method, size = 'sm', className }) => {
    const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.sm;
    return (
        <span
            className={cn(
                'mono font-semibold rounded-md tracking-wide inline-flex items-center justify-center min-w-[3rem]',
                methodBgMap[method] || 'bg-muted text-muted-foreground',
                sizeClass,
                className,
            )}
        >
            {method}
        </span>
    );
};

export const MethodLabel = ({ method, className }) => {
    const colorMap = {
        GET: 'text-method-get',
        POST: 'text-method-post',
        PUT: 'text-method-put',
        PATCH: 'text-method-patch',
        DELETE: 'text-method-delete',
        HEAD: 'text-info',
        OPTIONS: 'text-muted-foreground',
    };
    return <span className={cn('mono font-bold text-xs tracking-wide', colorMap[method], className)}>{method}</span>;
};
