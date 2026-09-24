import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { generateDynamicQRToken } from '@/lib/crypto-token';
import { z } from 'zod';

const schema = z.object({
  couponId: z.string().uuid(),
});

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'รหัสคูปองไม่ถูกต้อง' }, { status: 400 });
    }

    const { couponId } = parsed.data;

    // ตรวจสอบว่าคูปองมีอยู่จริง
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'ไม่พบคูปองนี้ หรือคูปองปิดใช้งานแล้ว' }, { status: 404 });
    }

    // ตรวจสอบว่าเคยแลกไปแล้วหรือยัง
    const existing = await prisma.couponRedemption.findUnique({
      where: {
        unique_user_coupon_redemption: {
          userId: session.userId,
          couponId: couponId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'คุณได้ใช้สิทธิ์คูปองนี้ไปแล้ว' }, { status: 400 });
    }

    // สร้าง Signed HMAC-SHA256 Token อายุ 45 วินาที
    const { token, expiresAt } = generateDynamicQRToken(session.userId, couponId);

    return NextResponse.json({
      token,
      expiresAt,
      couponName: coupon.name,
      storeName: coupon.storeName,
    });
  } catch (error: any) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้าง QR Code' }, { status: 500 });
  }
}
