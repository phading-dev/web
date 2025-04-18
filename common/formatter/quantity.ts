let WATCH_TIME_SECONDS_FORMATTER = new Intl.NumberFormat(
  [navigator.language],
  {
    style: "unit",
    unit: "second",
    unitDisplay: "short"
  },
);

let QUANTITY_FORMATTER = new Intl.NumberFormat(
  [navigator.language],
  {
    style: "decimal",
  },
);

export function formatWatchTimeSeconds(seconds: number): string {
  return WATCH_TIME_SECONDS_FORMATTER.format(seconds);
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${QUANTITY_FORMATTER.format(quantity)} ${unit}`;
}

