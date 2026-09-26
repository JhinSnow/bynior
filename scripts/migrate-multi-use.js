const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  console.log('Running migration...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "CouponRedemption" DROP CONSTRAINT IF EXISTS "unique_user_coupon_redemption";`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CouponRedemption_userId_couponId_idx" ON "CouponRedemption"("userId", "couponId");`);
  console.log('Migration completed successfully!');
}

run()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
