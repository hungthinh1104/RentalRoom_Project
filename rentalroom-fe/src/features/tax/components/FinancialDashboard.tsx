'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taxService } from '../api/tax-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/tax-helpers';
import { Income, Expense } from '@/types/tax';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Receipt, DollarSign, Calendar, Plus, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialStats {
    monthlyData: { name: string; income: number; expense: number; profit: number }[];
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    incomeGrowth: number;
    expenseGrowth: number;
    recentTransactions: TransactionItem[];
}

interface TransactionItem {
    type: 'income' | 'expense';
    date: string;
    amount: number | string;
    note?: string;
}

export function FinancialDashboard() {
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [monthRange, setMonthRange] = useState<'all' | '3' | '6'>('all');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch Income Data for current year
    const { data: incomeData, isLoading: isLoadingIncome, error: incomeError } = useQuery({
        queryKey: ['tax-income-list', year],
        queryFn: () => taxService.getIncomeList(year),
    });

    // Fetch Income Data for previous year (for YoY comparison)
    const { data: prevYearIncomeData, error: prevYearIncomeError } = useQuery({
        queryKey: ['tax-income-list', year - 1],
        queryFn: () => taxService.getIncomeList(year - 1),
        enabled: year > 2020, // Only fetch if reasonable year
    });

    // Fetch Expense Data
    const { data: expenseData, isLoading: isLoadingExpense, error: expenseError } = useQuery({
        queryKey: ['tax-expense-list', year],
        queryFn: () => taxService.getExpenses(year),
    });

    // Fetch Expense Data for previous year
    const { data: prevYearExpenseData, error: prevYearExpenseError } = useQuery({
        queryKey: ['tax-expense-list', year - 1],
        queryFn: () => taxService.getExpenses(year - 1),
        enabled: year > 2020,
    });

    // Process Data for Chart & Summary
    const stats = useMemo<FinancialStats>(() => {
        const incomes = Array.isArray(incomeData) ? incomeData : [];
        const expenses = Array.isArray(expenseData) ? expenseData : [];
        const prevIncomes = Array.isArray(prevYearIncomeData) ? prevYearIncomeData : [];
        const prevExpenses = Array.isArray(prevYearExpenseData) ? prevYearExpenseData : [];

        // Initialize months
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            name: `T${i + 1}`,
            income: 0,
            expense: 0,
            profit: 0,
        }));

        let totalIncome = 0;
        let totalExpense = 0;
        let prevYearTotalIncome = 0;
        let prevYearTotalExpense = 0;

        // Aggregate Income
        incomes.forEach((item: Income) => {
            const date = new Date(item.receivedAt);
            if (date.getFullYear() === year) {
                const month = date.getMonth();
                monthlyData[month].income += Number(item.amount);
                totalIncome += Number(item.amount);
            }
        });

        // Aggregate Expense
        expenses.forEach((item: Expense) => {
            const date = new Date(item.paidAt);
            if (date.getFullYear() === year) {
                const month = date.getMonth();
                monthlyData[month].expense += Number(item.amount);
                totalExpense += Number(item.amount);
            }
        });

        // Calculate previous year totals
        prevIncomes.forEach((item: Income) => {
            prevYearTotalIncome += Number(item.amount);
        });
        prevExpenses.forEach((item: Expense) => {
            prevYearTotalExpense += Number(item.amount);
        });

        // Calculate Profit per month
        monthlyData.forEach(m => m.profit = m.income - m.expense);

        // Filter by month range
        const filteredMonthlyData = monthRange === 'all'
            ? monthlyData
            : monthRange === '3'
                ? monthlyData.slice(new Date().getMonth() - 2, new Date().getMonth() + 1)
                : monthlyData.slice(new Date().getMonth() - 5, new Date().getMonth() + 1);

        // Calculate YoY growth
        const incomeGrowth = prevYearTotalIncome > 0
            ? ((totalIncome - prevYearTotalIncome) / prevYearTotalIncome) * 100
            : 0;
        const expenseGrowth = prevYearTotalExpense > 0
            ? ((totalExpense - prevYearTotalExpense) / prevYearTotalExpense) * 100
            : 0;

        const recentTransactions = [
            ...incomes.map((i: Income) => ({ ...i, type: 'income' as const, date: i.receivedAt })),
            ...expenses.map((e: Expense) => ({ ...e, type: 'expense' as const, date: e.paidAt }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

        return {
            monthlyData: filteredMonthlyData,
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            incomeGrowth,
            expenseGrowth,
            recentTransactions
        };
    }, [incomeData, expenseData, prevYearIncomeData, prevYearExpenseData, year, monthRange]);

    if (isLoadingIncome || isLoadingExpense) {
        return <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
            </div>
            <Skeleton className="h-[400px]" />
        </div>;
    }

    // Show error if queries failed
    if (incomeError || expenseError) {
        return <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h3 className="text-destructive font-bold mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-muted-foreground text-sm">
                {incomeError?.message || expenseError?.message || 'Không thể tải dữ liệu tài chính'}
            </p>
        </div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight">Tổng quan tài chính</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select value={monthRange} onValueChange={(v: 'all' | '3' | '6') => setMonthRange(v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Cả năm</SelectItem>
                            <SelectItem value="3">3 tháng gần đây</SelectItem>
                            <SelectItem value="6">6 tháng gần đây</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Năm" />
                        </SelectTrigger>
                        <SelectContent>
                            {[2026, 2025, 2024, 2023].map((y) => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Income Card */}
                <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-info/10">
                                <Wallet className="w-4 h-4 text-info" />
                            </div>
                            Tổng Doanh Thu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalIncome)}</div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            {stats.incomeGrowth >= 0 ? (
                                <><TrendingUp className="w-3 h-3 text-success" /> <span className="text-success">+{stats.incomeGrowth.toFixed(1)}%</span></>
                            ) : (
                                <><TrendingDown className="w-3 h-3 text-destructive" /> <span className="text-destructive">{stats.incomeGrowth.toFixed(1)}%</span></>
                            )} so với năm trước
                        </p>
                    </CardContent>
                </Card>

                {/* Expense Card */}
                <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-destructive/10">
                                <Receipt className="w-4 h-4 text-destructive" />
                            </div>
                            Tổng Chi Phí
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalExpense)}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats.totalIncome ? ((stats.totalExpense / stats.totalIncome) * 100).toFixed(1) : 0}% của doanh thu
                        </p>
                    </CardContent>
                </Card>

                {/* Profit Card */}
                <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-success/10">
                                <DollarSign className="w-4 h-4 text-success" />
                            </div>
                            Lợi Nhuận Ròng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.netProfit)}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Tỷ suất: {stats.totalIncome ? ((stats.netProfit / stats.totalIncome) * 100).toFixed(1) : 0}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Main Flow Chart */}
                <Card className="lg:col-span-2 shadow-md">
                    <CardHeader>
                        <CardTitle>Biểu đồ dòng tiền năm {year}</CardTitle>
                        <CardDescription>So sánh thu chi theo tháng</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] md:h-[350px] p-4 md:p-6">
                        {mounted ? (
                            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--info)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--info)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value / 1000000}M`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value) || 0)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        name="Thu nhập"
                                        stroke="var(--info)"
                                        fillOpacity={1}
                                        fill="url(#colorIncome)"
                                        strokeWidth={3}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Chi phí"
                                        stroke="var(--destructive)"
                                        fillOpacity={1}
                                        fill="url(#colorExpense)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <Skeleton className="w-full h-full rounded-lg" />
                        )}
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="shadow-md flex flex-col">
                    <CardHeader>
                        <CardTitle>Giao dịch gần đây</CardTitle>
                        <CardDescription>5 hoạt động mới nhất</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pr-2">
                        <div className="space-y-4">
                            {stats.recentTransactions.length > 0 ? (
                                stats.recentTransactions.map((t: TransactionItem, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`p-2 rounded-full flex-shrink-0 ${t.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                                {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-1">{t.note || (t.type === 'income' ? 'Khoản thu' : 'Khoản chi')}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(t.date).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold flex-shrink-0 ml-2 ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Receipt className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">Chưa có giao dịch</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Bắt đầu ghi nhận thu chi để theo dõi tài chính</p>
                                    <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/landlord/income'}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Ghi nhận thu
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
