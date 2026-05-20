export type SyncState = "online" | "offline" | "syncing" | "saved" | "error";
export type SessionStatus = "active" | "paused" | "completed";
export type StopStatus = "Pending" | "Arrived" | "Completed" | "Skipped" | "Rescheduled";
export type ExportFormat = "pdf" | "docx" | "txt" | "csv";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface FieldSession {
  id: string;
  userId: string;
  title: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  summary?: string;
  routeId?: string;
  discreet: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface Note {
  id: string;
  userId: string;
  sessionId: string;
  body: string;
  kind: "note" | "voice" | "system";
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface TimestampEvent {
  id: string;
  userId: string;
  sessionId: string;
  label?: string;
  occurredAt: string;
  elapsedSeconds: number;
  inputMethod: "single" | "double" | "long" | "floating" | "chip";
  createdAt: string;
  syncedAt?: string;
}

export interface PhotoRecord {
  id: string;
  userId: string;
  sessionId: string;
  dataUrl: string;
  caption?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface RoutePlan {
  id: string;
  userId: string;
  name: string;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface RouteStop {
  id: string;
  userId: string;
  routeId: string;
  name: string;
  address: string;
  status: StopStatus;
  sortOrder: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  darkMode: boolean;
  discreetMode: boolean;
  vibration: boolean;
  autoResume: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface ExportRecord {
  id: string;
  userId: string;
  sessionId: string;
  format: ExportFormat;
  createdAt: string;
  syncedAt?: string;
}

export interface PersistedAppState {
  activeSessionId?: string;
  draftBySession: Record<string, string>;
  scrollBySession: Record<string, number>;
}
