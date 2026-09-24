import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    if (session.role === 'STAFF') {
      redirect('/admin/scanner');
    } else if (session.role === 'ADMIN') {
      redirect('/admin/activities');
    } else {
      redirect('/wallet');
    }
  }

  redirect('/login');
}
