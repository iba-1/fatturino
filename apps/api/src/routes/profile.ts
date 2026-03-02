import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { createUserProfileSchema } from "@fatturino/shared";
import { db } from "../db/index.js";
import { userProfiles } from "../db/schema.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

export async function profileRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/profile", async (request, reply) => {
    const userId = getUserId(request);
    const profiles = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    if (profiles.length === 0) {
      return reply.status(404).send({ error: "Profile not found" });
    }
    return profiles[0];
  });

  app.put("/api/profile", async (request, reply) => {
    const userId = getUserId(request);
    const parsed = createUserProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: "Validation failed", details: parsed.error.issues });
    }

    const existing = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    if (existing.length > 0) {
      const [updated] = await db
        .update(userProfiles)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(userProfiles)
      .values({ userId, ...parsed.data })
      .returning();
    return reply.status(201).send(created);
  });
}
