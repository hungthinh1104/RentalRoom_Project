import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOperationalExpenses,
  getOperationalExpense,
  createOperationalExpense,
  updateOperationalExpense,
  deleteOperationalExpense,
  type CreateOperationalExpenseDto,
  type UpdateOperationalExpenseDto,
  type FilterOperationalExpenseDto,
  type OperationalExpense,
} from "../api/operational-expenses-api";

export function useOperationalExpenses(filters?: FilterOperationalExpenseDto) {
  return useQuery({
    queryKey: ["operational-expenses", filters],
    queryFn: () => listOperationalExpenses(filters),
  });
}

export function useOperationalExpense(id: string) {
  return useQuery({
    queryKey: ["operational-expense", id],
    queryFn: () => getOperationalExpense(id),
    enabled: !!id,
  });
}

export function useCreateOperationalExpense() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateOperationalExpenseDto) =>
      createOperationalExpense(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operational-expenses"] });
    },
  });
}

export function useUpdateOperationalExpense() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateOperationalExpenseDto;
    }) => updateOperationalExpense(id, dto),
    onSuccess: (data: OperationalExpense) => {
      qc.invalidateQueries({ queryKey: ["operational-expenses"] });
      qc.invalidateQueries({ queryKey: ["operational-expense", data.id] });
    },
  });
}

export function useDeleteOperationalExpense() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOperationalExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operational-expenses"] });
    },
  });
}
