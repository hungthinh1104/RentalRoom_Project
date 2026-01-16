"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Snapshot } from "@/lib/api/snapshotsApi";
import { useVerifySnapshot } from "@/features/admin/hooks/use-audit-logs";
import { ShieldCheck, ShieldAlert, Loader2, FileJson, Hash } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditDetailModalProps {
    snapshot: Snapshot | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AuditDetailModal({ snapshot, isOpen, onClose }: AuditDetailModalProps) {
    const [shouldVerify, setShouldVerify] = useState(false);

    // Only run verify query when button is clicked (controlled by shouldVerify state)
    const { data: verifyResult, isLoading: isVerifying, isError } = useVerifySnapshot(
        shouldVerify && snapshot ? snapshot.id : null
    );

    const handleVerify = () => {
        setShouldVerify(true);
    };

    const handleClose = () => {
        setShouldVerify(false);
        onClose();
    };

    if (!snapshot) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Audit Log Details
                        <Badge variant="outline" className="ml-2">{snapshot.actionType}</Badge>
                    </DialogTitle>
                    <DialogDescription>
                        ID: <code className="text-xs">{snapshot.id}</code>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Thời gian</p>
                            <p className="font-medium">{new Date(snapshot.timestamp).toLocaleString('vi-VN')}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Actor</p>
                            <p className="font-medium">{snapshot.actorRole} ({snapshot.actorId.slice(0, 8)}...)</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Entity</p>
                            <p className="font-medium">{snapshot.entityType} / {snapshot.entityId}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">IP / Client</p>
                            <p className="font-medium">{snapshot.ipAddress || 'N/A'} - {snapshot.userAgent || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="border rounded-md p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Data Hash (Integrity Check)
                            </h4>

                            {!shouldVerify && (
                                <Button size="sm" onClick={handleVerify} variant="outline" className="h-7 text-xs">
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Verify Integrity
                                </Button>
                            )}

                            {shouldVerify && isVerifying && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Verifying...
                                </div>
                            )}

                            {shouldVerify && !isVerifying && verifyResult && (
                                verifyResult.isValid ? (
                                    <Badge className="bg-green-600 hover:bg-green-700">
                                        <ShieldCheck className="h-3 w-3 mr-1" /> Verified Valid
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        <ShieldAlert className="h-3 w-3 mr-1" /> Tampered!
                                    </Badge>
                                )
                            )}
                        </div>
                        <code className="text-xs break-all text-muted-foreground block p-2 bg-background border rounded">
                            {snapshot.dataHash}
                        </code>
                    </div>

                    <div className="flex-1 overflow-auto border rounded-md">
                        <div className="p-2 border-b bg-muted/10 sticky top-0 flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            <span className="text-sm font-medium">Metadata Payload</span>
                        </div>
                        <ScrollArea className="h-[200px] sm:h-[300px]">
                            <div className="p-4">
                                <pre className="text-xs font-mono whitespace-pre-wrap">
                                    {JSON.stringify(snapshot.metadata, null, 2)}
                                </pre>
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-auto">
                    <Button variant="outline" onClick={handleClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
