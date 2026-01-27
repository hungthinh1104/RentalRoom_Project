import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDispute,
  listDisputes,
  resolveDispute,
  submitCounterEvidence,
  getDispute,
  type CreateDisputeDto,
  type DisputeResolution,
  type DisputeStatus,
} from "../api/disputes-api";

export function useDisputes(params?: { status?: DisputeStatus }) {
  return useQuery({
    queryKey: ["disputes", params?.status],
    queryFn: () => listDisputes(params),
  });
}

export function useDispute(id: string | undefined) {
  return useQuery({
    queryKey: ["dispute", id],
    queryFn: () => (id ? getDispute(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDisputeDto) => createDispute(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution, approvedAmount, reason }: { id: string; resolution: DisputeResolution; approvedAmount: number; reason: string }) =>
      resolveDispute(id, { resolution, approvedAmount, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

export function useCounterEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, evidenceUrls }: { id: string; evidenceUrls: string[] }) =>
      submitCounterEvidence(id, evidenceUrls),
    onSuccess: (_data: unknown, variables: { id: string; evidenceUrls: string[] }) => {
      qc.invalidateQueries({ queryKey: ["dispute", variables.id] });
      qc.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}
