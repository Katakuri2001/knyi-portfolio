#!/usr/bin/env node
/**
 * Applies the analytics retention policy.
 *
 * The policy: visitor events are kept for 180 days, then deleted. The
 * retention window is long enough to compare a quarter against the one before
 * it, and short enough that the store does not grow without bound.
 *
 * Run it from cron:
 *
 *     0 3 * * *  cd /srv/knyi && npm run prune
 */
import { pruneEvents } from "../src/lib/db/events.ts";
import { closeDb } from "../src/lib/db/adapter.ts";

const RETENTION_DAYS = Number(process.env.ANALYTICS_RETENTION_DAYS ?? 180);

const removed = await pruneEvents(RETENTION_DAYS);
console.log(`Removed ${removed} record(s) older than ${RETENTION_DAYS} days.`);
closeDb();
