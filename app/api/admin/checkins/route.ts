import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const attendees = await prisma.user.findMany({
      where: {
        role: 'PARTICIPANT',
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        lastName: true,
        isCheckedIn: true,
        checkedInAt: true,
        _count: {
          select: {
            redemptions: true,
            luckyDrawWins: true,
          },
        },
      },
      orderBy: [
        { isCheckedIn: 'desc' },
        { checkedInAt: 'desc' },
        { studentId: 'asc' },
      ],
    });

    const totalParticipants = attendees.length;
    const checkedInCount = attendees.filter((a) => a.isCheckedIn).length;

    return NextResponse.json({
      attendees,
      stats: {
        total: totalParticipants,
        checkedIn: checkedInCount,
        notCheckedIn: totalParticipants - checkedInCount,
        percentage: totalParticipants > 0 ? Math.round((checkedInCount / totalParticipants) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching checkin list:', error);
    return NextResponse.json({ error: 'Failed to fetch checkin list' }, { status: 500 });
  }
}

// PATCH: แก้ไขข้อมูลผู้เข้าร่วมงานรายคน (ชื่อ-สกุล, นามสกุล, หรือสถานะการลงทะเบียน)
export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, fullName, lastName, isCheckedIn } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof fullName === 'string') updateData.fullName = fullName.trim();
    if (typeof lastName === 'string') updateData.lastName = lastName.trim();
    if (typeof isCheckedIn === 'boolean') {
      updateData.isCheckedIn = isCheckedIn;
      updateData.checkedInAt = isCheckedIn ? new Date() : null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updated, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
  } catch (error: any) {
    console.error('Error updating attendee:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' }, { status: 500 });
  }
}

// DELETE: ล้างประวัติรายคน หรือลบผู้เข้าร่วมงานออกจากระบบ (Admin Only)
export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized (Admin only)' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action') || 'reset'; // 'reset' (ล้างประวัติการเข้างาน) หรือ 'delete' (ลบรายชื่อออกจากระบบ)

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    if (action === 'delete') {
      // ลบออกจากระบบถาวร (Cascade ลบ redemptions & luckyDrawWins อัตโนมัติ)
      await prisma.user.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'ลบรายชื่อผู้เข้าร่วมงานออกจากระบบแล้ว' });
    } else {
      // รีเซ็ตสถานะการเช็คชื่อ คูปองที่ใช้ และรางวัลของคนๆ นี้
      await prisma.$transaction([
        prisma.luckyDrawWinner.deleteMany({ where: { userId: id } }),
        prisma.couponRedemption.deleteMany({ where: { userId: id } }),
        prisma.user.update({
          where: { id },
          data: { isCheckedIn: false, checkedInAt: null },
        }),
      ]);
      return NextResponse.json({ success: true, message: 'ล้างประวัติการลงทะเบียนของบุคคลนี้แล้ว' });
    }
  } catch (error) {
    console.error('Error deleting/resetting attendee:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดำเนินการ' }, { status: 500 });
  }
}

