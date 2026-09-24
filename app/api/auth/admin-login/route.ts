import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const adminLoginSchema = z.object({
  password: z.string().min(1),
  role: z.enum(['STAFF', 'ADMIN']).default('STAFF'),
});

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ByeniorSamoSci';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }

    const { password, role } = parsed.data;

    // ตรวจสอบรหัสผ่านแอดมิน/สตาฟ
    if (password !== DEFAULT_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง' }, { status: 401 });
    }

    const sessionRole = role === 'ADMIN' ? 'ADMIN' : 'STAFF';

    const token = await createSession({
      userId: 'system-staff-admin',
      fullName: sessionRole === 'ADMIN' ? 'สโมสรนักศึกษา (Admin)' : 'เจ้าหน้าที่สแกน (Staff)',
      role: sessionRole,
    });

    const response = NextResponse.json({
      success: true,
      role: sessionRole,
    });

    response.cookies.set('bynior_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
