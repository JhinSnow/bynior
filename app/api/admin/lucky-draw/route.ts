import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { z } from 'zod';

const drawWinnerSchema = z.object({
  prizeName: z.string().min(1),
});

// GET: ดึงสถิติผู้มีสิทธิ์ (Checked-in) และประวัติผู้ได้รางวัล
export async function GET() {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 1. ดึงผู้เข้าร่วมงานที่เช็คชื่อแล้ว และยังไม่ได้รางวัล
    const eligibleAttendees = await prisma.user.findMany({
      where: {
        isCheckedIn: true,
        luckyDrawWins: { none: {} },
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
      },
    });

    // 2. ดึงประวัติผู้ที่เคยได้รับรางวัลไปแล้ว
    const winners = await prisma.luckyDrawWinner.findMany({
      orderBy: { wonAt: 'desc' },
      include: {
        user: {
          select: {
            studentId: true,
            fullName: true,
          },
        },
      },
    });

    const totalCheckedIn = await prisma.user.count({
      where: { isCheckedIn: true },
    });

    return NextResponse.json({
      eligibleAttendees,
      winners,
      stats: {
        totalCheckedIn,
        eligibleCount: eligibleAttendees.length,
        winnersCount: winners.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lucky draw data' }, { status: 500 });
  }
}

// POST: สุ่มและบันทึกผู้ชนะ
export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized (Admin only)' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = drawWinnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อรางวัล' }, { status: 400 });
    }

    const { prizeName } = parsed.data;

    // ค้นหาผู้มีสิทธิ์ (Checked-in และยังไม่ได้รางวัล)
    const eligible = await prisma.user.findMany({
      where: {
        isCheckedIn: true,
        luckyDrawWins: { none: {} },
      },
    });

    if (eligible.length === 0) {
      return NextResponse.json({ error: 'ไม่มีรายชื่อผู้มีสิทธิ์สุ่มรางวัล (ทุกคนได้รับรางวัลแล้ว หรือยังไม่มีคนเช็คชื่อ)' }, { status: 400 });
    }

    // สุ่ม 1 คนด้วย Cryptographically Secure Random
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const selectedWinner = eligible[randomIndex];

    // บันทึกลง DB
    const winnerRecord = await prisma.luckyDrawWinner.create({
      data: {
        userId: selectedWinner.id,
        prizeName,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      winner: {
        id: winnerRecord.id,
        prizeName: winnerRecord.prizeName,
        wonAt: winnerRecord.wonAt,
        studentId: winnerRecord.user.studentId,
        fullName: winnerRecord.user.fullName,
      },
    });
  } catch (error) {
    console.error('Lucky draw error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสุ่มรางวัล' }, { status: 500 });
  }
}
