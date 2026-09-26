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
