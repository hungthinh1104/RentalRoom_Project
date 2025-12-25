import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../entities';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  fullName: string;

  @Expose()
  email: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  role: UserRole;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // passwordHash excluded by @Exclude() decorator on class
}
