import { User, CreateUserInput } from "../../domain/entities/User.js";
import { AuthRepository } from "../../domain/repositories/auth.repository.js";
import { prisma } from "../../config/prisma.js";
import { DB_RETRY_CONFIG, DB_WRITE_RETRY_CONFIG } from "../../config/retry.js";
import pRetry from "p-retry";

/**
 * Prisma-based implementation of AuthRepository.
 * Handles ONLY auth/user operations.
 */
export class PrismaAuthRepository implements AuthRepository {

  async register(user: CreateUserInput): Promise<User> {
      const created = await pRetry(
        async () => {
          const result = await prisma.user.create({
            data: {
              email: user.email,
              passwordHash: user.passwordHash,
              role: user.role,
            },
          });
          return result;
        },
        DB_WRITE_RETRY_CONFIG,
      );
      
      return {
        id: created.id,
        email: created.email,
        passwordHash: created.passwordHash,
        role: created.role,
      };
  }

  async findById(id: number): Promise<User | null> {
    const user = await pRetry(() => prisma.user.findUnique({
      where: {
        id: id
      }
    }), DB_RETRY_CONFIG)
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await pRetry(() => prisma.user.findFirst({
      where: {
        email: email
      }
    }), DB_RETRY_CONFIG)
    return user;
  }

  async delete(id: number): Promise<void> {
      await pRetry(
          () =>
              prisma.user.delete({
                  where: {
                      id,
                  },
              }),
          DB_WRITE_RETRY_CONFIG,
      );
  }
  
}
