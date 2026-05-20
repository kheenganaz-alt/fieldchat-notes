import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { createId } from "../lib/id";
import { formatDateTime, formatElapsed } from "../lib/time";
import { putRecord } from "./db";
import type { ExportFormat, ExportRecord, FieldSession, Note, PhotoRecord, TimestampEvent } from "../types";

export interface ExportPayload {
  session: FieldSession;
  notes: Note[];
  timestamps: TimestampEvent[];
  photos: PhotoRecord[];
}

export function hasExportContent(payload: ExportPayload) {
  return Boolean(payload.session && (payload.notes.length || payload.timestamps.length || payload.photos.length || payload.session.summary));
}

export async function exportSession(payload: ExportPayload, format: ExportFormat) {
  if (!hasExportContent(payload)) throw new Error("This session has no notes, timestamps, photos, or summary to export.");

  const filename = `${payload.session.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${formatDateSlug(payload.session.startedAt)}`;
  if (format === "pdf") exportPdf(payload, `${filename}.pdf`);
  if (format === "docx") await exportDocx(payload, `${filename}.docx`);
  if (format === "txt") exportText(payload, `${filename}.txt`);
  if (format === "csv") exportCsv(payload, `${filename}.csv`);

  const record: ExportRecord = {
    id: createId("export"),
    userId: payload.session.userId,
    sessionId: payload.session.id,
    format,
    createdAt: new Date().toISOString()
  };
  await putRecord("exports", record);
  return record;
}

function exportPdf(payload: ExportPayload, filename: string) {
  const pdf = new jsPDF();
  let y = 18;
  pdf.setFontSize(18);
  pdf.text(payload.session.title, 14, y);
  y += 9;
  pdf.setFontSize(10);
  pdf.text(`Started: ${formatDateTime(payload.session.startedAt)}`, 14, y);
  y += 6;
  pdf.text(`Duration: ${formatElapsed(payload.session.durationSeconds)}`, 14, y);
  y += 10;
  y = writeLines(pdf, "Timeline", payload.timestamps.map((event) => `${formatDateTime(event.occurredAt)}  +${formatElapsed(event.elapsedSeconds)}  ${event.label ?? "Timestamp"}`), y);
  y = writeLines(pdf, "Notes", payload.notes.map((note) => `${formatDateTime(note.createdAt)}  ${note.body}`), y);
  y = writeLines(pdf, "Photos", payload.photos.map((photo) => `${formatDateTime(photo.createdAt)}  ${photo.caption ?? "Photo evidence attached in app"}`), y);
  if (payload.session.summary) writeLines(pdf, "Summary", [payload.session.summary], y);
  pdf.save(filename);
}

function writeLines(pdf: jsPDF, heading: string, lines: string[], y: number) {
  if (!lines.length) return y;
  pdf.setFontSize(13);
  pdf.text(heading, 14, y);
  y += 7;
  pdf.setFontSize(9);
  lines.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, 178);
    if (y > 280) {
      pdf.addPage();
      y = 18;
    }
    pdf.text(wrapped, 14, y);
    y += wrapped.length * 5 + 2;
  });
  return y + 4;
}

async function exportDocx(payload: ExportPayload, filename: string) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: payload.session.title, bold: true, size: 32 })] }),
          new Paragraph(`Started: ${formatDateTime(payload.session.startedAt)}`),
          new Paragraph(`Duration: ${formatElapsed(payload.session.durationSeconds)}`),
          ...section("Timeline", payload.timestamps.map((event) => `${formatDateTime(event.occurredAt)} +${formatElapsed(event.elapsedSeconds)} ${event.label ?? "Timestamp"}`)),
          ...section("Notes", payload.notes.map((note) => `${formatDateTime(note.createdAt)} ${note.body}`)),
          ...section("Photos", payload.photos.map((photo) => `${formatDateTime(photo.createdAt)} ${photo.caption ?? "Photo evidence attached in app"}`)),
          ...section("Summary", payload.session.summary ? [payload.session.summary] : [])
        ]
      }
    ]
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

function section(title: string, lines: string[]) {
  if (!lines.length) return [];
  return [
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 24 })] }),
    ...lines.map((line) => new Paragraph(line))
  ];
}

function exportText(payload: ExportPayload, filename: string) {
  saveBlob(renderPlain(payload), filename, "text/plain;charset=utf-8");
}

function exportCsv(payload: ExportPayload, filename: string) {
  const rows = [["type", "datetime", "elapsed", "label_or_body"]];
  payload.timestamps.forEach((event) => rows.push(["timestamp", event.occurredAt, String(event.elapsedSeconds), event.label ?? ""]));
  payload.notes.forEach((note) => rows.push(["note", note.createdAt, "", note.body]));
  payload.photos.forEach((photo) => rows.push(["photo", photo.createdAt, "", photo.caption ?? "Photo"]));
  saveBlob(rows.map((row) => row.map(csvCell).join(",")).join("\n"), filename, "text/csv;charset=utf-8");
}

function renderPlain(payload: ExportPayload) {
  return [
    payload.session.title,
    `Started: ${formatDateTime(payload.session.startedAt)}`,
    `Duration: ${formatElapsed(payload.session.durationSeconds)}`,
    "",
    "Timeline",
    ...payload.timestamps.map((event) => `${formatDateTime(event.occurredAt)} +${formatElapsed(event.elapsedSeconds)} ${event.label ?? "Timestamp"}`),
    "",
    "Notes",
    ...payload.notes.map((note) => `${formatDateTime(note.createdAt)} ${note.body}`),
    "",
    "Photos",
    ...payload.photos.map((photo) => `${formatDateTime(photo.createdAt)} ${photo.caption ?? "Photo evidence attached in app"}`),
    "",
    "Summary",
    payload.session.summary ?? ""
  ].join("\n");
}

function saveBlob(content: string, filename: string, type: string) {
  saveAs(new Blob([content], { type }), filename);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function formatDateSlug(iso: string) {
  return iso.slice(0, 19).replaceAll("-", "").replaceAll(":", "").replaceAll("T", "");
}
