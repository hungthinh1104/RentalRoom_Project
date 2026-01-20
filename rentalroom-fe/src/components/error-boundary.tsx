'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary to catch React errors and show fallback UI
 * Prevents entire app from crashing
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to monitoring service (e.g., Sentry)
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <div className="max-w-md w-full space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-destructive-light p-4">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">
                                Đã xảy ra lỗi
                            </h2>
                            <p className="text-muted-foreground">
                                Xin lỗi, có lỗi xảy ra khi tải trang này. Vui lòng thử lại sau.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                                <p className="text-sm font-mono text-destructive">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="default"
                            >
                                Tải lại trang
                            </Button>
                            <Button
                                onClick={() => window.history.back()}
                                variant="outline"
                            >
                                Quay lại
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
