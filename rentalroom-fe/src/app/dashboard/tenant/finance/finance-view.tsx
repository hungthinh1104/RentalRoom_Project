"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import {
  DollarSign,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Wallet,
  CreditCard,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { format, isPast } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PaymentDialog } from "@/features/payments/components/PaymentDialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: string;
  description?: string;
  contractId: string;
}

interface FinanceViewProps {
  user: {
    id: string;
    role: string;
    [key: string]: any;
  };
  initialInvoices: {
    items: Invoice[];
    [key: string]: any;
  };
  initialStats: any;
}

export default function FinanceView({ user, initialInvoices, initialStats }: FinanceViewProps) {
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Fetch invoices with hydration
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["tenant-invoices", user?.id],
    queryFn: async () => {
      const { data } = await api.get("/invoices/my-invoices");
      return data;
    },
    enabled: !!user?.id,
    initialData: initialInvoices,
  });

  // Fetch payment stats with hydration
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["tenant-payment-stats", user?.id],
    queryFn: async () => {
      const { data } = await api.get("/invoices/stats");
      return data;
    },
    enabled: !!user?.id,
    initialData: initialStats,
  });

  const invoices: Invoice[] = invoicesData?.items || invoicesData || [];

  // Calculate stats from invoices
  const stats = {
    totalPaid: invoices.filter((i: Invoice) => i.status === "PAID").reduce((sum: number, i: Invoice) => sum + i.amount, 0),
    totalPending: invoices.filter((i: Invoice) => i.status === "PENDING").reduce((sum: number, i: Invoice) => sum + i.amount, 0),
    totalOverdue: invoices.filter((i: Invoice) => i.status === "PENDING" && isPast(new Date(i.dueDate))).reduce((sum: number, i: Invoice) => sum + i.amount, 0),
    paidCount: invoices.filter((i: Invoice) => i.status === "PAID").length,
    pendingCount: invoices.filter((i: Invoice) => i.status === "PENDING").length,
    overdueCount: invoices.filter((i: Invoice) => i.status === "PENDING" && isPast(new Date(i.dueDate))).length,
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `₫${(amount / 1_000_000).toFixed(1)}M`;
    }
    return `₫${amount.toLocaleString()}`;
  };

  const getInvoiceStatus = (invoice: Invoice) => {
    if (invoice.status === "PAID" || invoice.paidAt) return "PAID";
    if (isPast(new Date(invoice.dueDate))) return "OVERDUE";
    return "PENDING";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-success/10 text-success border-success/20">Đã thanh toán</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Quá hạn</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20">Chờ thanh toán</Badge>;
    }
  };

  const handlePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      toast.info("Đang tải hóa đơn...");

      // Create download link
      const downloadUrl = `${config.api.url}/v1/billing/invoices/${invoiceId}/download`;

      // Open in new tab to trigger download
      window.open(downloadUrl, '_blank');

      toast.success("Đã tải hóa đơn");
    } catch (error) {
      toast.error("Không thể tải hóa đơn");
    }
  };

  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    if (statusFilter !== "all") {
      const status = getInvoiceStatus(invoice);
      if (statusFilter !== status) return false;
    }
    if (monthFilter !== "all") {
      const invoiceMonth = format(new Date(invoice.dueDate), "yyyy-MM");
      if (monthFilter !== invoiceMonth) return false;
    }
    return true;
  });

  const pendingInvoices = invoices.filter((i: Invoice) => getInvoiceStatus(i) === "PENDING");
  const overdueInvoices = invoices.filter((i: Invoice) => getInvoiceStatus(i) === "OVERDUE");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-7xl animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          Tài Chính & Thanh Toán
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Quản lý hóa đơn, theo dõi thanh toán và xem lịch sử giao dịch
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đã thanh toán
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.paidCount} hóa đơn
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chờ thanh toán
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingCount} hóa đơn
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quá hạn
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(stats.totalOverdue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.overdueCount} hóa đơn
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng cộng
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalPaid + stats.totalPending)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {invoices.length} hóa đơn
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Overdue */}
      {overdueInvoices.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">
                {overdueInvoices.length} hóa đơn quá hạn cần thanh toán
              </CardTitle>
            </div>
            <CardDescription>
              Vui lòng thanh toán các hóa đơn quá hạn để tránh phát sinh phí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueInvoices.slice(0, 3).map((invoice: Invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Hạn: {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-destructive">{formatCurrency(invoice.amount)}</p>
                    <Button onClick={() => handlePayment(invoice)} size="sm">
                      Thanh toán
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="all" className="data-[state=active]:bg-background">
            Tất cả
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-background">
            Chờ thanh toán ({pendingInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="data-[state=active]:bg-background">
            Đã thanh toán
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Danh Sách Hóa Đơn
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tất cả tháng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả tháng</SelectItem>
                      {/* Generate last 12 months */}
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const value = format(date, "yyyy-MM");
                        return (
                          <SelectItem key={value} value={value}>
                            {format(date, "MM/yyyy", { locale: vi })}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                      <SelectItem value="PAID">Đã thanh toán</SelectItem>
                      <SelectItem value="OVERDUE">Quá hạn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Không có hóa đơn nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã hóa đơn</TableHead>
                      <TableHead>Hạn thanh toán</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice: Invoice) => {
                      const status = getInvoiceStatus(invoice);
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {status !== "PAID" && (
                                <Button
                                  onClick={() => handlePayment(invoice)}
                                  size="sm"
                                  className="gap-2"
                                >
                                  <CreditCard className="h-4 w-4" />
                                  Thanh toán
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDownloadInvoice(invoice.id)}
                                size="sm"
                                variant="outline"
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {/* Same table but filtered for pending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Hóa Đơn Chờ Thanh Toán
              </CardTitle>
              <CardDescription>
                {pendingInvoices.length} hóa đơn cần thanh toán
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Similar table implementation */}
              <p className="text-sm text-muted-foreground">
                Tính năng đang phát triển - sử dụng tab &quot;Tất cả&quot; để xem chi tiết
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Lịch Sử Thanh Toán
              </CardTitle>
              <CardDescription>
                Các hóa đơn đã thanh toán thành công
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tính năng đang phát triển - sử dụng tab &quot;Tất cả&quot; để xem chi tiết
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <PaymentDialog
        invoice={selectedInvoice}
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
      />
    </div>
  );
}
