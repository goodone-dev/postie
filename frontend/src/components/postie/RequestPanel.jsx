import React from 'react';
import { Send, Save, ChevronDown, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { KeyValueEditor } from './KeyValueEditor';
import { MethodLabel } from './MethodBadge';
import { cn } from '@/lib/utils';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const methodColorMap = {
    GET: 'text-method-get',
    POST: 'text-method-post',
    PUT: 'text-method-put',
    PATCH: 'text-method-patch',
    DELETE: 'text-method-delete',
    HEAD: 'text-info',
    OPTIONS: 'text-muted-foreground',
};

export const RequestPanel = ({ request, onUpdate, onSend, onSave }) => {
    const update = (patch) => onUpdate({ ...request, ...patch });

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Title row */}
            <div className="px-5 pt-4 pb-3 border-b border-border bg-card/40">
                <div className="flex items-center gap-2 mb-3">
                    <input
                        data-testid="request-name-input"
                        value={request.name}
                        onChange={(e) => update({ name: e.target.value })}
                        className="text-[15px] font-semibold bg-transparent border-0 outline-none focus:bg-secondary/50 px-1.5 py-0.5 rounded-md transition-colors text-foreground min-w-0"
                        style={{ width: `${Math.max(request.name.length, 8)}ch` }}
                    />
                </div>

                {/* URL Bar */}
                <div className="flex items-stretch gap-2">
                    <div className="flex items-stretch flex-1 rounded-lg border border-border bg-card shadow-soft overflow-hidden focus-within:border-primary focus-within:shadow-glow transition-all">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button data-testid="method-select-trigger" className="flex items-center gap-1.5 px-3 hover:bg-secondary/60 border-r border-border min-w-[110px] justify-between">
                                    <MethodLabel method={request.method} className="text-[13px]" />
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-32">
                                {HTTP_METHODS.map((m) => (
                                    <DropdownMenuItem key={m} data-testid={`method-option-${m}`} onClick={() => update({ method: m })}>
                                        <span className={cn('mono font-bold text-xs w-14', methodColorMap[m])}>{m}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Input
                            data-testid="request-url-input"
                            value={request.url}
                            onChange={(e) => update({ url: e.target.value })}
                            placeholder="Enter request URL"
                            className="flex-1 border-0 rounded-none focus-visible:ring-0 mono text-sm h-11 bg-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && onSend()}
                        />
                    </div>
                    <Button
                        data-testid="send-request-btn"
                        onClick={onSend}
                        disabled={request.isSending}
                        className="h-11 px-6 gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-elegant font-semibold"
                    >
                        {request.isSending ? (
                            <>
                                <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse-soft" />
                                Sending
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" /> Send
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className={cn('h-11 px-3 bg-card relative', request.isDirty && request.sourceId && 'border-warning/60 text-warning hover:text-warning')}
                        onClick={onSave}
                        disabled={!request.sourceId}
                        title={request.sourceId ? (navigator.platform?.toLowerCase().includes('mac') ? '⌘S' : 'Ctrl+S') : 'Not a saved request'}
                        data-testid="save-request-btn"
                    >
                        <Save className="h-4 w-4" />
                        {request.isDirty && request.sourceId && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                value={request.activeTab}
                onValueChange={(v) => update({ activeTab: v })}
                className="flex-1 flex flex-col min-h-0"
            >
                <div className="px-5 border-b border-border bg-card/40">
                    <TabsList className="bg-transparent p-0 h-10 gap-1">
                        {[
                            { id: 'params', label: 'Params', count: request.params.filter((p) => p.key).length },
                            { id: 'auth', label: 'Authorization' },
                            { id: 'headers', label: 'Headers', count: request.headers.filter((h) => h.key).length },
                            { id: 'body', label: 'Body' },
                            { id: 'scripts', label: 'Scripts', disabled: true },
                            { id: 'tests', label: 'Tests', disabled: true },
                            { id: 'settings', label: 'Settings' },
                        ].map((t) => (
                            <TabsTrigger
                                key={t.id}
                                value={t.id}
                                disabled={t.disabled}
                                data-testid={`request-tab-${t.id}`}
                                className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[13px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {t.label}
                                {t.count > 0 && (
                                    <span className="ml-1.5 text-[10px] bg-primary-soft text-primary px-1.5 py-0.5 rounded-full font-semibold">
                                        {t.count}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="flex-1 overflow-auto p-5 scrollbar-thin">
                    <TabsContent value="params" className="mt-0">
                        <SectionHeader title="Query Params" description="Append parameters to the request URL" />
                        <KeyValueEditor rows={request.params} onChange={(rows) => update({ params: rows })} />
                    </TabsContent>

                    <TabsContent value="headers" className="mt-0">
                        <SectionHeader title="Headers" description="Headers are sent along with the request" />
                        <KeyValueEditor rows={request.headers} onChange={(rows) => update({ headers: rows })} />
                    </TabsContent>

                    <TabsContent value="auth" className="mt-0">
                        <AuthEditor auth={request.auth} onChange={(auth) => update({ auth })} />
                    </TabsContent>

                    <TabsContent value="body" className="mt-0">
                        <BodyEditor request={request} update={update} />
                    </TabsContent>

                    <TabsContent value="scripts" className="mt-0">
                        <ScriptsPlaceholder title="Pre-request Script" description="Run JavaScript before sending the request to set variables or modify the request." />
                    </TabsContent>
                    <TabsContent value="tests" className="mt-0">
                        <ScriptsPlaceholder title="Test Scripts" description="Write assertions to validate the response after it returns." />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-0">
                        <SettingsPanel />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

const SectionHeader = ({ title, description }) => (
    <div className="mb-3 flex items-end justify-between">
        <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
    </div>
);

const AuthEditor = ({ auth, onChange }) => (
    <div className="max-w-2xl">
        <SectionHeader title="Authorization" description="Configure auth credentials sent with the request" />
        <div className="grid sm:grid-cols-[180px_1fr] gap-6">
            <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Auth Type</Label>
                <Select value={auth.type} onValueChange={(v) => onChange({ ...auth, type: v })}>
                    <SelectTrigger className="h-9 bg-card">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Auth</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="apikey">API Key</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="min-w-0">
                {auth.type === 'none' && (
                    <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-6 text-center">
                        <p className="text-sm text-muted-foreground">This request does not use any authorization.</p>
                    </div>
                )}
                {auth.type === 'bearer' && (
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Token</Label>
                        <Input
                            value={auth.token}
                            onChange={(e) => onChange({ ...auth, token: e.target.value })}
                            placeholder="Paste your bearer token"
                            className="mono text-sm bg-card"
                        />
                    </div>
                )}
                {auth.type === 'basic' && (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Username</Label>
                            <Input placeholder="username" className="mono text-sm bg-card" />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Password</Label>
                            <Input type="password" placeholder="••••••••" className="mono text-sm bg-card" />
                        </div>
                    </div>
                )}
                {auth.type === 'apikey' && (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Key</Label>
                            <Input placeholder="X-API-Key" className="mono text-sm bg-card" />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Value</Label>
                            <Input placeholder="your_api_key" className="mono text-sm bg-card" />
                        </div>
                    </div>
                )}
                {auth.type === 'oauth2' && (
                    <div className="rounded-lg border border-border bg-card p-5">
                        <p className="text-sm font-medium mb-2">OAuth 2.0</p>
                        <p className="text-xs text-muted-foreground mb-3">Configure tokens via the authorization workflow.</p>
                        <Button size="sm" className="bg-gradient-primary text-primary-foreground">Get New Access Token</Button>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const BodyEditor = ({ request, update }) => {
    const types = [
        { id: 'none', label: 'none' },
        { id: 'form-data', label: 'form-data' },
        { id: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
        { id: 'raw', label: 'raw' },
        { id: 'binary', label: 'binary' },
        { id: 'graphql', label: 'GraphQL' },
    ];
    const isRaw = request.bodyType === 'raw' || request.bodyType === 'none';

    return (
        <div>
            <div className="mb-3">
                <RadioGroup
                    value={request.bodyType}
                    onValueChange={(v) => update({ bodyType: v })}
                    className="flex flex-wrap gap-x-5 gap-y-2"
                >
                    {types.map((t) => (
                        <label
                            key={t.id}
                            htmlFor={`bt-${t.id}`}
                            className="flex items-center gap-2 cursor-pointer text-[13px] text-foreground"
                        >
                            <RadioGroupItem value={t.id} id={`bt-${t.id}`} />
                            {t.label}
                        </label>
                    ))}
                    <div className="ml-auto flex items-center gap-2">
                        {request.bodyType === 'raw' && (
                            <Select defaultValue="json">
                                <SelectTrigger className="h-7 text-xs w-28 bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="json">JSON</SelectItem>
                                    <SelectItem value="xml">XML</SelectItem>
                                    <SelectItem value="html">HTML</SelectItem>
                                    <SelectItem value="text">Text</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                            <Code2 className="h-3.5 w-3.5" /> Beautify
                        </Button>
                    </div>
                </RadioGroup>
            </div>

            {request.bodyType === 'none' && (
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-12 text-center">
                    <p className="text-sm text-muted-foreground">This request does not have a body</p>
                </div>
            )}
            {isRaw && request.bodyType === 'raw' && (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex bg-secondary/50 border-b border-border">
                        <div className="px-3 py-2 text-[11px] text-muted-foreground mono uppercase tracking-wider font-semibold">JSON</div>
                    </div>
                    <Textarea
                        value={request.body}
                        onChange={(e) => update({ body: e.target.value })}
                        spellCheck={false}
                        className="min-h-[260px] mono text-sm border-0 rounded-none focus-visible:ring-0 bg-card resize-none leading-relaxed"
                    />
                </div>
            )}
            {(request.bodyType === 'form-data' || request.bodyType === 'x-www-form-urlencoded') && (
                <KeyValueEditor
                    rows={request.params}
                    onChange={(rows) => update({ params: rows })}
                    placeholderKey="key"
                    placeholderValue="value"
                />
            )}
            {request.bodyType === 'binary' && (
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-12 text-center">
                    <Button variant="outline" size="sm">Select File</Button>
                </div>
            )}
            {request.bodyType === 'graphql' && (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <Textarea
                        defaultValue={'query {\n  user(id: "1") {\n    id\n    name\n    email\n  }\n}'}
                        className="min-h-[220px] mono text-sm border-0 rounded-none focus-visible:ring-0 bg-card resize-none"
                    />
                </div>
            )}
        </div>
    );
};

const ScriptsPlaceholder = ({ title, description }) => (
    <div>
        <SectionHeader title={title} description={description} />
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex bg-secondary/50 border-b border-border px-3 py-2 text-[11px] mono text-muted-foreground uppercase tracking-wider font-semibold">
                JavaScript
            </div>
            <Textarea
                defaultValue={'// Examples\n// pm.environment.set("token", pm.response.json().token);\n// pm.test("Status is 200", () => pm.response.to.have.status(200));'}
                className="min-h-[220px] mono text-sm border-0 rounded-none focus-visible:ring-0 bg-card resize-none leading-relaxed"
            />
        </div>
    </div>
);

const SettingsPanel = () => (
    <div className="max-w-2xl space-y-4">
        <SettingRow title="Follow redirects" description="Follow HTTP 3xx redirects." defaultChecked />
        <SettingRow title="Strict SSL" description="Verify SSL certificates." defaultChecked />
        <SettingRow title="Encode URL automatically" description="Automatically encode URL parameters." defaultChecked />
        <SettingRow title="Disable cookie jar" description="Don’t store cookies from this request." />
    </div>
);

const SettingRow = ({ title, description, defaultChecked }) => {
    const [on, setOn] = React.useState(!!defaultChecked);
    return (
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
            </div>
            <button
                onClick={() => setOn(!on)}
                className={cn(
                    'h-5 w-9 rounded-full relative transition-colors',
                    on ? 'bg-primary' : 'bg-muted',
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-all',
                        on ? 'left-[18px]' : 'left-0.5',
                    )}
                />
            </button>
        </div>
    );
};
