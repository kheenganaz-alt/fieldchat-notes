import { create } from "zustand";
import { createId } from "../lib/id";
import { elapsedSecondsSince, nowIso } from "../lib/time";
import { quickEvents, seedStops } from "../data/constants";
import { getByUser, putRecord, putRecords } from "../services/db";
import { bindNetworkSync, syncUserData } from "../services/sync";
import { getCurrentUser, signIn, signOut, signUp } from "../services/auth";
import type {
  FieldSession,
  Note,
  PersistedAppState,
  PhotoRecord,
  RoutePlan,
  RouteStop,
  SyncState,
  TimestampEvent,
  UserProfile,
  UserSettings
} from "../types";

interface AppStore {
  user: UserProfile | null;
  settings: UserSettings | null;
  sessions: FieldSession[];
  notes: Note[];
  timestamps: TimestampEvent[];
  photos: PhotoRecord[];
  routes: RoutePlan[];
  stops: RouteStop[];
  exports: import("../types").ExportRecord[];
  activeSessionId?: string;
  drafts: Record<string, string>;
  scroll: Record<string, number>;
  syncState: SyncState;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  startQuickSession: () => Promise<FieldSession>;
  completeSession: (sessionId: string) => Promise<void>;
  addTimestamp: (sessionId: string, label?: string, inputMethod?: TimestampEvent["inputMethod"]) => Promise<void>;
  addNote: (sessionId: string, body: string) => Promise<void>;
  addPhoto: (sessionId: string, dataUrl: string, caption?: string) => Promise<void>;
  setDraft: (sessionId: string, value: string) => void;
  setScroll: (sessionId: string, y: number) => void;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  createRoute: () => Promise<void>;
  updateStopStatus: (stopId: string, status: RouteStop["status"]) => Promise<void>;
  moveStop: (stopId: string, direction: -1 | 1) => Promise<void>;
  setSyncState: (state: SyncState) => void;
}

const persistKey = "fieldchat.persisted";
let unbindSync: (() => void) | null = null;

export const useAppStore = create<AppStore>((set, get) => ({
  user: null,
  settings: null,
  sessions: [],
  notes: [],
  timestamps: [],
  photos: [],
  routes: [],
  stops: [],
  exports: [],
  drafts: {},
  scroll: {},
  syncState: navigator.onLine ? "saved" : "offline",
  hydrated: false,

  async hydrate() {
    const user = await getCurrentUser();
    const persisted = readPersisted();
    if (!user) {
      set({ hydrated: true, drafts: persisted.draftBySession, scroll: persisted.scrollBySession });
      return;
    }

    await loadUserData(user);
    const state = get();
    const settings = state.settings ?? (await ensureSettings(user.id));
    const active = state.sessions.find((session) => session.id === persisted.activeSessionId && session.status !== "completed");
    const latestActive = active ?? state.sessions.filter((session) => session.status !== "completed").sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

    set({
      user,
      settings,
      activeSessionId: settings.autoResume ? latestActive?.id : undefined,
      drafts: persisted.draftBySession,
      scroll: persisted.scrollBySession,
      hydrated: true
    });

    unbindSync?.();
    unbindSync = bindNetworkSync(user.id);
  },

  async login(email, password) {
    const user = await signIn(email, password);
    set({ user });
    await get().hydrate();
  },

  async register(email, password, displayName) {
    const user = await signUp(email, password, displayName);
    set({ user });
    await get().hydrate();
  },

  async logout() {
    await signOut();
    unbindSync?.();
    set({ user: null, activeSessionId: undefined, hydrated: true });
  },

  async startQuickSession() {
    const user = requireUser(get().user);
    const startedAt = nowIso();
    const session: FieldSession = {
      id: createId("session"),
      userId: user.id,
      title: `Quick Session ${new Date(startedAt).toLocaleDateString()}`,
      status: "active",
      startedAt,
      durationSeconds: 0,
      discreet: get().settings?.discreetMode ?? false,
      createdAt: startedAt,
      updatedAt: startedAt
    };
    await putRecord("sessions", session);
    const event: TimestampEvent = {
      id: createId("ts"),
      userId: user.id,
      sessionId: session.id,
      label: "Session Opened",
      occurredAt: startedAt,
      elapsedSeconds: 0,
      inputMethod: "single",
      createdAt: startedAt
    };
    await putRecord("timestamps", event);
    set((state) => ({
      sessions: [session, ...state.sessions],
      timestamps: [event, ...state.timestamps],
      activeSessionId: session.id
    }));
    savePersisted();
    void syncUserData(user.id);
    return session;
  },

  async completeSession(sessionId) {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) return;
    const next = {
      ...session,
      status: "completed" as const,
      endedAt: nowIso(),
      durationSeconds: elapsedSecondsSince(session.startedAt),
      updatedAt: nowIso()
    };
    await putRecord("sessions", next);
    set((state) => ({
      sessions: state.sessions.map((item) => (item.id === sessionId ? next : item)),
      activeSessionId: state.activeSessionId === sessionId ? undefined : state.activeSessionId
    }));
    savePersisted();
    void syncUserData(session.userId);
  },

  async addTimestamp(sessionId, label = "Timestamp", inputMethod = "single") {
    const user = requireUser(get().user);
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) return;
    const occurredAt = nowIso();
    const event: TimestampEvent = {
      id: createId("ts"),
      userId: user.id,
      sessionId,
      label,
      occurredAt,
      elapsedSeconds: elapsedSecondsSince(session.startedAt),
      inputMethod,
      createdAt: occurredAt
    };
    await putRecord("timestamps", event);
    set((state) => ({ timestamps: [event, ...state.timestamps] }));
    void syncUserData(user.id);
  },

  async addNote(sessionId, body) {
    const user = requireUser(get().user);
    const trimmed = body.trim();
    if (!trimmed) return;
    const createdAt = nowIso();
    const note: Note = {
      id: createId("note"),
      userId: user.id,
      sessionId,
      body: trimmed,
      kind: "note",
      createdAt,
      updatedAt: createdAt
    };
    await putRecord("notes", note);
    set((state) => ({ notes: [note, ...state.notes] }));
    get().setDraft(sessionId, "");
    void syncUserData(user.id);
  },

  async addPhoto(sessionId, dataUrl, caption) {
    const user = requireUser(get().user);
    const createdAt = nowIso();
    const photo: PhotoRecord = {
      id: createId("photo"),
      userId: user.id,
      sessionId,
      dataUrl,
      caption,
      createdAt
    };
    await putRecord("photos", photo);
    set((state) => ({ photos: [photo, ...state.photos] }));
    void syncUserData(user.id);
  },

  setDraft(sessionId, value) {
    set((state) => ({ drafts: { ...state.drafts, [sessionId]: value } }));
    savePersisted();
  },

  setScroll(sessionId, y) {
    set((state) => ({ scroll: { ...state.scroll, [sessionId]: y } }));
    savePersisted();
  },

  async updateSettings(patch) {
    const current = get().settings;
    if (!current) return;
    const next = { ...current, ...patch, updatedAt: nowIso(), syncedAt: undefined };
    await putRecord("settings", next);
    set({ settings: next });
    document.documentElement.classList.toggle("dark", next.darkMode);
    applyThemeAccent(next.themeAccent);
    void syncUserData(next.userId);
  },

  async createRoute() {
    const user = requireUser(get().user);
    const createdAt = nowIso();
    const route: RoutePlan = {
      id: createId("route"),
      userId: user.id,
      name: `Field Route ${get().routes.length + 1}`,
      estimatedMinutes: 68,
      createdAt,
      updatedAt: createdAt
    };
    const stops = seedStops.map((name, index): RouteStop => ({
      id: createId("stop"),
      userId: user.id,
      routeId: route.id,
      name,
      address: `${100 + index * 25} Market Street`,
      status: "Pending",
      sortOrder: index,
      createdAt,
      updatedAt: createdAt
    }));
    await putRecord("routes", route);
    await putRecords("stops", stops);
    set((state) => ({ routes: [route, ...state.routes], stops: [...stops, ...state.stops] }));
    void syncUserData(user.id);
  },

  async updateStopStatus(stopId, status) {
    const stop = get().stops.find((item) => item.id === stopId);
    if (!stop) return;
    const next = { ...stop, status, updatedAt: nowIso(), syncedAt: undefined };
    await putRecord("stops", next);
    set((state) => ({ stops: state.stops.map((item) => (item.id === stopId ? next : item)) }));
    void syncUserData(stop.userId);
  },

  async moveStop(stopId, direction) {
    const stop = get().stops.find((item) => item.id === stopId);
    if (!stop) return;
    const routeStops = get().stops.filter((item) => item.routeId === stop.routeId).sort((a, b) => a.sortOrder - b.sortOrder);
    const index = routeStops.findIndex((item) => item.id === stopId);
    const target = routeStops[index + direction];
    if (!target) return;
    const a = { ...stop, sortOrder: target.sortOrder, updatedAt: nowIso(), syncedAt: undefined };
    const b = { ...target, sortOrder: stop.sortOrder, updatedAt: nowIso(), syncedAt: undefined };
    await putRecords("stops", [a, b]);
    set((state) => ({ stops: state.stops.map((item) => (item.id === a.id ? a : item.id === b.id ? b : item)) }));
  },

  setSyncState(state) {
    set({ syncState: state });
  }
}));

async function loadUserData(user: UserProfile) {
  const [sessions, notes, timestamps, photos, routes, stops, exports, settingsRows] = await Promise.all([
    getByUser("sessions", user.id),
    getByUser("notes", user.id),
    getByUser("timestamps", user.id),
    getByUser("photos", user.id),
    getByUser("routes", user.id),
    getByUser("stops", user.id),
    getByUser("exports", user.id),
    getByUser("settings", user.id)
  ]);
  const settings = settingsRows[0] ? normalizeSettings(settingsRows[0]) : await ensureSettings(user.id);
  if (settingsRows[0]) await putRecord("settings", settings);
  document.documentElement.classList.toggle("dark", settings.darkMode);
  applyThemeAccent(settings.themeAccent);
  useAppStore.setState({
    sessions: sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    notes: notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    timestamps: timestamps.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    photos: photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    routes: routes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    stops,
    exports,
    settings
  });
}

function applyThemeAccent(accent: UserSettings["themeAccent"]) {
  const root = document.documentElement;
  const values = {
    shopit: ["22 100% 55%", "14 90% 50%"],
    blue: ["221 83% 53%", "199 89% 48%"],
    slate: ["222 47% 11%", "220 9% 46%"]
  }[accent ?? "shopit"];
  root.style.setProperty("--primary", values[0]);
  root.style.setProperty("--accent", values[1]);
}

function normalizeSettings(settings: UserSettings): UserSettings {
  const quickEventSettings = Object.fromEntries(quickEvents.map((event) => [event, settings.quickEventSettings?.[event] ?? true]));
  return {
    ...settings,
    fakeContactName: settings.fakeContactName ?? "Mom",
    pinLock: settings.pinLock ?? false,
    pinCode: settings.pinCode ?? "",
    themeAccent: settings.themeAccent ?? "shopit",
    timestampPrecision: settings.timestampPrecision ?? "seconds",
    autoOpenTimestamp: settings.autoOpenTimestamp ?? true,
    voiceNotesEnabled: settings.voiceNotesEnabled ?? true,
    defaultExportFormat: settings.defaultExportFormat ?? "pdf",
    includePhotosInExports: settings.includePhotosInExports ?? true,
    autoShareExports: settings.autoShareExports ?? true,
    offlineCache: settings.offlineCache ?? true,
    autoSync: settings.autoSync ?? true,
    permissionCamera: settings.permissionCamera ?? "ask_when_used",
    permissionMicrophone: settings.permissionMicrophone ?? "ask_when_used",
    permissionLocation: settings.permissionLocation ?? "ask_when_used",
    quickEventSettings
  };
}

async function ensureSettings(userId: string) {
  const createdAt = nowIso();
  const quickEventSettings = Object.fromEntries(quickEvents.map((event) => [event, true]));
  const settings: UserSettings = {
    id: `settings_${userId}`,
    userId,
    darkMode: false,
    discreetMode: false,
    fakeContactName: "Mom",
    vibration: true,
    autoResume: true,
    pinLock: false,
    pinCode: "",
    themeAccent: "shopit",
    timestampPrecision: "seconds",
    autoOpenTimestamp: true,
    voiceNotesEnabled: true,
    defaultExportFormat: "pdf",
    includePhotosInExports: true,
    autoShareExports: true,
    offlineCache: true,
    autoSync: true,
    permissionCamera: "ask_when_used",
    permissionMicrophone: "ask_when_used",
    permissionLocation: "ask_when_used",
    quickEventSettings,
    createdAt,
    updatedAt: createdAt
  };
  await putRecord("settings", settings);
  return settings;
}

function readPersisted(): PersistedAppState {
  try {
    return JSON.parse(localStorage.getItem(persistKey) ?? "") as PersistedAppState;
  } catch {
    return { draftBySession: {}, scrollBySession: {} };
  }
}

function savePersisted() {
  const state = useAppStore.getState();
  const payload: PersistedAppState = {
    activeSessionId: state.activeSessionId,
    draftBySession: state.drafts,
    scrollBySession: state.scroll
  };
  localStorage.setItem(persistKey, JSON.stringify(payload));
}

function requireUser(user: UserProfile | null) {
  if (!user) throw new Error("You must be signed in.");
  return user;
}

export function sessionEvents(sessionId: string) {
  const state = useAppStore.getState();
  const notes = state.notes.filter((note) => note.sessionId === sessionId).map((note) => ({ type: "note" as const, at: note.createdAt, note }));
  const timestamps = state.timestamps.filter((event) => event.sessionId === sessionId).map((event) => ({ type: "timestamp" as const, at: event.occurredAt, event }));
  const photos = state.photos.filter((photo) => photo.sessionId === sessionId).map((photo) => ({ type: "photo" as const, at: photo.createdAt, photo }));
  return [...notes, ...timestamps, ...photos].sort((a, b) => a.at.localeCompare(b.at));
}

export { quickEvents };
