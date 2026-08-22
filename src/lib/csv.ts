export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };

  return [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");
}

export function daysOverdue(dueDate: string, today = new Date()) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.floor((start.getTime() - due.getTime()) / 86_400_000);
}

export function exportToCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const csv = toCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Minimal, dependency-free RFC-4180-ish CSV parser. Handles quoted fields,
 * escaped quotes (""), and commas / newlines inside quotes. Returns a matrix
 * of rows with fully-empty rows dropped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, "\n").replace(/^﻿/, "");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Turn a parsed CSV matrix into objects keyed by a normalized header, resolving
 * common column aliases to canonical field names.
 */
export function csvRowsToObjects(
  matrix: string[][],
  aliases: Record<string, string>,
): Array<Record<string, string>> {
  if (matrix.length < 2) return [];
  const normalize = (h: string) =>
    h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  const header = matrix[0].map((h) => {
    const key = normalize(h);
    return aliases[key] ?? key;
  });

  return matrix.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((field, idx) => {
      if (!field) return;
      obj[field] = (cells[idx] ?? "").trim();
    });
    return obj;
  });
}


