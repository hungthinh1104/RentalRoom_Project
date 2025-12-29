import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../api/maintenance-api';
import type { NewMaintenanceRequest } from '../types';

export function useMaintenance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['maintenance', params],
    queryFn: () => maintenanceApi.getRequests(params),
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: NewMaintenanceRequest) => maintenanceApi.createRequest(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}