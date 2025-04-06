import { ENV_VARS } from "../env_vars";

export function toDateWrtTimezone(date: Date): Date {
  if (date.getUTCHours() < ENV_VARS.timezoneNegativeOffset) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return date;
}

export function toDateISOString(date: Date): string {
  let year = date.getUTCFullYear().toString().padStart(4, "0");
  let month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  let day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toMonthISOString(date: Date): string {
  let year = date.getUTCFullYear().toString().padStart(4, "0");
  let month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

export function getLastMonth(date: Date): string {
  date = new Date(date);
  date.setUTCMonth(date.getUTCMonth() - 1);
  let year = date.getUTCFullYear().toString().padStart(4, "0");
  let month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

export function getFirstDayOfNextMonth(date: Date): string {
  date = new Date(date);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(1);
  let year = date.getUTCFullYear().toString().padStart(4, "0");
  let month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  let day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthDifference(startDate: Date, endDate: Date): number {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth() +
    1
  );
}
