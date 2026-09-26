import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const storeName = 'สโมสรอ้วนตุ๊ต๊ะ';
  const items = [
    { name: 'สปาเกตตี้ซอสมะเขือเทศ', storeName, description: 'เมนูอาหารประจำงาน Byenior 2026' },
    { name: 'ข้าวเหนียวไก่ทอด', storeName, description: 'เมนูอาหารประจำงาน Byenior 2026' },
    { name: 'ไก่ต้มน้ำปลา', storeName, description: 'เมนูอาหารประจำงาน Byenior 2026' },
    { name: 'ขนมปังปิ้ง 1', storeName, description: 'ของหวานแสนอร่อย (ใบที่ 1/2)' },
    { name: 'ขนมปังปิ้ง 2', storeName, description: 'ของหวานแสนอร่อย (ใบที่ 2/2)' },
    { name: 'น้ำแดงมะนาวโซดา 1', storeName, description: 'เครื่องดื่มเย็นสดชื่น (แก้วที่ 1/2)' },
    { name: 'น้ำแดงมะนาวโซดา 2', storeName, description: 'เครื่องดื่มเย็นสดชื่น (แก้วที่ 2/2)' },
    { name: 'แตงโม 1', storeName, description: 'ผลไม้หวานฉ่ำ (จานที่ 1/2)' },
    { name: 'แตงโม 2', storeName, description: 'ผลไม้หวานฉ่ำ (จานที่ 2/2)' },
  ];

  console.log('Clearing old coupons and redemptions...');
  await prisma.couponRedemption.deleteMany({});
  await prisma.coupon.deleteMany({});

  console.log('Inserting new requested food coupons...');
  for (const item of items) {
    await prisma.coupon.create({ data: item });
  }

  console.log('✅ Successfully seeded new food coupons!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
