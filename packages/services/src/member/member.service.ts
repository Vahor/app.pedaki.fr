import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

class MemberService {
  async register(workspaceId: string, email: string): Promise<void> {
    try {
      await prisma.workspaceMember.create({
        data: {
          email,
          workspaceId,
        },
      });
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'ALREADY_EXISTS',
        });
      }
    }
  }
}

const memberService = new MemberService();
export { memberService };
