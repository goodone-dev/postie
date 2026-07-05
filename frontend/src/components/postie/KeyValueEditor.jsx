import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { EnvInput } from './EnvAutocomplete';

export const KeyValueEditor = ({
    rows,
    onChange,
    placeholderKey = 'Key',
    placeholderValue = 'Value',
    showDescription = true,
    readonlyKey = false,
    envVariables = [],
}) => {
    const update = (id, field, value) => {
        const next = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
        // Auto-add empty row (only for editable key mode)
        if (!readonlyKey) {
            const last = next[next.length - 1];
            if (last && (last.key || last.value)) {
                next.push({ id: `kv-${Date.now()}-${Math.random()}`, key: '', value: '', description: '', enabled: true });
            }
        }
        onChange(next);
    };
    const remove = (id) => {
        let next = rows.filter((r) => r.id !== id);
        if (next.length === 0) next = [{ id: `kv-${Date.now()}`, key: '', value: '', description: '', enabled: true }];
        onChange(next);
    };

    const inputBase = 'h-9 border-0 border-l border-border rounded-none text-sm mono bg-transparent focus:outline-none focus-visible:ring-0 focus-visible:bg-primary-soft/50 px-3 w-full';

    return (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-0 bg-secondary/50 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                <div className="px-3 py-2 w-9" />
                <div className="px-3 py-2 border-l border-border">Key</div>
                <div className="px-3 py-2 border-l border-border">Value</div>
                {showDescription && <div className="px-3 py-2 border-l border-border">Description</div>}
                {!readonlyKey && <div className="px-3 py-2 w-10 border-l border-border" />}
            </div>
            <div className="divide-y divide-border">
                {rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-stretch group hover:bg-secondary/30 transition-colors">
                        <div className="px-3 py-2 flex items-center w-9">
                            <Checkbox
                                checked={row.enabled}
                                onCheckedChange={(v) => update(row.id, 'enabled', !!v)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                        </div>

                        {/* Key cell */}
                        {readonlyKey ? (
                            <input
                                value={row.key}
                                readOnly
                                className={`${inputBase} text-muted-foreground cursor-default select-none`}
                            />
                        ) : (
                            <EnvInput
                                envVariables={envVariables}
                                value={row.key}
                                onChange={(e) => update(row.id, 'key', e.target.value)}
                                placeholder={placeholderKey}
                                className={inputBase}
                            />
                        )}

                        {/* Value cell */}
                        <EnvInput
                            envVariables={envVariables}
                            value={row.value}
                            onChange={(e) => update(row.id, 'value', e.target.value)}
                            placeholder={placeholderValue}
                            className={inputBase}
                        />

                        {/* Description cell */}
                        {showDescription && (
                            <input
                                value={row.description}
                                onChange={(e) => update(row.id, 'description', e.target.value)}
                                placeholder="Description"
                                className={`${inputBase} font-sans`}
                            />
                        )}

                        {!readonlyKey && (
                            <button
                                onClick={() => remove(row.id)}
                                className="w-10 flex items-center justify-center border-l border-border text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {!readonlyKey && (
                <div className="p-2 bg-secondary/30 flex justify-between items-center">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary-soft">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Bulk Edit
                    </Button>
                    <span className="text-[11px] text-muted-foreground">{rows.filter((r) => r.enabled && r.key).length} active</span>
                </div>
            )}
            {readonlyKey && (
                <div className="p-2 bg-secondary/30 flex justify-end items-center">
                    <span className="text-[11px] text-muted-foreground">{rows.filter((r) => r.enabled).length} variable{rows.filter((r) => r.enabled).length !== 1 ? 's' : ''}</span>
                </div>
            )}
        </div>
    );
};
