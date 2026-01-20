export type DisputeStatus = 'OPEN' | 'APPROVED' | 'REJECTED' | 'PARTIAL' | 'ESCALATED';
export type DisputeResolution = 'APPROVED' | 'REJECTED' | 'PARTIAL';
export type EvidenceType = 'CLAIMANT' | 'RESPONDENT';

export interface DisputeEntity {
  id: string;
  contractId: string;
  claimantId: string;
  claimantRole: 'TENANT' | 'LANDLORD';
  claimAmount: number;
  description: string;
  status: DisputeStatus;
  approvedAmount?: number;
  deadline: Date;
  evidence: DisputeEvidenceEntity[];
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionReason?: string;
  escalatedAt?: Date;
  escalatedBy?: string;
  escalationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeEvidenceEntity {
  id: string;
  disputeId: string;
  url: string;
  submittedBy: string;
  type: EvidenceType;
  order?: number;
  createdAt: Date;
}
