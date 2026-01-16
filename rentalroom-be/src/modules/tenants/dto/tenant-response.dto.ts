import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TenantResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  fullName: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  email: string;

  @Expose()
  dateOfBirth?: Date;

  @Expose()
  citizenId?: string;

  @Expose()
  emergencyContact?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
