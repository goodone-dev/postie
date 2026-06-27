import React from 'react';
import { Globe } from 'lucide-react';
import { KeyValueEditor } from './KeyValueEditor';
import { Badge } from '@/components/ui/badge';

// Environment variable editor shown as a main-area tab. Auto-saves on every edit.
export const EnvironmentEditor = ({ env, onChange }) => {
    const rows =
        env.variables && env.variables.length > 0
            ? env.variables
            : [{ id: 'v-empty', key: '', value: '', enabled: true }];

    return (
        <div className="flex flex-col h-full bg-background" data-testid="environment-editor">
            <div className="px-5 pt-4 pb-3 border-b border-border bg-card/40">
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <h2 className="text-[15px] font-semibold text-foreground">{env.name}</h2>
                    {env.active && (
                        <Badge variant="secondary" className="text-[10px] bg-success-soft text-success border-0">
                            Active
                        </Badge>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                        Changes saved automatically
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Variables defined here can be referenced as <span className="mono">{'{{variable}}'}</span> in requests.
                </p>
            </div>

            <div className="flex-1 overflow-auto p-5 scrollbar-thin">
                <KeyValueEditor
                    rows={rows}
                    onChange={(next) => onChange(next)}
                    placeholderKey="VARIABLE"
                    placeholderValue="VALUE"
                    showDescription={true}
                />
            </div>
        </div>
    );
};
