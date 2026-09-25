const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testStudents = [
  {
    studentId: '6600000001',
    fullName: 'ทดสอบ ผู้เข้าร่วมหนึ่ง',
    lastName: 'ผู้เข้าร่วมหนึ่ง',
    role: 'PARTICIPANT',
    isCheckedIn: false,
  },
  {
    studentId: '6600000002',
    fullName: 'ทดสอบ ผู้เข้าร่วมสอง',
    lastName: 'ผู้เข้าร่วมสอง',
    role: 'PARTICIPANT',
    isCheckedIn: true,
    checkedInAt: new Date(),
  },
  {
    studentId: '6600000003',
    fullName: 'ทดสอบ ผู้เข้าร่วมสาม',
    lastName: 'ผู้เข้าร่วมสาม',
    role: 'PARTICIPANT',
    isCheckedIn: true,
    checkedInAt: new Date(),
  },
];

async function main() {
  console.log('--- Creating Test Students ---');
  for (const s of testStudents) {
    const user = await prisma.user.upsert({
      where: { studentId: s.studentId },
      update: {
        fullName: s.fullName,
        lastName: s.lastName,
        isCheckedIn: s.isCheckedIn,
        checkedInAt: s.checkedInAt,
      },
      create: s,
    });
    console.log(`Created/Updated: ${user.studentId} - ${user.fullName} (Check-in: ${user.isCheckedIn})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
