-- Add admin user for testing
-- Password: password123 (bcrypt hash)
INSERT INTO "user" (id, email, "full_name", "phone_number", "password_hash", role, "email_verified", "created_at", "updated_at")
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
