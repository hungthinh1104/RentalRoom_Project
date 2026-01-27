'use client';

import React, { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalFinalityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    /** Type of action for styling */
    severity?: 'warning' | 'critical' | 'legal';
    /** Explicit consent text user must acknowledge */
    consentText?: string;
    /** Reference ID to show after action */
    referenceId?: string;
    /** Loading state */
    isLoading?: boolean;
}

/**
 * 🔒 LEGAL FINALITY DIALOG
 *
 * Critical security component that:
 * 1. Forces explicit consent before irreversible actions
 * 2. Shows clear warnings about legal implications
 * 3. Displays reference IDs for audit trail
 * 4. Prevents accidental confirmations
 *
 * MUST be used for:
 * - Contract signing/approval
 * - Payment confirmations
 * - Dispute resolution
 * - Meter reading submissions
 */
export function LegalFinalityDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    severity = 'warning',
    consentText = 'Tôi hiểu rằng hành động này không thể hoàn tác',
    referenceId,
    isLoading = false,
}: LegalFinalityDialogProps) {
    const [hasConsented, setHasConsented] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        // 🛡️ SECURITY FIX: Prevent race condition from spam-clicking
        if (!hasConsented || isConfirming) return;

        setIsConfirming(true);
        try {
            await onConfirm();
        } finally {
            setIsConfirming(false);
            setHasConsented(false);
            onOpenChange(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setHasConsented(false);
            setIsConfirming(false);
        }
        onOpenChange(newOpen);
    };

    const Icon =
        severity === 'critical'
            ? AlertTriangle
            : severity === 'legal'
                ? Shield
                : Lock;

    const iconColor =
        severity === 'critical'
            ? 'text-destructive'
            : severity === 'legal'
                ? 'text-info'
                : 'text-warning';

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "p-2 rounded-full",
                                severity === 'critical'
                                    ? 'bg-destructive/10'
                                    : severity === 'legal'
                                        ? 'bg-info/10'
                                        : 'bg-warning/10'
                            )}
                        >
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                        <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left pt-2">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Legal Warning Box */}
                <div className="bg-muted/50 border border-border rounded-lg p-3 my-2">
                    <p className="text-sm text-muted-foreground">
                        ⚠️ <strong>Lưu ý pháp lý:</strong> Hành động này sẽ được ghi nhận
                        vào hệ thống audit và không thể hoàn tác. Dữ liệu sẽ được lưu trữ
                        theo quy định pháp luật.
                    </p>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                        id="consent"
                        checked={hasConsented}
                        onCheckedChange={(checked) => setHasConsented(checked === true)}
                        disabled={isLoading}
                    />
                    <label
                        htmlFor="consent"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        {consentText}
                    </label>
                </div>

                {/* Reference ID (shown if provided) */}
                {referenceId && (
                    <div className="bg-muted rounded p-2 text-xs font-mono text-muted-foreground">
                        Reference: {referenceId}
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading || isConfirming}>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={!hasConsented || isLoading || isConfirming}
                        className={cn(
                            severity === 'critical'
                                ? 'bg-destructive hover:bg-destructive/90'
                                : severity === 'legal'
                                    ? 'bg-info hover:bg-info/90 text-info-foreground border-none'
                                    : ''
                        )}
                    >
                        {isConfirming ? 'Đang xử lý...' : isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Simplified hook for common legal confirmation dialogs
 */
export function useLegalConfirmation() {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [config, setConfig] = useState<
        Omit<LegalFinalityDialogProps, 'open' | 'onOpenChange' | 'onConfirm'>
    >({
        title: '',
        description: '',
    });

    const confirm = (
        config: Omit<LegalFinalityDialogProps, 'open' | 'onOpenChange' | 'onConfirm'>,
        action: () => void
    ) => {
        setConfig(config);
        setPendingAction(() => action);
        setIsOpen(true);
    };

    const handleConfirm = () => {
        pendingAction?.();
        setIsOpen(false);
        setPendingAction(null);
    };

    const Dialog = () => (
        <LegalFinalityDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            onConfirm={handleConfirm}
            {...config}
        />
    );

    return { confirm, Dialog, isOpen };
}
