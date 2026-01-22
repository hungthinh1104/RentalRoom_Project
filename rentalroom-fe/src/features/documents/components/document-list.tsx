
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MoreHorizontal, FileText, Download, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserDocument, UserDocumentType } from '@/features/documents/api/documents-api';
import { useDeleteDocument } from '@/features/documents/hooks/use-documents';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useState } from 'react';

interface DocumentListProps {
    documents: UserDocument[];
    isLoading: boolean;
}

const formatType = (type: UserDocumentType) => {
    switch (type) {
        case UserDocumentType.PCCC_CERTIFICATE: return 'Chứng nhận PCCC';
        case UserDocumentType.CONTRACT: return 'Hợp đồng';
        case UserDocumentType.DEED: return 'Sổ đỏ/Giấy tờ nhà';
        case UserDocumentType.BUSINESS_LICENSE: return 'Giấy phép KD';
        case UserDocumentType.INVOICE: return 'Hóa đơn';
        case UserDocumentType.IDENTITY_CARD: return 'CCCD/CMND';
        case UserDocumentType.OTHER: return 'Khác';
        default: return type;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'VALID': return 'default'; // primary
        case 'EXPIRED': return 'destructive';
        case 'PENDING_VERIFICATION': return 'secondary'; // or yellow/warning
        case 'REJECTED': return 'destructive';
        default: return 'outline';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'VALID': return 'Hợp lệ';
        case 'EXPIRED': return 'Hết hạn';
        case 'PENDING_VERIFICATION': return 'Chờ xác thực';
        case 'REJECTED': return 'Từ chối';
        default: return status;
    }
};

export function DocumentList({ documents, isLoading }: DocumentListProps) {
    const { mutate: deleteDocument } = useDeleteDocument();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Chưa có tài liệu nào</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Tải lên tài liệu đầu tiên để bắt đầu quản lý.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên tài liệu</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày hết hạn</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{doc.title}</span>
                                        {doc.description && (
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {doc.description}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{formatType(doc.type)}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(doc.status) as any}>
                                        {getStatusLabel(doc.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {doc.expiryDate ? (
                                        format(new Date(doc.expiryDate), 'dd/MM/yyyy', { locale: vi })
                                    ) : (
                                        <span className="text-muted-foreground text-xs">Không thời hạn</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(doc.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')}>
                                                <Eye className="mr-2 h-4 w-4" /> Xem
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')}>
                                                <Download className="mr-2 h-4 w-4" /> Tải xuống
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600"
                                                onClick={() => setDeleteId(doc.id)}
                                            >
                                                <Trash className="mr-2 h-4 w-4" /> Xóa
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Tài liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteId) {
                                    deleteDocument(deleteId);
                                    setDeleteId(null);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
