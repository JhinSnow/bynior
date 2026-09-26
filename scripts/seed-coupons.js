const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const storeName = 'สโมสรอ้วนตุ๊ต๊ะ';

  // 6 คูปองเดี่ยว (1 ชนิด = 1 ใบ) โดยกำหนด maxUsesPerUser ตามจำนวนรอบ
  const coupons = [
    {
      name: 'สปาเกตตี้ซอสมะเขือเทศ',
      storeName,
      description: 'เมนูอาหารจานหลัก Byenior 2026',
      maxUsesPerUser: 1,
    },
    {
      name: 'ข้าวเหนียวไก่ทอด',
      storeName,
      description: 'เมนูอาหารจานหลัก Byenior 2026',
      maxUsesPerUser: 1,
    },
    {
      name: 'ไก่ต้มน้ำปลา',
      storeName,
      description: 'เมนูอาหารจานหลัก Byenior 2026',
      maxUsesPerUser: 1,
    },
    {
      name: 'ขนมปังปิ้ง',
      storeName,
      description: 'ของหวานแสนอร่อย (ใช้สิทธิ์ได้ 2 รอบ)',
      maxUsesPerUser: 2,
    },
    {
      name: 'น้ำแดงมะนาวโซดา',
      storeName,
      description: 'เครื่องดื่มเย็นสดชื่น (ใช้สิทธิ์ได้ 2 รอบ)',
      maxUsesPerUser: 2,
    },
    {
      name: 'แตงโม',
      storeName,
      description: 'ผลไม้หวานฉ่ำ (ใช้สิทธิ์ได้ 2 รอบ)',
      maxUsesPerUser: 2,
    },
  ];

  console.log('Clearing old coupons and redemptions...');
  await prisma.couponRedemption.deleteMany({});
  await prisma.coupon.deleteMany({});

  console.log('Seeding 6 single food coupons with customizable rounds...');
  for (const item of coupons) {
    await prisma.coupon.create({ data: item });
  }

  console.log('✅ Successfully seeded multi-round coupons!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
