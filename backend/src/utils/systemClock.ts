import prisma from "../config/prismaClient";

let cachedOffsetMs = 0;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000; // Cache for 1 second to avoid database overhead on consecutive reads

export async function getNow(): Promise<Date> {
  const realNow = Date.now();
  if (realNow - lastFetchTime > CACHE_TTL_MS) {
    try {
      const clock = await prisma.systemClock.findUnique({
        where: { id: 1 },
      });
      if (clock) {
        cachedOffsetMs = clock.offsetMs;
      } else {
        // Auto-initialize if missing
        await prisma.systemClock.create({
          data: { id: 1, offsetMs: 0 },
        });
        cachedOffsetMs = 0;
      }
    } catch (e) {
      console.warn("Failed to fetch SystemClock offset, using 0", e);
    }
    lastFetchTime = realNow;
  }
  return new Date(realNow + cachedOffsetMs);
}
