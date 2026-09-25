const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Resetting test event data in Supabase...');

  // 1. ลบประวัติการสแกนคูปองทั้งหมด
  const deletedRedemptions = await prisma.couponRedemption.deleteMany({});
  console.log(`✅ Deleted ${deletedRedemptions.count} coupon redemption records.`);

  // 2. รีเซ็ตยอดสแกนคูปองกลับเป็น 0
  await prisma.coupon.updateMany({
    data: {
      currentRedeemed: 0,
    },
  });
  console.log('✅ Reset coupon redeemed counters to 0.');

  // 3. ลบประวัติการสุ่มรางวัล Lucky Draw
  const deletedWinners = await prisma.luckyDrawWinner.deleteMany({});
  console.log(`✅ Deleted ${deletedWinners.count} lucky draw winner records.`);

  // 4. รีเซ็ตสถานะการเช็คชื่อของผู้เข้าร่วมงานทุกคนให้กลับเป็นยังไม่ได้เช็คชื่อ
  const resetUsers = await prisma.user.updateMany({
    data: {
      isCheckedIn: false,
      checkedInAt: null,
    },
  });
  console.log(`✅ Reset check-in status for all ${resetUsers.count} attendees.`);

  console.log('🎉 EVENT DATABASE IS FULLY CLEAN & READY FOR REAL EVENT!');
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
