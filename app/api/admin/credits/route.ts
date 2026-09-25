import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrganizerCategory } from '@prisma/client';

export async function GET() {
  try {
    // 1. ดึงรายชื่อผู้เข้าร่วมงานที่ Checked-in เรียงตามรหัสนักศึกษา
    const participants = await prisma.user.findMany({
      where: { isCheckedIn: true },
      orderBy: { studentId: 'asc' },
      select: {
        id: true,
        studentId: true,
        fullName: true,
      },
    });

    // 2. ดึงรายชื่อฝ่ายดำเนินงานและกิจกรรม
    const staffRecords = await prisma.organizerCredit.findMany({
      orderBy: [
        { category: 'asc' },
        { orderIndex: 'asc' },
      ],
    });

    // รวบกลุ่มผู้ร่วมจัด (PERFORMANCE_1, 2, 3) เข้าด้วยกัน
    const coOrganizers = staffRecords.filter(
      (s) =>
        s.category === OrganizerCategory.PERFORMANCE_1 ||
        s.category === OrganizerCategory.PERFORMANCE_2 ||
        s.category === OrganizerCategory.PERFORMANCE_3
    );

    const clubMembers = staffRecords.filter(
      (s) => s.category === OrganizerCategory.CLUB
    );

    const samoMembers = staffRecords.filter(
      (s) => s.category === OrganizerCategory.SAMO
    );

    const staffGroups = [
      {
        category: 'CO_ORGANIZERS',
        label: 'ผู้ร่วมจัด',
        members: coOrganizers,
      },
      {
        category: 'CLUB',
        label: 'ชุมนุม',
        members: clubMembers,
      },
      {
        category: 'SAMO',
        label: 'สโมสร',
        members: samoMembers,
      },
    ];

    return NextResponse.json({
      participants,
      staffGroups,
      totalAttendees: participants.length,
      totalStaff: staffRecords.length,
    });
  } catch (error) {
    console.error('Fetch credits error:', error);
    return NextResponse.json({ error: 'Failed to fetch credit roll data' }, { status: 500 });
  }
}
