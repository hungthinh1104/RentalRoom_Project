import api from "@/lib/api/client";

export type DisputeStatus = "OPEN" | "APPROVED" | "REJECTED" | "PARTIAL" | "ESCALATED";
export type DisputeResolution = "APPROVED" | "REJECTED" | "PARTIAL";

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  url: string;
  submittedBy: string;
  type: "CLAIMANT" | "RESPONDENT";
  order?: number;
  createdAt: string;
}

export interface DisputeContractLite {
  id: string;
  room?: { name?: string | null; propertyId?: string | null } | null;
  tenantId?: string | null;
  landlordId?: string | null;
}

export interface Dispute {
  id: string;
  contractId: string;
  claimantId: string;
  claimantRole: "TENANT" | "LANDLORD";
  claimAmount: number;
  description: string;
  status: DisputeStatus;
  approvedAmount?: number | null;
  deadline: string;
  evidence: DisputeEvidence[];
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionReason?: string | null;
  escalatedAt?: string | null;
  escalatedBy?: string | null;
  escalationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  contract?: DisputeContractLite | null;
}

export interface CreateDisputeDto {
  contractId: string;
  claimantRole: "TENANT" | "LANDLORD";
  claimAmount: number;
  description: string;
  evidenceUrls: string[];
}

export async function listDisputes(params?: { status?: DisputeStatus }) {
  const { data } = await api.get<Dispute[]>("/disputes", { params });
  return data;
}

export async function getDispute(id: string) {
  const { data } = await api.get<Dispute>(`/disputes/${id}`);
  return data;
}

export async function createDispute(dto: CreateDisputeDto) {
  const { data } = await api.post<Dispute>("/disputes", dto);
  return data;
}

export async function submitCounterEvidence(disputeId: string, evidenceUrls: string[]) {
  const { data } = await api.patch(`/disputes/${disputeId}/counter-evidence`, { evidenceUrls });
  return data;
}

export async function resolveDispute(disputeId: string, payload: { resolution: DisputeResolution; approvedAmount: number; reason: string }) {
  const { data } = await api.patch(`/disputes/${disputeId}/resolve`, payload);
  return data;
}

export async function escalateDispute(disputeId: string, reason: string) {
  const { data } = await api.patch(`/disputes/${disputeId}/escalate`, { reason });
  return data;
}
