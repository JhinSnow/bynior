import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let dbUser = null;
  if (session.role === 'PARTICIPANT') {
    dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, studentId: true, fullName: true, isCheckedIn: true },
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: dbUser || {
      id: session.userId,
      fullName: session.fullName,
      role: session.role,
    },
    role: session.role,
  });
}
