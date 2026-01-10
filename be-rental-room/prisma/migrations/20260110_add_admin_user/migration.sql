-- Add admin user for testing
-- Password hash: password123 (bcrypt)
INSERT INTO "User" (id, email, "fullName", "phoneNumber", "passwordHash", role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@rentalroom.vn',
  'Admin Hệ Thống',
  '0900000000',
  '$2b$10$YIjlrBn2fh4Qj5QVjV5W2O5E5e5e5e5e5e5e5e5e5e5e5e5e5e5e',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
