import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        redemptions: {
          where: { userId: session.userId },
        },
      },
    });

    const userCoupons = coupons.map((c) => {
      const maxUses = c.maxUsesPerUser || 1;
      const usedCount = c.redemptions.length;
      const remainingUses = Math.max(0, maxUses - usedCount);
      const isRedeemed = remainingUses === 0;

      return {
        id: c.id,
        name: c.name,
        storeName: c.storeName,
        description: c.description,
        maxUsesPerUser: maxUses,
        usedCount,
        remainingUses,
        isRedeemed,
        redeemedAt: c.redemptions[c.redemptions.length - 1]?.redeemedAt || null,
      };
    });

    return NextResponse.json({ coupons: userCoupons });
  } catch (error: any) {
    console.error('Fetch coupons error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลคูปองได้' }, { status: 500 });
  }
}
