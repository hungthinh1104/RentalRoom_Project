import api from "@/lib/api/client";

export type ExpenseCategory =
  | "MAINTENANCE"
  | "UTILITIES"
  | "PROPERTY_TAX"
  | "INSURANCE"
  | "CLEANING"
  | "REPAIRS"
  | "OTHER";

export interface OperationalExpense {
  id: string;
  amount: number;
  date: string;
  category: string;
  description?: string | null;
  propertyId?: string | null;
  landlordId: string;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
    address?: string | null;
  } | null;
}

export interface CreateOperationalExpenseDto {
  amount: number;
  date: string;
  category: string;
  description?: string;
  propertyId?: string;
}

export interface UpdateOperationalExpenseDto {
  amount?: number;
  date?: string;
  category?: string;
  description?: string;
  propertyId?: string;
}

export interface FilterOperationalExpenseDto {
  startDate?: string;
  endDate?: string;
  category?: string;
  propertyId?: string;
}

export interface OperationalExpenseResponse {
  data: OperationalExpense[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listOperationalExpenses(
  filters?: FilterOperationalExpenseDto
): Promise<OperationalExpense[]> {
  const { data } = await api.get<OperationalExpenseResponse>(
    "/operational-expenses",
    { params: filters as Record<string, unknown> }
  );
  return data.data;
}

export async function getOperationalExpense(
  id: string
): Promise<OperationalExpense> {
  const { data } = await api.get<OperationalExpense>(
    `/operational-expenses/${id}`
  );
  return data;
}

export async function createOperationalExpense(
  dto: CreateOperationalExpenseDto
): Promise<OperationalExpense> {
  const { data } = await api.post<OperationalExpense>(
    "/operational-expenses",
    dto
  );
  return data;
}

export async function updateOperationalExpense(
  id: string,
  dto: UpdateOperationalExpenseDto
): Promise<OperationalExpense> {
  const { data } = await api.patch<OperationalExpense>(
    `/operational-expenses/${id}`,
    dto
  );
  return data;
}

export async function deleteOperationalExpense(id: string): Promise<void> {
  await api.delete(`/operational-expenses/${id}`);
}
