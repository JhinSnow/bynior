import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().trim(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }

    const input = parsed.data.identifier.trim();

    // บังคับรูปแบบ: รหัสนักศึกษา-นามสกุล (ต้องมีเครื่องหมายขีด - คั่นกลาง)
    if (!input.includes('-')) {
      return NextResponse.json(
        { error: 'กรุณากรอกในรูปแบบ: รหัสนักศึกษา-นามสกุล (เช่น 6610210001-ใจดี)' },
        { status: 400 }
      );
    }

    const parts = input.split('-');
    const studentId = parts[0].trim();
    const lastName = parts.slice(1).join('-').trim();

    if (!studentId || !lastName) {
      return NextResponse.json(
        { error: 'กรุณาระบุทั้งรหัสนักศึกษาและนามสกุลให้ครบถ้วน (เช่น 6610210001-ใจดี)' },
        { status: 400 }
      );
    }

    // ค้นหาในฐานข้อมูลด้วยรหัสนักศึกษา
    const user = await prisma.user.findUnique({
      where: {
        studentId: studentId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบรหัสนักศึกษานี้ในรายชื่อผู้มีสิทธิ์เข้าร่วมงาน' },
        { status: 404 }
      );
    }

    // ตรวจสอบความถูกต้องของนามสกุล (ต้องตรงกับ lastName หรือเป็นส่วนหนึ่งของ fullName)
    const cleanDbLastName = user.lastName?.trim().toLowerCase() || '';
    const cleanInputLastName = lastName.trim().toLowerCase();
    const cleanDbFullName = user.fullName?.trim().toLowerCase() || '';

    const isMatch =
      cleanDbLastName === cleanInputLastName ||
      cleanDbLastName.includes(cleanInputLastName) ||
      cleanInputLastName.includes(cleanDbLastName) ||
      cleanDbFullName.endsWith(cleanInputLastName);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'นามสกุลไม่ตรงกับรหัสนักศึกษาที่ระบุ กรุณาตรวจสอบและลองใหม่อีกครั้ง' },
        { status: 400 }
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
