import type { SQLiteDatabase } from 'expo-sqlite';
import { INITIAL_LOGS, INITIAL_PETS } from '../constants/initialPets';
import type { CareLog, CareType, Pet, PetPhoto, PetSpecies, PetGender } from '../types/pet';

type PetRow = {
  id: string; name: string; species: PetSpecies; gender: PetGender; breed: string; age_years: number;
  age_months: number; weight: number; weight_unit: 'lbs' | 'kg'; photo_uri: string | null; birth_date: string | null; birth_date_estimated: number; avatar: Pet['avatar'];
};

type CareLogRow = {
  id: string; pet_id: string; type: CareType; title: string; detail: string;
  time: string; date: string; completed: number;
};

type PetPhotoRow = { id: string; pet_id: string; uri: string };

type DatabaseCache = {
  pets?: Pet[];
  petsPromise?: Promise<Pet[]>;
  logs?: CareLog[];
  logsPromise?: Promise<CareLog[]>;
  photos?: PetPhoto[];
  photosPromise?: Promise<PetPhoto[]>;
};

const databaseCaches = new WeakMap<SQLiteDatabase, DatabaseCache>();

function getCache(db: SQLiteDatabase) {
  let cache = databaseCaches.get(db);
  if (!cache) {
    cache = {};
    databaseCaches.set(db, cache);
  }
  return cache;
}

function invalidatePets(db: SQLiteDatabase) {
  const cache = getCache(db);
  cache.pets = undefined;
}

function invalidateLogs(db: SQLiteDatabase) {
  const cache = getCache(db);
  cache.logs = undefined;
}

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'unknown',
      breed TEXT NOT NULL,
      age_years INTEGER NOT NULL DEFAULT 0,
      age_months INTEGER NOT NULL DEFAULT 0,
      weight REAL NOT NULL,
      weight_unit TEXT NOT NULL,
      avatar TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS care_logs (
      id TEXT PRIMARY KEY NOT NULL,
      pet_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      time TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS care_logs_pet_id_idx ON care_logs (pet_id);
    CREATE TABLE IF NOT EXISTS pet_photos (
      id TEXT PRIMARY KEY NOT NULL,
      pet_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS pet_photos_pet_id_idx ON pet_photos (pet_id);
  `);
  try {
    await db.execAsync('ALTER TABLE pets ADD COLUMN photo_uri TEXT');
  } catch {
    // Existing databases already have the column.
  }
  try {
    await db.execAsync("ALTER TABLE pets ADD COLUMN gender TEXT NOT NULL DEFAULT 'unknown'");
  } catch {
    // Existing databases already have the column.
  }
  try {
    await db.execAsync('ALTER TABLE pets ADD COLUMN birth_date TEXT');
  } catch {
    // Existing databases already have the column.
  }
  try {
    await db.execAsync('ALTER TABLE pets ADD COLUMN birth_date_estimated INTEGER NOT NULL DEFAULT 0');
  } catch {
    // Existing databases already have the column.
  }

  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM pets');
  if ((existing?.count ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    for (const pet of INITIAL_PETS) await insertPet(db, pet);
    for (const log of INITIAL_LOGS) await insertCareLog(db, log);
  });
}

export async function getPets(db: SQLiteDatabase): Promise<Pet[]> {
  const cache = getCache(db);
  if (cache.pets) return cache.pets;
  if (cache.petsPromise) return cache.petsPromise;

  const request = db.getAllAsync<PetRow>('SELECT * FROM pets ORDER BY name COLLATE NOCASE')
    .then((rows) => rows.map(toPet))
    .then((pets) => {
      cache.pets = pets;
      return pets;
    })
    .finally(() => { cache.petsPromise = undefined; });
  cache.petsPromise = request;
  return request;
}

export async function getPet(db: SQLiteDatabase, id: string) {
  const cachedPets = getCache(db).pets;
  const cachedPet = cachedPets?.find((pet) => pet.id === id);
  if (cachedPet) return cachedPet;

  const row = await db.getFirstAsync<PetRow>('SELECT * FROM pets WHERE id = ?', id);
  return row ? toPet(row) : undefined;
}

export async function getCareLogs(db: SQLiteDatabase): Promise<CareLog[]> {
  const cache = getCache(db);
  if (cache.logs) return cache.logs;
  if (cache.logsPromise) return cache.logsPromise;

  const request = db.getAllAsync<CareLogRow>('SELECT * FROM care_logs ORDER BY rowid DESC')
    .then((rows) => rows.map(toCareLog))
    .then((logs) => {
      cache.logs = logs;
      return logs;
    })
    .finally(() => { cache.logsPromise = undefined; });
  cache.logsPromise = request;
  return request;
}

export async function getPetPhotos(db: SQLiteDatabase, petId: string): Promise<PetPhoto[]> {
  const cache = getCache(db);
  if (cache.photos) return cache.photos.filter((photo) => photo.petId === petId);
  if (cache.photosPromise) return (await cache.photosPromise).filter((photo) => photo.petId === petId);

  const request = db.getAllAsync<PetPhotoRow>('SELECT * FROM pet_photos ORDER BY rowid DESC')
    .then((rows) => rows.map((row) => ({ id: row.id, petId: row.pet_id, uri: row.uri })))
    .then((photos) => { cache.photos = photos; return photos; })
    .finally(() => { cache.photosPromise = undefined; });
  cache.photosPromise = request;
  return (await request).filter((photo) => photo.petId === petId);
}

export async function addPet(db: SQLiteDatabase, input: Omit<Pet, 'id' | 'ageYears' | 'ageMonths' | 'avatar'>) {
  const pet: Pet = {
    ...input,
    id: `pet-${Date.now()}`,
    ageYears: 0,
    ageMonths: 0,
    avatar: input.species,
  };
  await insertPet(db, pet);
  invalidatePets(db);
  return pet;
}

export async function updatePet(db: SQLiteDatabase, petId: string, input: Omit<Pet, 'id' | 'avatar'>) {
  const pet: Pet = { ...input, id: petId, avatar: input.species };
  await db.runAsync(
    `UPDATE pets
     SET name = ?, species = ?, gender = ?, birth_date = ?, birth_date_estimated = ?, breed = ?, age_years = ?, age_months = ?, weight = ?, weight_unit = ?, photo_uri = ?, avatar = ?
     WHERE id = ?`,
    pet.name, pet.species, pet.gender, pet.birthDate ?? null, pet.birthDateEstimated ? 1 : 0, pet.breed, pet.ageYears, pet.ageMonths, pet.weight, pet.weightUnit, pet.photoUri, pet.avatar, pet.id,
  );
  invalidatePets(db);
  return pet;
}

export async function deletePet(db: SQLiteDatabase, petId: string) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM care_logs WHERE pet_id = ?', petId);
    await db.runAsync('DELETE FROM pet_photos WHERE pet_id = ?', petId);
    await db.runAsync('DELETE FROM pets WHERE id = ?', petId);
  });
  invalidatePets(db);
  invalidateLogs(db);
  const cache = getCache(db);
  cache.photos = undefined;
}

export async function addPetPhoto(db: SQLiteDatabase, petId: string, uri: string) {
  const photo: PetPhoto = { id: `photo-${Date.now()}`, petId, uri };
  await db.runAsync('INSERT INTO pet_photos (id, pet_id, uri) VALUES (?, ?, ?)', photo.id, photo.petId, photo.uri);
  const cache = getCache(db);
  cache.photos = undefined;
  return photo;
}

export async function deletePetPhoto(db: SQLiteDatabase, photoId: string) {
  await db.runAsync('DELETE FROM pet_photos WHERE id = ?', photoId);
  getCache(db).photos = undefined;
}

export async function updateCareLog(db: SQLiteDatabase, id: string, completed: boolean) {
  await db.runAsync('UPDATE care_logs SET completed = ? WHERE id = ?', completed ? 1 : 0, id);
  invalidateLogs(db);
}

export async function updateCareLogDetails(db: SQLiteDatabase, id: string, title: string, detail: string, time: string, date: string) {
  await db.runAsync('UPDATE care_logs SET title = ?, detail = ?, time = ?, date = ? WHERE id = ?', title, detail, time, date, id);
  invalidateLogs(db);
}

export async function deleteCareLog(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM care_logs WHERE id = ?', id);
  invalidateLogs(db);
}

export async function addCareLog(db: SQLiteDatabase, input: Omit<CareLog, 'id'>) {
  const log: CareLog = { ...input, id: `log-${Date.now()}` };
  await insertCareLog(db, log);
  invalidateLogs(db);
  return log;
}

async function insertPet(db: SQLiteDatabase, pet: Pet) {
  await db.runAsync(
    `INSERT OR IGNORE INTO pets (id, name, species, gender, birth_date, birth_date_estimated, breed, age_years, age_months, weight, weight_unit, photo_uri, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    pet.id, pet.name, pet.species, pet.gender, pet.birthDate ?? null, pet.birthDateEstimated ? 1 : 0, pet.breed, pet.ageYears, pet.ageMonths, pet.weight, pet.weightUnit, pet.photoUri, pet.avatar,
  );
}

async function insertCareLog(db: SQLiteDatabase, log: CareLog) {
  await db.runAsync(
    `INSERT OR IGNORE INTO care_logs (id, pet_id, type, title, detail, time, date, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    log.id, log.petId, log.type, log.title, log.detail, log.time, log.date, log.completed ? 1 : 0,
  );
}

function toPet(row: PetRow): Pet {
  return { id: row.id, name: row.name, species: row.species, gender: row.gender ?? 'unknown', birthDate: row.birth_date ?? null, birthDateEstimated: Boolean(row.birth_date_estimated), breed: row.breed, ageYears: row.age_years, ageMonths: row.age_months, weight: row.weight, weightUnit: row.weight_unit, photoUri: row.photo_uri ?? null, avatar: row.avatar };
}

function toCareLog(row: CareLogRow): CareLog {
  return { id: row.id, petId: row.pet_id, type: row.type, title: row.title, detail: row.detail, time: row.time, date: row.date, completed: Boolean(row.completed) };
}
