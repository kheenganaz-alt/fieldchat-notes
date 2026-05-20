import { supabase } from "../lib/supabase";
import { getByUser, putRecords, type DbShape } from "./db";
import type { FieldSession, Note, PhotoRecord, RoutePlan, RouteStop, SyncState, TimestampEvent, UserSettings } from "../types";

export type SyncListener = (state: SyncState) => void;

const listeners = new Set<SyncListener>();

export function subscribeSync(listener: SyncListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(state: SyncState) {
  listeners.forEach((listener) => listener(state));
}

export function bindNetworkSync(userId: string) {
  const onOnline = () => void syncUserData(userId);
  const onOffline = () => emit("offline");
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  emit(navigator.onLine ? "saved" : "offline");
  if (navigator.onLine) void syncUserData(userId);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

export async function syncUserData(userId: string) {
  if (!navigator.onLine) {
    emit("offline");
    return;
  }

  if (!supabase) {
    emit("saved");
    return;
  }

  emit("syncing");
  try {
    await syncTable<FieldSession>("sessions", userId);
    await syncTable<Note>("notes", userId);
    await syncTable<TimestampEvent>("timestamps", userId);
    await syncTable<RoutePlan>("routes", userId);
    await syncTable<RouteStop>("stops", userId);
    await syncTable<UserSettings>("settings", userId);
    await syncTable<PhotoRecord>("photos", userId);
    emit("saved");
  } catch (error) {
    console.error(error);
    emit("error");
  }
}

type SyncTableName = "sessions" | "notes" | "timestamps" | "routes" | "stops" | "settings" | "photos";

async function syncTable<T extends DbShape[SyncTableName] & { id: string; userId: string; syncedAt?: string }>(table: SyncTableName, userId: string) {
  const localRows = await getByUser(table, userId) as T[];
  const unsynced = localRows.filter((row) => !row.syncedAt);

  if (unsynced.length) {
    const stamped = unsynced.map((row) => ({ ...row, syncedAt: new Date().toISOString() }));
    const { error } = await supabase!.from(table).upsert(stamped);
    if (error) throw error;
    await putRecords(table, stamped as DbShape[typeof table][]);
  }

  const { data, error } = await supabase!.from(table).select("*").eq("userId", userId);
  if (error) throw error;
  if (data?.length) await putRecords(table, data as DbShape[typeof table][]);
}
