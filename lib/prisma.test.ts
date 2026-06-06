// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Prisma client", () => {
  it("queries every model without type errors", async () => {
    await expect(prisma.user.findMany()).resolves.toBeInstanceOf(Array);
    await expect(prisma.player.findMany()).resolves.toBeInstanceOf(Array);
    await expect(prisma.setting.findMany()).resolves.toBeInstanceOf(Array);
    await expect(prisma.session.findMany()).resolves.toBeInstanceOf(Array);
    await expect(prisma.sessionPlayer.findMany()).resolves.toBeInstanceOf(Array);
    await expect(prisma.ratingsLog.findMany()).resolves.toBeInstanceOf(Array);
    await expect(prisma.ladderSnapshot.findMany()).resolves.toBeInstanceOf(Array);
  });

  it("returns the seeded admin user and default settings", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "atholl@tomlinson.co.za" },
    });
    expect(admin?.role).toBe("ADMIN");

    const settings = await prisma.setting.findMany();
    expect(settings.length).toBe(15);

    const startingRating = settings.find((s) => s.key === "StartingRating");
    expect(startingRating?.value).toBe(1000);
  });
});
