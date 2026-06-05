import type { Role } from "@/app/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}
