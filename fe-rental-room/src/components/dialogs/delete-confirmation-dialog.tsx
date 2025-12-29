"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  itemName: string;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  itemName,
  isLoading,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          <div className="space-y-2 text-sm text-muted-foreground">
            <AlertDialogDescription asChild>
              <p>{description}</p>
            </AlertDialogDescription>
            <div className="bg-muted px-3 py-2 rounded-md mt-3">
              <p className="font-semibold text-foreground text-xs uppercase tracking-tight">
                Sẽ xóa: {itemName}
              </p>
            </div>
            <p className="text-xs text-destructive font-semibold mt-3">
              ⚠️ Thao tác này không thể hoàn tác. Hãy chắc chắn trước khi xóa!
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Đang xóa..." : "Xóa vĩnh viễn"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
