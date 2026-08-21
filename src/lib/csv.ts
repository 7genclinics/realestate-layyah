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

