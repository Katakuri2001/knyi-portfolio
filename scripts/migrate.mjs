#!/usr/bin/env node
/**
 * Applies the database migrations.
 *
 * The application migrates on first connection too, so this script is for the
 * cases where you want them applied explicitly: in a container's start
 * command, in CI, or to check the schema without starting the app.
 */
import { getDb, closeDb } from "../src/lib/db/adapter.ts";

const db = await getDb();
const tables = await db.all("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");

console.log("Database ready.");
console.log(`Tables: ${tables.map((row) => row.name).join(", ")}`);
closeDb();
