"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Search,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  useOperationalExpenses,
  useCreateOperationalExpense,
  useUpdateOperationalExpense,
  useDeleteOperationalExpense,
} from "../hooks/use-operational-expenses";
import type { OperationalExpense } from "../api/operational-expenses-api";

const EXPENSE_CATEGORIES = [
  { value: "MAINTENANCE", label: "Bảo trì" },
  { value: "UTILITIES", label: "Tiện ích" },
  { value: "PROPERTY_TAX", label: "Thuế bất động sản" },
  { value: "INSURANCE", label: "Bảo hiểm" },
  { value: "CLEANING", label: "Vệ sinh" },
  { value: "REPAIRS", label: "Sửa chữa" },
  { value: "OTHER", label: "Khác" },
];

export default function LandlordOperationalExpensesClient() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<OperationalExpense | null>(null);
  const [formData, setFormData] = useState({
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    category: "MAINTENANCE",
    description: "",
  });

  const { data: expensesData, isLoading } = useOperationalExpenses();
  const expenses: OperationalExpense[] = useMemo(() => {
    let filtered: OperationalExpense[] = expensesData || [];

    if (categoryFilter) {
      filtered = filtered.filter((e: OperationalExpense) => e.category === categoryFilter);
    }

    if (search) {
      filtered = filtered.filter(
        (e: OperationalExpense) =>
          e.description?.toLowerCase().includes(search.toLowerCase()) ||
          e.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expensesData, categoryFilter, search]);

  const createExpense = useCreateOperationalExpense();
  const updateExpense = useUpdateOperationalExpense();
  const deleteExpense = useDeleteOperationalExpense();

  const handleOpenCreate = () => {
    setSelectedExpense(null);
    setFormData({
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      category: "MAINTENANCE",
      description: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (expense: OperationalExpense) => {
    setSelectedExpense(expense);
    setFormData({
      amount: expense.amount,
      date: expense.date.split("T")[0], // Extract date part
      category: expense.category,
      description: expense.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Nhập số tiền hợp lệ");
      return;
    }

    if (!formData.date) {
      toast.error("Chọn ngày");
      return;
    }

    if (!formData.category) {
      toast.error("Chọn loại chi phí");
      return;
    }

    if (selectedExpense) {
      // Update mode
      updateExpense.mutate(
        {
          id: selectedExpense.id,
          dto: {
            amount: formData.amount,
            date: formData.date,
            category: formData.category,
            description: formData.description || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Cập nhật chi phí thành công");
            setDialogOpen(false);
          },
          onError: () => toast.error("Không thể cập nhật chi phí"),
        }
      );
    } else {
      // Create mode
      createExpense.mutate(
        {
          amount: formData.amount,
          date: formData.date,
          category: formData.category,
          description: formData.description || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Thêm chi phí thành công");
            setDialogOpen(false);
          },
          onError: () => toast.error("Không thể thêm chi phí"),
        }
      );
    }
  };

  const handleDelete = (expense: OperationalExpense) => {
    if (confirm("Bạn chắc chắn muốn xóa chi phí này?")) {
      deleteExpense.mutate(expense.id, {
        onSuccess: () => toast.success("Đã xóa chi phí"),
        onError: () => toast.error("Không thể xóa chi phí"),
      });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter(undefined);
  };

  const hasFilters = search || categoryFilter;
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    const now = new Date();
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Chi Phí Vận Hành
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý chi phí vận hành bất động sản ({expenses.length} chi phí)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm Chi Phí
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedExpense ? "Cập Nhật Chi Phí" : "Thêm Chi Phí Mới"}
              </DialogTitle>
              <DialogDescription>
                {selectedExpense
                  ? "Cập nhật thông tin chi phí vận hành"
                  : "Ghi lại chi phí vận hành cho bất động sản"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số tiền (VND)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Loại Chi Phí</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.filter((cat) => cat.value.trim() !== "").map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (tuỳ chọn)</Label>
                <Textarea
                  id="description"
                  placeholder="Chi tiết về chi phí..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={createExpense.isPending || updateExpense.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createExpense.isPending || updateExpense.isPending}
              >
                {createExpense.isPending || updateExpense.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : selectedExpense ? (
                  "Cập nhật"
                ) : (
                  "Thêm"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor:
                    "color-mix(in oklab, var(--primary) 10%, transparent)",
                  color: "var(--primary)",
                }}
              >
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng Chi Phí</p>
                <p className="text-2xl font-bold">
                  {totalAmount.toLocaleString("vi-VN")} VND
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor:
                    "color-mix(in oklab, var(--warning) 10%, transparent)",
                  color: "var(--warning)",
                }}
              >
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tháng Này</p>
                <p className="text-2xl font-bold">{monthlyExpenses} chi phí</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo ID hoặc mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter || "ALL"}
              onValueChange={(v) => setCategoryFilter(v === "ALL" ? undefined : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {EXPENSE_CATEGORIES.filter((cat) => cat.value.trim() !== "").map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Chi Phí</CardTitle>
          <CardDescription>
            Xem và quản lý tất cả chi phí vận hành
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Mô Tả</TableHead>
                  <TableHead className="text-right">Số Tiền</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có chi phí nào
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm">
                        {format(new Date(expense.date), "dd/MM/yyyy", {
                          locale: vi,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {EXPENSE_CATEGORIES.find(
                            (c) => c.value === expense.category
                          )?.label || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {expense.description || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {expense.amount.toLocaleString("vi-VN")} VND
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(expense)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(expense)}
                              className="gap-2 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
