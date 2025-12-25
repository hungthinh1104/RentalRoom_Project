import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RentalApplicationResponseDto {
  @Expose()
  id: string;

  @Expose()
  roomId: string;

  @Expose()
  tenantId: string;

  @Expose()
  landlordId: string;

  @Expose()
  applicationDate: Date;

  @Expose()
  status: string;

  @Expose()
  message?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  reviewedAt?: Date;

  // Extra hydrated fields for UI convenience
  @Expose()
  tenantName?: string;

  @Expose()
  tenantEmail?: string;

  @Expose()
  tenantPhone?: string | null;

  @Expose()
  roomNumber?: string;

  @Expose()
  roomAddress?: string;
}
