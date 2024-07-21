// UTC timezone
export function toISODateString(date: Date): string {
  return toISODateString2(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

export function toISODateString2(
  year: number,
  month: number,
  day: number,
): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

// UTC timezone
export function toISOMonthString(date: Date): string {
  return toISOMonthString2(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

export function toISOMonthString2(year: number, month: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}
