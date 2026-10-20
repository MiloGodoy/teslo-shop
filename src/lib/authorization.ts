import { auth } from '@/auth.config';
import prisma from '@/lib/prisma';
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  // JWTs may outlive a role change or deleted account.
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true },
  });
}
