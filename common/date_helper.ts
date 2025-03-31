import { ENV_VARS } from "../env_vars";

export function toMonthISOString(date: Date): string {
  if (date.getUTCHours() < ENV_VARS.timezoneNegativeOffset) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  let year = date.getUTCFullYear().toString().padStart(4, "0");
  let month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}
