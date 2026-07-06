import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder,
    FolderOpen,
    ChevronRight,
    Plus,
    MoreHorizontal,
    Search,
    Globe,
    Boxes,
    Trash2,
    Pencil,
    FolderPlus,
    FilePlus2,
    CheckCircle2,
    Star,
    Copy,
    ChevronsDownUp,
    ArrowRight,
    Code2,
    FileText,
    GitBranch,
    History,
    StarOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { MethodLabel } from './MethodBadge';
import { InlineEdit } from './InlineEdit';
import { cn } from '@/lib/utils';

const COLLAPSE_ANIM = {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.18, ease: 'easeOut' },
};

const NAV_ITEMS = [
    { id: 'collections', label: 'Collections', icon: Boxes },
    { id: 'environments', label: 'Environments', icon: Globe },
    { id: 'history', label: 'History', icon: History },
    { id: 'flows', label: 'Flows', icon: GitBranch, disabled: true },
    { id: 'snippets', label: 'Snippets', icon: Code2, disabled: true },
    { id: 'docs', label: 'APIs', icon: FileText, disabled: true },
];

const renderMenu = (items, Item, Sep) =>
    items.filter(Boolean).map((it, i) =>
        it.separator ? (
            <Sep key={`sep-${i}`} />
        ) : (
            <Item
                key={it.label}
                data-testid={it.testId}
                onSelect={() => it.onClick()}
                className={cn('text-[13px] gap-2 cursor-pointer', it.danger && 'text-destructive focus:text-destructive')}
            >
                {it.icon && <it.icon className="h-3.5 w-3.5" />}
                {it.label}
            </Item>
        ),
    );

// Right-side cluster: shows `indicator` at rest; on hover OR when the menu is
// open it shows the `...` option button (which stays visible while open).
const RowActions = ({ items, testId, indicator }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="ml-auto flex items-center h-5 shrink-0 pl-1" onClick={(e) => e.stopPropagation()}>
            {indicator != null && (
                <span className={cn('flex items-center', open ? 'hidden' : 'group-hover:hidden')}>{indicator}</span>
            )}
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        data-testid={testId}
                        className={cn(
                            'h-5 w-5 rounded items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground',
                            open ? 'flex' : 'hidden group-hover:flex',
                        )}
                    >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                    {renderMenu(items, DropdownMenuItem, DropdownMenuSeparator)}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

const ContextWrap = ({ items, children }) => (
    <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">{renderMenu(items, ContextMenuItem, ContextMenuSeparator)}</ContextMenuContent>
    </ContextMenu>
);

export const Sidebar = ({ data, onOpenRequest, onOpenEnvironment, onMove, activeView, setActiveView, openConfirm }) => {
    const [search, setSearch] = useState('');
    const [edit, setEdit] = useState(null);
    const dragRef = useRef(null);

    const startCreate = (kind, colId, folderId) => setEdit({ mode: 'create', kind, colId, folderId });
    const startRename = (kind, id, colId, folderId) => setEdit({ mode: 'rename', kind, id, colId, folderId });
    const clearEdit = () => setEdit(null);

    const submitCreate = (name) => {
        const { kind, colId, folderId } = edit;
        if (kind === 'collection') data.addCollection(name);
        else if (kind === 'environment') data.createEnvironment(name);
        else if (kind === 'folder') data.addFolder(colId, name);
        else if (kind === 'subfolder') data.addFolder(colId, name, folderId);
        else if (kind === 'request') data.addRequest(colId, folderId ?? null, { name });
        clearEdit();
    };
    const submitRename = (name) => {
        const { kind, id, colId, folderId } = edit;
        if (kind === 'collection') data.renameCollection(id, name);
        else if (kind === 'folder') data.renameFolder(colId, id, name);
        else if (kind === 'request') data.renameRequest(colId, folderId, id, name);
        else if (kind === 'environment') data.renameEnvironment(id, name);
        clearEdit();
    };

    const editApi = { edit, startCreate, startRename, clearEdit, submitCreate, submitRename };
    const dnd = makeDnd(dragRef, data);

    const handleHeaderAdd = () => {
        if (activeView === 'collections') startCreate('collection');
        else if (activeView === 'environments') startCreate('environment');
    };
    const showAdd = activeView === 'collections' || activeView === 'environments';

    return (
        <div className="h-full flex bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
            {/* Rail */}
            <div className="w-14 shrink-0 border-r border-sidebar-border flex flex-col items-center py-3 gap-1 bg-card/40">
                <TooltipProvider delayDuration={200}>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        data-testid={`nav-${item.id}`}
                                        disabled={item.disabled}
                                        onClick={() => !item.disabled && setActiveView(item.id)}
                                        className={cn(
                                            'h-10 w-10 rounded-lg flex items-center justify-center transition-colors relative',
                                            item.disabled
                                                ? 'text-muted-foreground/40 cursor-not-allowed'
                                                : isActive
                                                    ? 'text-primary bg-primary-soft'
                                                    : 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground',
                                        )}
                                    >
                                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                        {isActive && !item.disabled && (
                                            <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">{item.label}{item.disabled ? ' · Soon' : ''}</TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="p-3 border-b border-sidebar-border">
                    <div className="flex items-center justify-between mb-3 h-7">
                        <h2 className="text-sm font-semibold capitalize">{activeView}</h2>
                        {showAdd && (
                            <Button data-testid="sidebar-add-btn" variant="ghost" size="icon" className="h-7 w-7" onClick={handleHeaderAdd}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            data-testid="sidebar-filter-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter"
                            className="h-8 pl-8 text-xs bg-card border-sidebar-border w-full"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2">
                        {activeView === 'collections' && (
                            <CollectionsView data={data} search={search} onOpenRequest={onOpenRequest} onMove={onMove} editApi={editApi} dnd={dnd} openConfirm={openConfirm} />
                        )}
                        {activeView === 'history' && <HistoryView history={data.history} onOpenRequest={onOpenRequest} />}
                        {activeView === 'environments' && (
                            <EnvironmentsView data={data} search={search} editApi={editApi} onOpenEnvironment={onOpenEnvironment} openConfirm={openConfirm} />
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

// ---- Drag & drop helpers ----
function makeDnd(dragRef, data) {
    const start = (payload) => (e) => {
        dragRef.current = payload;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            try {
                e.dataTransfer.setData('text/plain', payload.kind);
            } catch (_) { }
        }
        e.stopPropagation();
    };
    const over = (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    };
    const dropOnFolder = (colId, folderId) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const d = dragRef.current;
        if (!d) return;
        if (d.kind === 'request') data.moveRequest({ colId: d.colId, folderId: d.folderId, reqId: d.reqId }, { colId, folderId });
        else if (d.kind === 'folder' && d.folderId !== folderId) data.moveFolder({ colId: d.colId, folderId: d.folderId }, { colId, beforeFolderId: folderId });
        dragRef.current = null;
    };
    const dropOnRequest = (colId, folderId, reqId) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const d = dragRef.current;
        if (!d || d.kind !== 'request' || d.reqId === reqId) return;
        data.moveRequest({ colId: d.colId, folderId: d.folderId, reqId: d.reqId }, { colId, folderId, beforeReqId: reqId });
        dragRef.current = null;
    };
    const dropOnCollection = (col) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const d = dragRef.current;
        if (!d) return;
        if (d.kind === 'folder' && d.colId !== col.id) data.moveFolder({ colId: d.colId, folderId: d.folderId }, { colId: col.id });
        else if (d.kind === 'request' && col.folders[0]) data.moveRequest({ colId: d.colId, folderId: d.folderId, reqId: d.reqId }, { colId: col.id, folderId: col.folders[0].id });
        dragRef.current = null;
    };
    return { start, over, dropOnFolder, dropOnRequest, dropOnCollection };
}

const CollectionsView = ({ data, search, onOpenRequest, onMove, editApi, dnd, openConfirm }) => {
    const q = search.toLowerCase();
    const filtered = data.collections
        .map((c) => ({
            ...c,
            folders: (c.folders || []).map((f) => ({ ...f, requests: (f.requests || []).filter((r) => r.name.toLowerCase().includes(q)) })),
            requests: (c.requests || []).filter((r) => r.name.toLowerCase().includes(q))
        }))
        .filter((c) => !search || c.name.toLowerCase().includes(q) || (c.folders || []).some((f) => f.requests.length > 0) || (c.requests || []).length > 0)
        .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

    const creatingCollection = editApi.edit?.mode === 'create' && editApi.edit.kind === 'collection';

    if (data.collections.length === 0 && !creatingCollection) {
        return <EmptyView label="collections" onCreate={() => editApi.startCreate('collection')} />;
    }

    return (
        <div className="space-y-0.5">
            {creatingCollection && (
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Folder className="h-4 w-4 text-primary shrink-0" />
                    <InlineEdit placeholder="Collection name" className="text-sm font-medium" onSubmit={editApi.submitCreate} onCancel={editApi.clearEdit} />
                </div>
            )}
            {filtered.map((col) => (
                <CollectionRow key={col.id} col={col} data={data} onOpenRequest={onOpenRequest} onMove={onMove} editApi={editApi} dnd={dnd} openConfirm={openConfirm} />
            ))}
        </div>
    );
};

const CollectionRow = ({ col, data, onOpenRequest, onMove, editApi, dnd, openConfirm }) => {
    const { edit } = editApi;
    const isRenaming = edit?.mode === 'rename' && edit.kind === 'collection' && edit.id === col.id;

    const items = [
        { label: col.favorite ? 'Unfavorite' : 'Favorite', icon: col.favorite ? StarOff : Star, testId: `collection-favorite-${col.id}`, onClick: () => data.toggleFavorite(col.id) },
        {
            label: 'Add Request', icon: FilePlus2, testId: `collection-add-request-${col.id}`, onClick: async () => {
                if (!col.expanded) await data.toggleCollection(col.id);
                editApi.startCreate('request', col.id, null);
            }
        },
        {
            label: 'Add Folder', icon: FolderPlus, testId: `collection-add-folder-${col.id}`, onClick: async () => {
                if (!col.expanded) await data.toggleCollection(col.id);
                editApi.startCreate('folder', col.id);
            }
        },
        { label: 'Collapse Folders', icon: ChevronsDownUp, testId: `collection-collapse-${col.id}`, onClick: () => data.collapseCollection(col.id) },
        { separator: true },
        { label: 'Rename', icon: Pencil, testId: `collection-rename-${col.id}`, onClick: () => editApi.startRename('collection', col.id) },
        { label: 'Duplicate', icon: Copy, testId: `collection-duplicate-${col.id}`, onClick: () => data.duplicateCollection(col.id) },
        { label: 'Move', icon: ArrowRight, testId: `collection-move-${col.id}`, onClick: () => onMove(col) },
        { separator: true },
        { label: 'Delete', icon: Trash2, danger: true, testId: `collection-delete-${col.id}`, onClick: () => openConfirm({ title: `Delete "${col.name}"?`, description: 'This collection and all of its requests will be removed.', onConfirm: () => data.deleteCollection(col.id) }) },
    ];

    const creatingFolder = edit?.mode === 'create' && edit.kind === 'folder' && edit.colId === col.id;
    const creatingReqHere = edit?.mode === 'create' && edit.kind === 'request' && edit.colId === col.id && !edit.folderId;

    return (
        <div>
            <ContextWrap items={items}>
                <div
                    className="group w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-sidebar-hover transition-colors cursor-pointer"
                    onClick={() => !isRenaming && data.toggleCollection(col.id)}
                    onDoubleClick={(e) => { e.stopPropagation(); editApi.startRename('collection', col.id); }}
                    onDragOver={dnd.over}
                    onDrop={dnd.dropOnCollection(col)}
                    data-testid={`collection-toggle-${col.id}`}
                >
                    <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0', col.expanded && 'rotate-90')} />
                    {col.expanded ? <FolderOpen className="h-4 w-4 text-primary shrink-0" strokeWidth={2} /> : <Folder className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />}
                    {isRenaming ? (
                        <InlineEdit defaultValue={col.name} className="text-sm font-medium" onSubmit={editApi.submitRename} onCancel={editApi.clearEdit} />
                    ) : (
                        <span className="flex-1 text-sm font-medium truncate">{col.name}</span>
                    )}
                    {!isRenaming && (
                        <RowActions
                            items={items}
                            testId={`collection-menu-${col.id}`}
                            indicator={col.favorite ? <Star className="h-3.5 w-3.5 fill-warning text-warning" /> : null}
                        />
                    )}
                </div>
            </ContextWrap>

            <AnimatePresence initial={false}>
                {col.expanded && (
                    <motion.div {...COLLAPSE_ANIM} className="overflow-hidden">
                        <div className="ml-3 pl-2 border-l border-sidebar-border">
                            {col.folders.length === 0 && (col.requests || []).length === 0 && !creatingFolder && !creatingReqHere && (
                                <div className="px-2 py-1.5 text-[12px] text-muted-foreground italic">Empty collection</div>
                            )}
                            {col.folders.map((folder) => (
                                <FolderRow key={folder.id} col={col} folder={folder} data={data} onOpenRequest={onOpenRequest} editApi={editApi} dnd={dnd} openConfirm={openConfirm} />
                            ))}
                            {(col.requests || []).map((req) => (
                                <RequestRow key={req.id} col={col} folder={null} req={req} data={data} onOpenRequest={onOpenRequest} editApi={editApi} dnd={dnd} openConfirm={openConfirm} />
                            ))}
                            {creatingReqHere && (
                                <div className="flex items-center gap-2 px-2 py-1.5">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <InlineEdit placeholder="Request name" className="text-[13px]" onSubmit={editApi.submitCreate} onCancel={editApi.clearEdit} />
                                </div>
                            )}
                            {creatingFolder && (
                                <div className="flex items-center gap-1.5 px-2 py-1.5">
                                    <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <InlineEdit placeholder="Folder name" className="text-[13px]" onSubmit={editApi.submitCreate} onCancel={editApi.clearEdit} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FolderRow = ({ col, folder, data, onOpenRequest, editApi, dnd, openConfirm }) => {
    const { edit } = editApi;
    const isRenaming = edit?.mode === 'rename' && edit.kind === 'folder' && edit.id === folder.id;
    const creatingReq = edit?.mode === 'create' && edit.kind === 'request' && edit.folderId === folder.id;
    const creatingSubFolder = edit?.mode === 'create' && edit.kind === 'subfolder' && edit.folderId === folder.id;

    const items = [
        {
            label: 'Add Request', icon: FilePlus2, testId: `folder-add-request-${folder.id}`, onClick: async () => {
                if (!folder.expanded) await data.toggleFolder(col.id, folder.id);
                editApi.startCreate('request', col.id, folder.id)
            }
        },
        {
            label: 'Add Folder', icon: FolderPlus, testId: `folder-add-subfolder-${folder.id}`, onClick: async () => {
                if (!folder.expanded) await data.toggleFolder(col.id, folder.id);
                editApi.startCreate('subfolder', col.id, folder.id)
            }
        },
        { label: 'Collapse Folders', icon: ChevronsDownUp, testId: `folder-collapse-${folder.id}`, onClick: () => data.collapseFolder(col.id, folder.id) },
        { separator: true },
        { label: 'Rename', icon: Pencil, testId: `folder-rename-${folder.id}`, onClick: () => editApi.startRename('folder', folder.id, col.id) },
        { label: 'Duplicate', icon: Copy, testId: `folder-duplicate-${folder.id}`, onClick: () => data.duplicateFolder(col.id, folder.id) },
        { separator: true },
        { label: 'Delete', icon: Trash2, danger: true, testId: `folder-delete-${folder.id}`, onClick: () => openConfirm({ title: `Delete "${folder.name}"?`, description: 'This folder and its requests will be removed.', onConfirm: () => data.deleteFolder(col.id, folder.id) }) },
    ];

    return (
        <div>
            <ContextWrap items={items}>
                <div
                    className="group w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-sidebar-hover transition-colors cursor-pointer"
                    draggable={!isRenaming}
                    onDragStart={dnd.start({ kind: 'folder', colId: col.id, folderId: folder.id })}
                    onDragOver={dnd.over}
                    onDrop={dnd.dropOnFolder(col.id, folder.id)}
                    onClick={() => !isRenaming && data.toggleFolder(col.id, folder.id)}
                    onDoubleClick={(e) => { e.stopPropagation(); editApi.startRename('folder', folder.id, col.id); }}
                    data-testid={`folder-toggle-${folder.id}`}
                >
                    <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform shrink-0', folder.expanded && 'rotate-90')} />
                    {folder.expanded ? <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={2} /> : <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={2} />}
                    {isRenaming ? (
                        <InlineEdit defaultValue={folder.name} className="text-[13px]" onSubmit={editApi.submitRename} onCancel={editApi.clearEdit} />
                    ) : (
                        <span className="flex-1 text-[13px] truncate">{folder.name}</span>
                    )}
                    {!isRenaming && (
                        <RowActions
                            items={items}
                            testId={`folder-menu-${folder.id}`}
                            indicator={<span className="text-[10px] text-muted-foreground px-1">{(folder.requests || []).length}</span>}
                        />
                    )}
                </div>
            </ContextWrap>

            <AnimatePresence initial={false}>
                {folder.expanded && (
                    <motion.div {...COLLAPSE_ANIM} className="overflow-hidden ml-3 pl-2 border-l border-sidebar-border">
                        {(folder.requests || []).length === 0 && (folder.folders || []).length === 0 && !creatingReq && !creatingSubFolder && (
                            <div className="px-2 py-1.5 text-[12px] text-muted-foreground italic">No requests</div>
                        )}
                        {(folder.folders || []).map((subFolder) => (
                            <FolderRow key={subFolder.id} col={col} folder={subFolder} data={data} onOpenRequest={onOpenRequest} editApi={editApi} dnd={dnd} openConfirm={openConfirm} />
                        ))}
                        {(folder.requests || []).map((req) => (
                            <RequestRow key={req.id} col={col} folder={folder} req={req} data={data} onOpenRequest={onOpenRequest} editApi={editApi} dnd={dnd} openConfirm={openConfirm} />
                        ))}
                        {creatingSubFolder && (
                            <div className="flex items-center gap-1.5 px-2 py-1.5">
                                <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <InlineEdit placeholder="Folder name" className="text-[13px]" onSubmit={editApi.submitCreate} onCancel={editApi.clearEdit} />
                            </div>
                        )}
                        {creatingReq && (
                            <div className="flex items-center gap-2 px-2 py-1.5">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <InlineEdit placeholder="Request name" onSubmit={editApi.submitCreate} onCancel={editApi.clearEdit} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const RequestRow = ({ col, folder, req, data, onOpenRequest, editApi, dnd, openConfirm }) => {
    const { edit } = editApi;
    const isRenaming = edit?.mode === 'rename' && edit.kind === 'request' && edit.id === req.id;
    const items = [
        { label: 'Rename', icon: Pencil, testId: `request-rename-${req.id}`, onClick: () => editApi.startRename('request', req.id, col.id, folder?.id) },
        { label: 'Duplicate', icon: Copy, testId: `request-duplicate-${req.id}`, onClick: () => data.duplicateRequest(col.id, folder?.id, req.id) },
        { separator: true },
        { label: 'Delete', icon: Trash2, danger: true, testId: `request-delete-${req.id}`, onClick: () => openConfirm({ title: `Delete "${req.name}"?`, description: 'This request will be removed from the collection.', onConfirm: () => data.deleteRequest(col.id, folder?.id, req.id) }) },
    ];

    return (
        <ContextWrap items={items}>
            <div
                data-testid={`request-item-${req.id}`}
                draggable={!isRenaming}
                onDragStart={dnd.start({ kind: 'request', colId: col.id, folderId: folder?.id, reqId: req.id })}
                onDragOver={dnd.over}
                onDrop={dnd.dropOnRequest(col.id, folder?.id, req.id)}
                onClick={() => !isRenaming && onOpenRequest({ ...req, colId: col.id, folderId: folder?.id ?? null })}
                onDoubleClick={(e) => { e.stopPropagation(); editApi.startRename('request', req.id, col.id, folder?.id); }}
                className="group w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-hover transition-colors text-left cursor-pointer"
            >
                <MethodLabel method={req.method} className="w-11 shrink-0 text-left" />
                {isRenaming ? (
                    <InlineEdit defaultValue={req.name} className="text-[13px] text-foreground/90" onSubmit={editApi.submitRename} onCancel={editApi.clearEdit} />
                ) : (
                    <span className="flex-1 text-[13px] truncate text-foreground/90">{req.name}</span>
                )}
                {!isRenaming && <RowActions items={items} testId={`request-menu-${req.id}`} indicator={null} />}
            </div>
        </ContextWrap>
    );
};

const HistoryView = ({ history, onOpenRequest }) => (
    <div className="space-y-0.5">
        <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Today</div>
        {history.map((h) => (
            <button
                key={h.id}
                onClick={() => onOpenRequest({ name: h.url.split('/').pop(), method: h.method, url: h.url })}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-sidebar-hover transition-colors text-left"
            >
                <MethodLabel method={h.method} className="w-11 shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate">{h.url}</div>
                    <div className="text-[11px] text-muted-foreground">{h.time}</div>
                </div>
            </button>
        ))}
    </div>
);

const EnvironmentsView = ({ data, search, editApi, onOpenEnvironment, openConfirm }) => {
    const { edit } = editApi;
    const creating = edit?.mode === 'create' && edit.kind === 'environment';

    const q = (search || '').toLowerCase();
    const filtered = data.environments.filter((e) => e.name.toLowerCase().includes(q));

    if (data.environments.length === 0 && !creating) {
        return <EmptyView label="environments" onCreate={() => editApi.startCreate('environment')} />;
    }

    return (
        <div className="space-y-1">
            {creating && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-sidebar-border bg-card">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <InlineEdit placeholder="Environment name" className="text-sm font-medium" onSubmit={editApi.submitCreate} onCancel={editApi.clearEdit} />
                </div>
            )}
            {filtered.map((e) => {
                const isRenaming = edit?.mode === 'rename' && edit.kind === 'environment' && edit.id === e.id;
                const items = [
                    { label: 'Set active', icon: CheckCircle2, testId: `environment-activate-${e.id}`, onClick: () => data.setActiveEnvironment(e.id) },
                    { label: 'Rename', icon: Pencil, testId: `environment-rename-${e.id}`, onClick: () => editApi.startRename('environment', e.id) },
                    { label: 'Duplicate', icon: Copy, testId: `environment-duplicate-${e.id}`, onClick: () => data.duplicateEnvironment(e.id) },
                    { separator: true },
                    { label: 'Delete', icon: Trash2, danger: true, testId: `environment-delete-${e.id}`, onClick: () => openConfirm({ title: `Delete "${e.name}"?`, description: 'This environment will be removed.', onConfirm: () => data.deleteEnvironment(e.id) }) },
                ];
                const varCount = (e.variables || []).filter((v) => v.key).length;
                return (
                    <ContextWrap key={e.id} items={items}>
                        <div
                            data-testid={`environment-item-${e.id}`}
                            onClick={() => !isRenaming && onOpenEnvironment(e)}
                            onDoubleClick={(ev) => { ev.stopPropagation(); editApi.startRename('environment', e.id); }}
                            className="group flex items-center gap-2 px-3 py-2.5 rounded-lg border border-sidebar-border bg-card hover:bg-sidebar-hover transition-colors cursor-pointer"
                        >
                            <Globe className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                                {isRenaming ? (
                                    <InlineEdit defaultValue={e.name} className="text-sm font-medium" onSubmit={editApi.submitRename} onCancel={editApi.clearEdit} />
                                ) : (
                                    <div className="text-sm font-medium truncate">{e.name}</div>
                                )}
                                <div className="text-[11px] text-muted-foreground">{varCount} variable{varCount === 1 ? '' : 's'}</div>
                            </div>
                            {!isRenaming && (
                                <RowActions
                                    items={items}
                                    testId={`environment-menu-${e.id}`}
                                    indicator={e.active ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-success-soft text-success font-semibold">Active</span> : null}
                                />
                            )}
                        </div>
                    </ContextWrap>
                );
            })}
        </div>
    );
};

const EmptyView = ({ label, onCreate }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center mb-3">
            <Boxes className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-sm font-semibold mb-1">No {label} yet</h3>
        <p className="text-xs text-muted-foreground mb-4">Create one to get started</p>
        {onCreate && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onCreate} data-testid="empty-create-btn">
                <Plus className="h-3.5 w-3.5" /> New
            </Button>
        )}
    </div>
);
