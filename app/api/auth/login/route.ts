import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(3), // รูปแบบ 6610210001-ใจดี หรือใส่แยก
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }

    const input = parsed.data.identifier.trim();
    let studentId = '';
    let lastName = '';

    if (input.includes('-')) {
      const parts = input.split('-');
      studentId = parts[0].trim();
      lastName = parts.slice(1).join('-').trim();
    } else {
      studentId = input;
    }

    // ค้นหาในฐานข้อมูล
    const user = await prisma.user.findFirst({
      where: {
        studentId: studentId,
        ...(lastName ? { lastName: { contains: lastName, mode: 'insensitive' } } : {}),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้มีสิทธิ์เข้าร่วมงาน กรุณาตรวจสอบรหัสนักศึกษาและนามสกุล' },
        { status: 404 }
      );
    }

    // อัปเดต Checked-in status ใน DB ทันทีเมื่อผู้ใช้ยืนยันการเข้าสู่ระบบ
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isCheckedIn: true,
        checkedInAt: user.checkedInAt || new Date(),
      },
    });

    // สร้าง JWT Session
    const token = await createSession({
      userId: updatedUser.id,
      studentId: updatedUser.studentId,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        studentId: updatedUser.studentId,
        fullName: updatedUser.fullName,
        isCheckedIn: updatedUser.isCheckedIn,
      },
    });

    response.cookies.set('bynior_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 ชั่วโมง
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' }, { status: 500 });
  }
}
