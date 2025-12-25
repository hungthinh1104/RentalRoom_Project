import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MaintenanceRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  roomId: string;

  @Expose()
  tenantId: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  priority: string;

  @Expose()
  status: string;

  @Expose()
  requestDate: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  completedAt?: Date;

  @Expose()
  cost?: number;
}
