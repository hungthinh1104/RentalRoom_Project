-- Add admin user for testing
-- Password: password123 (bcrypt hash)
INSERT INTO "User" (id, email, "fullName", "phoneNumber", "passwordHash", role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@rentalroom.vn',
  'Admin Hệ Thống',
  '0900000000',
  '$2b$10$mKD7NhKPSWzEkPfFzXLsw.dl/1UYAN2c/bXILEGB.gtk6S5MYPRwq',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
