export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'APPLIANCE' | 'OTHER';

export interface NewMaintenanceRequest {
  roomId: string;
  tenantId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority?: MaintenancePriority;
  requestDate?: string; // ISO date string
  assignedTo?: string;
  cost?: number;
}

export interface MaintenanceRequestSummary {
  id: string;
  roomId: string;
  tenantId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: string;
  requestDate?: string;
  createdAt: string;
  updatedAt: string;
}