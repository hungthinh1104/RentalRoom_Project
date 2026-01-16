import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LandlordResponseDto {
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
  citizenId?: string;

  @Expose()
  bankAccount?: string;

  @Expose()
  bankName?: string;

  @Expose()
  address?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
