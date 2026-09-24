import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { verifyDynamicQRToken } from '@/lib/crypto-token';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(10),
  action: z.enum(['VERIFY', 'CONFIRM_REDEEM']),
});

export async function POST(req: Request) {
  // ตรวจสอบว่าเป็น Staff หรือ Admin
  const session = await getCurrentSession();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ในการสแกนคูปอง (ต้องเป็นเจ้าหน้าที่)' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลคำขอไม่ถูกต้อง' }, { status: 400 });
    }

    const { token, action } = parsed.data;

    // 1. ถอดรหัสและตรวจสอบความถูกต้องของ Token
    let payload;
    try {
      payload = verifyDynamicQRToken(token);
    } catch (err: any) {
      if (err.message === 'TOKEN_EXPIRED') {
        return NextResponse.json({ error: 'QR Code หมดอายุแล้ว กรุณาให้ผู้เข้าร่วมงานรีเฟรชหน้าจอ' }, { status: 400 });
      }
      return NextResponse.json({ error: 'QR Code ไม่ถูกต้อง หรือถูกปลอมแปลง' }, { status: 400 });
    }

    const { uid: userId, cid: couponId } = payload;

    // 2. ดึงข้อมูล User และ Coupon
    const [user, coupon] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.coupon.findUnique({ where: { id: couponId } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้ในระบบ' }, { status: 404 });
    }
    if (!coupon) {
      return NextResponse.json({ error: 'ไม่พบรายการคูปองนี้' }, { status: 404 });
    }

    // ตรวจสอบว่าเคยแลกไปแล้วหรือยัง
    const existing = await prisma.couponRedemption.findUnique({
      where: {
        unique_user_coupon_redemption: {
          userId,
          couponId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'คูปองนี้ถูกใช้งานไปแล้ว!',
          redeemedAt: existing.redeemedAt,
          user: { fullName: user.fullName, studentId: user.studentId },
          coupon: { name: coupon.name, storeName: coupon.storeName },
        },
        { status: 409 }
      );
    }

    // กรณี action = VERIFY (แสดงหน้าต่างยืนยันข้อมูลให้เจ้าหน้าที่ดูก่อนกด)
    if (action === 'VERIFY') {
      return NextResponse.json({
        success: true,
        canRedeem: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          studentId: user.studentId,
        },
        coupon: {
          id: coupon.id,
          name: coupon.name,
          storeName: coupon.storeName,
        },
      });
    }

    // กรณี action = CONFIRM_REDEEM: ตัดสิทธิ์ด้วย Database ACID Transaction
    const result = await prisma.$transaction(async (tx) => {
      // ตรวจสอบซ้ำภายใน Transaction กัน Race condition (Double-redemption)
      const doubleCheck = await tx.couponRedemption.findUnique({
        where: {
          unique_user_coupon_redemption: {
            userId,
            couponId,
          },
        },
      });

      if (doubleCheck) {
        throw new Error('ALREADY_REDEEMED');
      }

      // บันทึกการใช้งาน
      const redemption = await tx.couponRedemption.create({
        data: {
          userId,
          couponId,
          staffId: session.userId !== 'system-staff-admin' ? session.userId : null,
        },
      });

      // ปรับปรุงจำนวนยอดที่แลกไป
      await tx.coupon.update({
        where: { id: couponId },
        data: { currentRedeemed: { increment: 1 } },
      });

      return redemption;
    });

    return NextResponse.json({
      success: true,
      message: 'ตัดสิทธิ์คูปองและบันทึกข้อมูลเรียบร้อยแล้ว',
      redemption: result,
      user: { fullName: user.fullName, studentId: user.studentId },
      coupon: { name: coupon.name, storeName: coupon.storeName },
    });
  } catch (error: any) {
    console.error('Redemption error:', error);
    if (error.message === 'ALREADY_REDEEMED') {
      return NextResponse.json({ error: 'คูปองนี้เพิ่งถูกตัดสิทธิ์ไปแล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตัดสิทธิ์คูปอง' }, { status: 500 });
  }
}
