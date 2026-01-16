"use client";

import { toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
    title: string;
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const toastConfig = {
    success: {
        icon: CheckCircle2,
        bgClass: "bg-success-light border-success",
        iconClass: "text-success",
        titleClass: "text-success-foreground",
    },
    error: {
        icon: XCircle,
        bgClass: "bg-destructive-light border-destructive",
        iconClass: "text-destructive",
        titleClass: "text-destructive-foreground",
    },
    warning: {
        icon: AlertCircle,
        bgClass: "bg-warning-light border-warning",
        iconClass: "text-warning",
        titleClass: "text-warning-foreground",
    },
    info: {
        icon: Info,
        bgClass: "bg-info-light border-info",
        iconClass: "text-info",
        titleClass: "text-info-foreground",
    },
};

export const toast = {
    success: (options: ToastOptions) => showToast("success", options),
    error: (options: ToastOptions) => showToast("error", options),
    warning: (options: ToastOptions) => showToast("warning", options),
    info: (options: ToastOptions) => showToast("info", options),
};

function showToast(type: ToastType, options: ToastOptions) {
    const config = toastConfig[type];
    const Icon = config.icon;

    return sonnerToast.custom(
        (t: string | number) => (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`
            ${config.bgClass}
            w-full max-w-md rounded-lg border-l-4 shadow-lg
            backdrop-blur-sm bg-opacity-95
            p-4 flex items-start gap-3
          `}
                >
                    {/* Icon */}
                    <div className={`${config.iconClass} flex-shrink-0 mt-0.5`}>
                        <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm ${config.titleClass}`}>
                            {options.title}
                        </h4>
                        {options.description && (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                {options.description}
                            </p>
                        )}
                        {options.action && (
                            <button
                                onClick={() => {
                                    options.action?.onClick();
                                    sonnerToast.dismiss(t);
                                }}
                                className={`
                  mt-2 text-sm font-medium underline-offset-4 hover:underline
                  ${config.iconClass}
                `}
                            >
                                {options.action.label}
                            </button>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => sonnerToast.dismiss(t)}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close notification"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            </AnimatePresence>
        ),
        {
            duration: options.duration || 4000,
        }
    );
}

// Convenience functions for simple messages
export const showSuccess = (message: string, description?: string) =>
    toast.success({ title: message, description });

export const showError = (message: string, description?: string) =>
    toast.error({ title: message, description });

export const showWarning = (message: string, description?: string) =>
    toast.warning({ title: message, description });

export const showInfo = (message: string, description?: string) =>
    toast.info({ title: message, description });
