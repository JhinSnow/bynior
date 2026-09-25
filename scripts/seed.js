const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🍔 Seeding Initial Coupons to Supabase...');
  const coupons = [
    { name: 'ข้าวกะเพราไก่ไข่ดาว', storeName: 'ร้านป้าใจดี อาหารตามสั่ง', description: 'อาหารจานหลัก คูปองรับประทานอาหาร' },
    { name: 'เบอร์เกอร์เนื้อ / หมูคุโรบูตะ', storeName: 'Craft Burger Box', description: 'เมนูพิเศษประจำงาน Byenior' },
    { name: 'ชานมไข่มุกพ่นไฟ / ชาเขียวมัทฉะ', storeName: 'Cha-En Cafe', description: 'เครื่องดื่มเย็นสดชื่น 1 แก้ว' },
    { name: 'ไอศกรีมเจลาโต้ 2 ลูก', storeName: 'Sweet Dream Scoop', description: 'ของหวานปิดท้ายเลือกรสชาติได้' },
  ];

  for (const c of coupons) {
    const existing = await prisma.coupon.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.coupon.create({ data: c });
    }
  }
  console.log('✅ Coupons seeded successfully.');

  console.log('👥 Seeding Attendees to Supabase...');
  const mockUsers = [
    { studentId: '6610210001', fullName: 'สมชาย ใจดี', lastName: 'ใจดี' },
    { studentId: '6610210002', fullName: 'สมหญิง รักเรียน', lastName: 'รักเรียน' },
    { studentId: '6610210003', fullName: 'กิตติพงษ์ มั่นคง', lastName: 'มั่นคง' },
    { studentId: '6610210004', fullName: 'วริศรา ศรีสวัสดิ์', lastName: 'ศรีสวัสดิ์' },
    { studentId: '6610210005', fullName: 'ธนกฤต วิเศษสุข', lastName: 'วิเศษสุข' },
    { studentId: '6610210006', fullName: 'ชลธิชา เจริญพงศ์', lastName: 'เจริญพงศ์' },
    { studentId: '6610210007', fullName: 'ภานุพงศ์ บุญรักษา', lastName: 'บุญรักษา' },
    { studentId: '6610210008', fullName: 'ณัฐชา เลิศรัตน์', lastName: 'เลิศรัตน์' },
  ];

  for (const u of mockUsers) {
    await prisma.user.upsert({
      where: { studentId: u.studentId },
      update: { fullName: u.fullName, lastName: u.lastName },
      create: u,
    });
  }
  console.log(`✅ Seeded ${mockUsers.length} attendees.`);

  console.log('🎬 Seeding Organizer Credits to Supabase...');
  const mockCredits = [
    // กลุ่มการแสดงที่ 1
    { category: 'PERFORMANCE_1', orderIndex: 1, fullName: 'นายพีรภัทร ชูเกียรติ' },
    { category: 'PERFORMANCE_1', orderIndex: 2, fullName: 'นางสาวพิชชาภา ศิริผล' },
    { category: 'PERFORMANCE_1', orderIndex: 3, fullName: 'นายธนาธิป สุวรรณ' },
    // กลุ่มการแสดงที่ 2
    { category: 'PERFORMANCE_2', orderIndex: 1, fullName: 'นายจิรายุส รัตนวิชัย' },
    { category: 'PERFORMANCE_2', orderIndex: 2, fullName: 'นางสาวชญานิษฐ์ วงศ์ไทย' },
    // กลุ่มการแสดงที่ 3
    { category: 'PERFORMANCE_3', orderIndex: 1, fullName: 'นายกฤษดา บุญประเสริฐ' },
    { category: 'PERFORMANCE_3', orderIndex: 2, fullName: 'นางสาวดวงกมล ปานแก้ว' },
    // ชุมนุม
    { category: 'CLUB', orderIndex: 1, fullName: 'ชมรมดนตรีสากล คณะวิทยาศาสตร์' },
    { category: 'CLUB', orderIndex: 2, fullName: 'ฝ่ายแสง สี เสียง และเวที' },
    // สโมสร
    { category: 'SAMO', orderIndex: 1, fullName: 'นายกสโมสรนักศึกษาคณะวิทยาศาสตร์' },
    { category: 'SAMO', orderIndex: 2, fullName: 'อุปนายกฝ่ายกิจกรรมสัมพันธ์' },
    { category: 'SAMO', orderIndex: 3, fullName: 'ทีมงานฝ่ายประสานงานและสถานที่' },
    { category: 'SAMO', orderIndex: 4, fullName: 'ทีมงานพัฒนาระบบเทคโนโลยีสารสนเทศ Bynior' },
  ];

  await prisma.organizerCredit.deleteMany();
  await prisma.organizerCredit.createMany({ data: mockCredits });
  console.log(`✅ Seeded ${mockCredits.length} staff & organizer credits.`);
  console.log('🎉 SUPABASE DATABASE IS FULLY READY!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
