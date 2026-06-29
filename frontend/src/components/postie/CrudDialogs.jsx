import React from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Boxes } from 'lucide-react';

// Controlled destructive confirm dialog (delete / close tabs)
export const ConfirmDialog = ({ open, onOpenChange, config }) => {
    const { title, description, confirmText } = config || {};
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent data-testid="confirm-dialog">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel data-testid="confirm-dialog-cancel">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        data-testid="confirm-dialog-confirm"
                        onClick={() => config?.onConfirm?.()}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        {confirmText || 'Confirm'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

// Workspace picker modal for "Move To"
export const MoveDialog = ({ open, onOpenChange, config }) => {
    const { collectionName, workspaces = [], onPick } = config || {};
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" data-testid="move-dialog" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-base">Move "{collectionName}"</DialogTitle>
                    <DialogDescription className="text-sm">Choose a workspace to move this collection into.</DialogDescription>
                </DialogHeader>
                <div className="space-y-1 py-1 max-h-72 overflow-auto">
                    {workspaces.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-6">No other workspaces available.</div>
                    )}
                    {workspaces.map((w) => (
                        <button
                            key={w.id}
                            data-testid={`move-target-${w.id}`}
                            onClick={() => {
                                onPick(w.id);
                                onOpenChange(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/60 hover:border-primary/40 transition-colors text-left"
                        >
                            <span className="h-8 w-8 rounded-lg bg-primary-soft flex items-center justify-center">
                                <Boxes className="h-4 w-4 text-primary" />
                            </span>
                            <span className="text-sm font-medium truncate">{w.name}</span>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const SaveRequestDialog = ({ open, onOpenChange, config }) => {
    const { defaultName = 'New Request', collections = [], onSave } = config || {};
    const [name, setName] = React.useState(defaultName);
    const [colId, setColId] = React.useState('');
    const [folderId, setFolderId] = React.useState('');

    React.useEffect(() => {
        if (open) {
            setName(defaultName);
            setColId('');
            setFolderId('');
        }
    }, [open, defaultName]);

    const activeCol = collections.find(c => c.id === colId);
    // Flatten folders for the select dropdown
    const flattenFolders = (folders, depth = 0) => {
        let result = [];
        for (const f of folders || []) {
            result.push({ ...f, depth });
            result = result.concat(flattenFolders(f.folders, depth + 1));
        }
        return result;
    };
    const folderOptions = activeCol ? flattenFolders(activeCol.folders) : [];

    const handleSave = () => {
        if (!name.trim() || !colId) return;
        onSave(colId, folderId || null, name.trim());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" data-testid="save-request-dialog">
                <DialogHeader>
                    <DialogTitle className="text-base">Save Request</DialogTitle>
                    <DialogDescription className="text-sm">Choose where to save this request.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Request Name</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My API Request"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Collection</label>
                        <select
                            value={colId}
                            onChange={(e) => {
                                setColId(e.target.value);
                                setFolderId('');
                            }}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="" disabled>Select a collection</option>
                            {collections.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    {activeCol && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Folder (Optional)</label>
                            <select
                                value={folderId}
                                onChange={(e) => setFolderId(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">Root of collection</option>
                                {folderOptions.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {'\u00A0'.repeat(f.depth * 4)}
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-secondary/80 h-9 px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || !colId}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50"
                    >
                        Save Request
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
