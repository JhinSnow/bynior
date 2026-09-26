const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetCheckins() {
  console.log('Resetting attendee check-ins and test activity data...');

  // 1. ล้างประวัติการสุ่มรางวัล Lucky Draw
  const deletedWinners = await prisma.luckyDrawWinner.deleteMany({});
  console.log(`- Cleared lucky draw winners: ${deletedWinners.count}`);

  // 2. ล้างประวัติการใช้คูปองอาหาร
  const deletedRedemptions = await prisma.couponRedemption.deleteMany({});
  console.log(`- Cleared coupon redemptions: ${deletedRedemptions.count}`);

  // 3. รีเซ็ตยอดคูปองที่ถูกใช้ไปใน Coupon table
  await prisma.coupon.updateMany({
    data: { currentRedeemed: 0 },
  });
  console.log('- Reset currentRedeemed counter on all coupons to 0');

  // 4. รีเซ็ตสถานะการเช็คอินของผู้เข้าร่วมงานทุกคน
  const updatedUsers = await prisma.user.updateMany({
    where: {
      role: 'PARTICIPANT',
    },
    data: {
      isCheckedIn: false,
      checkedInAt: null,
    },
  });
  console.log(`- Reset check-in status for ${updatedUsers.count} participants to NOT checked-in`);

  console.log('✅ All check-in history and test activities have been completely reset!');
}

resetCheckins()
  .catch((e) => {
    console.error('Error resetting check-ins:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
