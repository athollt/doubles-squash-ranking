"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createUser,
  updateUserRole,
  updateUserName,
  deleteUser,
  type Role,
  type UserResult,
  type DeleteResult,
} from "@/lib/users";
import { prismaUserStore } from "@/lib/user-store";

// Returns the acting admin's user id, or throws if not an admin / not found.
async function requireAdminId(): Promise<string> {
  const session = await auth();
  if (session?.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  const email = session.user?.email;
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
    : null;
  if (!user) {
    throw new Error("Forbidden");
  }
  return user.id;
}

export async function createUserAction(
  email: string,
  name: string,
  role: Role,
): Promise<UserResult> {
  await requireAdminId();
  const result = await createUser(email, name, role, prismaUserStore);
  if (result.ok) revalidatePath("/admin/users");
  return result;
}

export async function updateUserRoleAction(
  id: string,
  role: Role,
): Promise<UserResult> {
  await requireAdminId();
  const result = await updateUserRole(id, role, prismaUserStore);
  if (result.ok) revalidatePath("/admin/users");
  return result;
}

export async function updateUserNameAction(
  id: string,
  name: string,
): Promise<UserResult> {
  await requireAdminId();
  const result = await updateUserName(id, name, prismaUserStore);
  if (result.ok) revalidatePath("/admin/users");
  return result;
}

export async function deleteUserAction(id: string): Promise<DeleteResult> {
  const actingUserId = await requireAdminId();
  const result = await deleteUser(id, actingUserId, prismaUserStore);
  if (result.ok) revalidatePath("/admin/users");
  return result;
}
