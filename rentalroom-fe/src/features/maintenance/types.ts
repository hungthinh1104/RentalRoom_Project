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
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requestDate?: string;
  completedAt?: string;
  cost?: number;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  room?: {
    roomNumber: string;
    property?: {
      name: string;
      address: string;
    };
  };
  tenant?: {
    user?: {
      fullName: string;
      email: string;
    };
  };
}

export interface UpdateMaintenanceRequest {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: MaintenancePriority;
  assignedTo?: string;
  cost?: number;
}

export interface MaintenanceFeedback {
  rating: number;
  feedback?: string;
}