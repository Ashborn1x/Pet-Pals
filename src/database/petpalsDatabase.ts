import type { SQLiteDatabase } from 'expo-sqlite';
import { INITIAL_LOGS, INITIAL_PETS } from '../constants/initialPets';
import type { CareLog, CareType, Pet, PetSpecies } from '../types/pet';

type PetRow = {
  id: string; name: string; species: PetSpecies; breed: string; age_years: number;
  age_months: number; weight: number; weight_unit: 'lbs' | 'kg'; photo_uri: string | null; avatar: Pet['avatar'];
};

type CareLogRow = {
  id: string; pet_id: string; type: CareType; title: string; detail: string;
  time: string; date: string; completed: number;
};

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
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
  `);
  try {
    await db.execAsync('ALTER TABLE pets ADD COLUMN photo_uri TEXT');
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
  const rows = await db.getAllAsync<PetRow>('SELECT * FROM pets ORDER BY name COLLATE NOCASE');
  return rows.map(toPet);
}

export async function getPet(db: SQLiteDatabase, id: string) {
  const row = await db.getFirstAsync<PetRow>('SELECT * FROM pets WHERE id = ?', id);
  return row ? toPet(row) : undefined;
}

export async function getCareLogs(db: SQLiteDatabase): Promise<CareLog[]> {
  const rows = await db.getAllAsync<CareLogRow>('SELECT * FROM care_logs ORDER BY rowid DESC');
  return rows.map(toCareLog);
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
  return pet;
}

export async function deletePet(db: SQLiteDatabase, petId: string) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM care_logs WHERE pet_id = ?', petId);
    await db.runAsync('DELETE FROM pets WHERE id = ?', petId);
  });
}

export async function updateCareLog(db: SQLiteDatabase, id: string, completed: boolean) {
  await db.runAsync('UPDATE care_logs SET completed = ? WHERE id = ?', completed ? 1 : 0, id);
}

export async function addCareLog(db: SQLiteDatabase, input: Omit<CareLog, 'id'>) {
  const log: CareLog = { ...input, id: `log-${Date.now()}` };
  await insertCareLog(db, log);
  return log;
}

async function insertPet(db: SQLiteDatabase, pet: Pet) {
  await db.runAsync(
    `INSERT OR IGNORE INTO pets (id, name, species, breed, age_years, age_months, weight, weight_unit, photo_uri, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    pet.id, pet.name, pet.species, pet.breed, pet.ageYears, pet.ageMonths, pet.weight, pet.weightUnit, pet.photoUri, pet.avatar,
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
  return { id: row.id, name: row.name, species: row.species, breed: row.breed, ageYears: row.age_years, ageMonths: row.age_months, weight: row.weight, weightUnit: row.weight_unit, photoUri: row.photo_uri ?? null, avatar: row.avatar };
}

function toCareLog(row: CareLogRow): CareLog {
  return { id: row.id, petId: row.pet_id, type: row.type, title: row.title, detail: row.detail, time: row.time, date: row.date, completed: Boolean(row.completed) };
}
