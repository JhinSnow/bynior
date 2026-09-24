import { google } from 'googleapis';
import { PrismaClient, OrganizerCategory } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const USERS_SPREADSHEET_ID = '1fzohCFyoic3kczsdl9sNOpauTK-EHMb0ZmuwHQyLtNc';
const CREDITS_SPREADSHEET_ID = '1-D2yrpC2mVOTv7ArpZw0cVXy-TOS-4YKo1aQfgGZIrc';

function getGoogleSheetsClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function seedDefaultCoupons() {
  console.log('🍔 Seeding Initial Event Food Coupons...');
  const defaultCoupons = [
    { name: 'ข้าวกะเพราไก่ไข่ดาว', storeName: 'ร้านป้าใจดี อาหารตามสั่ง', description: 'อาหารจานหลัก คูปองรับประทานอาหาร' },
    { name: 'เบอร์เกอร์เนื้อ / หมูคุโรบูตะ', storeName: 'Craft Burger Box', description: 'เมนูพิเศษประจำงาน Byenior' },
    { name: 'ชานมไข่มุกพ่นไฟ / ชาเขียวมัทฉะ', storeName: 'Cha-En Cafe', description: 'เครื่องดื่มเย็นสดชื่น 1 แก้ว' },
    { name: 'ไอศกรีมเจลาโต้ 2 ลูก', storeName: 'Sweet Dream Scoop', description: 'ของหวานปิดท้ายเลือกรสชาติได้' },
  ];

  for (const c of defaultCoupons) {
    const existing = await prisma.coupon.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.coupon.create({ data: c });
    }
  }
  console.log('✅ Coupons seeded.');
}

async function ingestUsers(sheets: any) {
  if (!sheets) {
    console.log('ℹ️ Google Service Account credentials not provided. Seeding Mock Attendees for testing...');
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
    console.log(`✅ Seeded ${mockUsers.length} mock users.`);
    return;
  }

  console.log('🔄 Fetching Users Sheet from Google Sheets API...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: USERS_SPREADSHEET_ID,
    range: 'A2:C',
  });

  const rows = res.data.values || [];
  const userData = [];

  for (const row of rows) {
    const studentId = String(row[0] || '').trim();
    const rawFullName = String(row[1] || '').trim();
    if (!studentId || !rawFullName) continue;

    const nameParts = rawFullName.split(/\s+/);
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : rawFullName;

    userData.push({ studentId, fullName: rawFullName, lastName });
  }

  console.log(`📥 Upserting ${userData.length} users to DB...`);
  for (const u of userData) {
    await prisma.user.upsert({
      where: { studentId: u.studentId },
      update: { fullName: u.fullName, lastName: u.lastName },
      create: u,
    });
  }
  console.log('✅ Users synced from Google Sheets.');
}

async function ingestCredits(sheets: any) {
  if (!sheets) {
    console.log('ℹ️ Seeding Mock Staff & Organizer Credits for End Credit Testing...');
    const mockCredits = [
      // กลุ่มการแสดงที่ 1
      { category: OrganizerCategory.PERFORMANCE_1, orderIndex: 1, fullName: 'นายพีรภัทร ชูเกียรติ' },
      { category: OrganizerCategory.PERFORMANCE_1, orderIndex: 2, fullName: 'นางสาวพิชชาภา ศิริผล' },
      { category: OrganizerCategory.PERFORMANCE_1, orderIndex: 3, fullName: 'นายธนาธิป สุวรรณ' },
      // กลุ่มการแสดงที่ 2
      { category: OrganizerCategory.PERFORMANCE_2, orderIndex: 1, fullName: 'นายจิรายุส รัตนวิชัย' },
      { category: OrganizerCategory.PERFORMANCE_2, orderIndex: 2, fullName: 'นางสาวชญานิษฐ์ วงศ์ไทย' },
      // กลุ่มการแสดงที่ 3
      { category: OrganizerCategory.PERFORMANCE_3, orderIndex: 1, fullName: 'นายกฤษดา บุญประเสริฐ' },
      { category: OrganizerCategory.PERFORMANCE_3, orderIndex: 2, fullName: 'นางสาวดวงกมล ปานแก้ว' },
      // ชุมนุม
      { category: OrganizerCategory.CLUB, orderIndex: 1, fullName: 'ชมรมดนตรีสากล คณะวิทยาศาสตร์' },
      { category: OrganizerCategory.CLUB, orderIndex: 2, fullName: 'ฝ่ายแสง สี เสียง และเวที' },
      // สโมสร
      { category: OrganizerCategory.SAMO, orderIndex: 1, fullName: 'นายกสโมสรนักศึกษาคณะวิทยาศาสตร์' },
      { category: OrganizerCategory.SAMO, orderIndex: 2, fullName: 'อุปนายกฝ่ายกิจกรรมสัมพันธ์' },
      { category: OrganizerCategory.SAMO, orderIndex: 3, fullName: 'ทีมงานฝ่ายประสานงานและสถานที่' },
      { category: OrganizerCategory.SAMO, orderIndex: 4, fullName: 'ทีมงานพัฒนาระบบเทคโนโลยีสารสนเทศ Bynior' },
    ];
    await prisma.organizerCredit.deleteMany();
    await prisma.organizerCredit.createMany({ data: mockCredits });
    console.log(`✅ Seeded ${mockCredits.length} mock organizer credits.`);
    return;
  }

  console.log('🔄 Fetching Credits Sheet from Google Sheets API...');
  const tabMapping: { tabName: string; category: OrganizerCategory }[] = [
    { tabName: 'กลุ่มการแสดงที่ 1', category: OrganizerCategory.PERFORMANCE_1 },
    { tabName: 'กลุ่มการแสดงที่ 2', category: OrganizerCategory.PERFORMANCE_2 },
    { tabName: 'กลุ่มการแสดงที่ 3', category: OrganizerCategory.PERFORMANCE_3 },
    { tabName: 'ชุมนุม', category: OrganizerCategory.CLUB },
    { tabName: 'สโมสร', category: OrganizerCategory.SAMO },
  ];

  await prisma.organizerCredit.deleteMany();
  const creditRecords = [];

  for (const item of tabMapping) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: CREDITS_SPREADSHEET_ID,
        range: `'${item.tabName}'!A2:C`,
      });
      const rows = res.data.values || [];
      for (const row of rows) {
        const orderIndex = parseInt(row[0], 10);
        const fullName = String(row[2] || '').trim();
        if (!isNaN(orderIndex) && fullName) {
          creditRecords.push({
            category: item.category,
            orderIndex,
            fullName,
          });
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ Skipped tab ${item.tabName}:`, err.message);
    }
  }

  if (creditRecords.length > 0) {
    await prisma.organizerCredit.createMany({ data: creditRecords });
  }
  console.log(`✅ Synced ${creditRecords.length} Credit records.`);
}

async function main() {
  const sheets = getGoogleSheetsClient();
  await seedDefaultCoupons();
  await ingestUsers(sheets);
  await ingestCredits(sheets);
  console.log('🎉 Seeding pipeline completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
