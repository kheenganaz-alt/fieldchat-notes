import { createId } from "../lib/id";
import { nowIso } from "../lib/time";
import { supabase } from "../lib/supabase";
import { getRecord, putRecord } from "./db";
import type { UserProfile } from "../types";

const localUserKey = "fieldchat.currentUserId";

export async function getCurrentUser() {
  const localId = localStorage.getItem(localUserKey);
  if (localId) {
    const user = await getRecord("users", localId);
    if (user) return user;
  }

  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) {
      return persistUser(data.user.id, data.user.email, data.user.user_metadata?.display_name ?? "Field User");
    }
  }

  return null;
}

export async function signIn(email: string, password: string) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user?.email) return persistUser(data.user.id, data.user.email, data.user.user_metadata?.display_name ?? "Field User");
  }

  return persistUser(`local_${email.toLowerCase()}`, email, email.split("@")[0] || "Field User");
}

export async function signUp(email: string, password: string, displayName: string) {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    });
    if (error) throw error;
    if (data.user?.email) return persistUser(data.user.id, data.user.email, displayName);
  }

  return persistUser(createId("user"), email, displayName);
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(localUserKey);
}

async function persistUser(id: string, email: string, displayName: string): Promise<UserProfile> {
  const existing = await getRecord("users", id);
  const user = existing ?? { id, email, displayName, createdAt: nowIso() };
  await putRecord("users", user);
  localStorage.setItem(localUserKey, id);
  return user;
}
