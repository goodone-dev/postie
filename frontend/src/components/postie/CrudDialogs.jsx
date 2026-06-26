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
