import React from 'react';
import { X, Plus, Circle, Globe, FilePlus, Copy, XCircle, XSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MethodLabel } from './MethodBadge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
} from '@/components/ui/context-menu';

export const RequestTabsBar = ({ tabs, activeId, onSelect, actions }) => {
    const { onNew, onDuplicate, onClose, onCloseOthers, onCloseAll, onForceClose } = actions;

    return (
        <div className="h-10 shrink-0 bg-card border-b border-border flex items-stretch">
            <ScrollArea className="flex-1">
                <div className="flex h-10">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeId;
                        const isEnv = tab.type === 'environment';
                        const menu = [
                            { label: 'New Request', icon: FilePlus, testId: 'tab-ctx-new', onClick: () => onNew() },
                            { label: 'Duplicate Tab', icon: Copy, testId: 'tab-ctx-duplicate', onClick: () => onDuplicate(tab.id) },
                            { separator: true },
                            { label: 'Close Tab', icon: X, testId: 'tab-ctx-close', onClick: () => onClose(tab.id) },
                            { label: 'Close Other Tabs', icon: XCircle, testId: 'tab-ctx-close-others', onClick: () => onCloseOthers(tab.id) },
                            { label: 'Close All Tabs', icon: XSquare, testId: 'tab-ctx-close-all', onClick: () => onCloseAll() },
                            { label: 'Force Close Tabs', icon: Trash2, danger: true, testId: 'tab-ctx-force-close', onClick: () => onForceClose() },
                        ];
                        return (
                            <ContextMenu key={tab.id}>
                                <ContextMenuTrigger asChild>
                                    <div
                                        data-testid={`open-tab-${tab.id}`}
                                        onClick={() => onSelect(tab.id)}
                                        className={cn(
                                            'group h-10 min-w-[180px] max-w-[260px] flex items-center gap-2 px-3 border-r border-border cursor-pointer transition-colors relative',
                                            isActive ? 'bg-background text-foreground' : 'bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                                        )}
                                    >
                                        {isActive && <span className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                                        {isEnv ? <Globe className="h-3.5 w-3.5 text-primary shrink-0" /> : <MethodLabel method={tab.method} />}
                                        <span className="flex-1 text-[13px] truncate">{tab.name || (isEnv ? 'Environment' : 'Untitled')}</span>
                                        <button
                                            data-testid={`close-tab-${tab.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onClose(tab.id);
                                            }}
                                            className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-52">
                                    {menu.map((it, i) =>
                                        it.separator ? (
                                            <ContextMenuSeparator key={`sep-${i}`} />
                                        ) : (
                                            <ContextMenuItem
                                                key={it.label}
                                                data-testid={it.testId}
                                                onSelect={() => it.onClick()}
                                                className={cn('text-[13px] gap-2 cursor-pointer', it.danger && 'text-destructive focus:text-destructive')}
                                            >
                                                <it.icon className="h-3.5 w-3.5" />
                                                {it.label}
                                            </ContextMenuItem>
                                        ),
                                    )}
                                </ContextMenuContent>
                            </ContextMenu>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
            <button
                data-testid="new-tab-btn"
                onClick={onNew}
                className="shrink-0 px-3 hover:bg-secondary/60 border-r border-border text-muted-foreground hover:text-foreground transition-colors"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
};
