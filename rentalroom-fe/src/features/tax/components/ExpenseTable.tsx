import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxService } from '@/features/tax/api/tax-api';
import { formatCurrency, formatDate } from '@/utils/tax-helpers';
import { Trash2, FileText, Loader2 } from 'lucide-react';
import { Expense } from '@/types/tax';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ExpenseTableProps {
    year: number;
}

export function ExpenseTable({ year }: ExpenseTableProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: expenses, isLoading } = useQuery({
        queryKey: ['expenses', year],
        queryFn: () => taxService.getExpenses(year),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => taxService.deleteExpense(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast({
                title: 'Đã xóa',
                description: 'Khoản chi đã được xóa thành công',
            });
        },
        onError: () => {
            toast({
                title: 'Lỗi',
                description: 'Không thể xóa khoản chi',
                variant: 'destructive',
            });
        }
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Đang tải dữ liệu...</div>;

    if (!expenses || expenses.length === 0) {
        return (
            <div className="text-center p-12 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-foreground font-medium">Chưa có chi phí</h3>
                <p className="text-sm">Chưa có khoản chi nào được ghi nhận trong năm {year}.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ngày chi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bất động sản</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Loại chi phí</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Diễn giải</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Số tiền</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {expenses.map((expense: Expense) => (
                        <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {formatDate(expense.paidAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {expense.rentalUnit?.name || '---'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                {expense.expenseType}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={expense.note}>
                                {expense.note || expense.receiptNumber || '---'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-foreground font-mono">
                                {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Xóa khoản chi?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Hành động này không thể hoàn tác.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => deleteMutation.mutate(expense.id)}
                                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                            >
                                                Xóa
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
