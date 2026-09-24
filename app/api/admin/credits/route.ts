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

    // 2. ดึงรายชื่อฝ่ายดำเนินงานและกิจกรรมทั้ง 5 กลุ่ม
    const staffRecords = await prisma.organizerCredit.findMany({
      orderBy: [
        { category: 'asc' },
        { orderIndex: 'asc' },
      ],
    });

    // จัดกลุ่มตามลำดับแท็บที่กำหนด
    const groupDefinitions: { category: OrganizerCategory; label: string }[] = [
      { category: OrganizerCategory.PERFORMANCE_1, label: 'กลุ่มการแสดงที่ 1' },
      { category: OrganizerCategory.PERFORMANCE_2, label: 'กลุ่มการแสดงที่ 2' },
      { category: OrganizerCategory.PERFORMANCE_3, label: 'กลุ่มการแสดงที่ 3' },
      { category: OrganizerCategory.CLUB, label: 'ชุมนุม' },
      { category: OrganizerCategory.SAMO, label: 'สโมสร' },
    ];

    const staffGroups = groupDefinitions.map((def) => ({
      category: def.category,
      label: def.label,
      members: staffRecords.filter((s) => s.category === def.category),
    }));

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
