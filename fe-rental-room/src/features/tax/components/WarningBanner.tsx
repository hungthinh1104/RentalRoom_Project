import { AlertTriangle } from 'lucide-react';

export function WarningBanner() {
    return (
        <div className="bg-warning-light border-l-4 border-warning p-4 mb-4 rounded-r-md">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-foreground">
                        <strong>⚠️ DISCLAIMER:</strong> Số liệu này CHỈ để tham khảo.
                        <span className="block mt-1">
                            Hệ thống KHÔNG thay thế tư vấn thuế/luật. Landlord tự kiểm tra và chịu trách nhiệm khi khai thuế.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
