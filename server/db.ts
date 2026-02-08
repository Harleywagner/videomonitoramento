import { eq, desc, like, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, occurrences, cameras, Occurrence, Camera } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ OCCURRENCES ============

export async function createOccurrence(data: Omit<Occurrence, 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(occurrences).values(data);
  return data;
}

export async function updateOccurrence(id: string, data: Partial<Occurrence>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(occurrences).set(data).where(eq(occurrences.id, id));
  const result = await db.select().from(occurrences).where(eq(occurrences.id, id)).limit(1);
  return result[0];
}

export async function deleteOccurrence(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(occurrences).where(eq(occurrences.id, id));
}

export async function getOccurrenceById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(occurrences).where(eq(occurrences.id, id)).limit(1);
  return result[0];
}

export async function getOccurrences(filters?: {
  search?: string;
  type?: string;
  classification?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions: any[] = [];
  
  if (filters?.search) {
    conditions.push(
      like(occurrences.location, `%${filters.search}%`)
    );
  }
  
  if (filters?.type) {
    conditions.push(eq(occurrences.type, filters.type));
  }
  
  if (filters?.classification) {
    conditions.push(eq(occurrences.classification, filters.classification as any));
  }
  
  let query = db.select().from(occurrences);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(occurrences.createdAt));
}

// ============ CAMERAS ============

export async function initializeCameras() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if cameras already exist
  const existing = await db.select().from(cameras).limit(1);
  if (existing.length > 0) return;
  
  // Create 9 NVRs with 32 cameras each
  const cameraData = [];
  for (let nvr = 1; nvr <= 9; nvr++) {
    for (let cam = 1; cam <= 32; cam++) {
      cameraData.push({
        id: `NVR${nvr}-CAM${String(cam).padStart(2, '0')}`,
        nvr,
        number: cam,
        status: 'Online' as const,
        obs: null,
      });
    }
  }
  
  // Insert in batches to avoid query size limits
  const batchSize = 50;
  for (let i = 0; i < cameraData.length; i += batchSize) {
    const batch = cameraData.slice(i, i + batchSize);
    await db.insert(cameras).values(batch);
  }
}

export async function getCamerasByNvr(nvr: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(cameras).where(eq(cameras.nvr, nvr)).orderBy(cameras.number);
}

export async function getAllCameras() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(cameras).orderBy(cameras.nvr, cameras.number);
}

export async function getCameraById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(cameras).where(eq(cameras.id, id)).limit(1);
  return result[0];
}

export async function updateCamera(id: string, data: Partial<Camera>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(cameras).set(data).where(eq(cameras.id, id));
  const result = await db.select().from(cameras).where(eq(cameras.id, id)).limit(1);
  return result[0];
}

export async function getCameraStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allCameras = await db.select().from(cameras);
  
  return {
    total: allCameras.length,
    online: allCameras.filter(c => c.status === 'Online').length,
    offline: allCameras.filter(c => c.status === 'Offline').length,
    defective: allCameras.filter(c => c.status === 'Defeito').length,
  };
}
