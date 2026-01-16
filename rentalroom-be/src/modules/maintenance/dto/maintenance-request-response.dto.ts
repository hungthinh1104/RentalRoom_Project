import { Exclude, Expose, Transform } from 'class-transformer';

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
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : null;
  })
  cost?: number;

  @Expose()
  rating?: number;

  @Expose()
  feedback?: string;

  @Expose()
  feedbackAt?: Date;
}
