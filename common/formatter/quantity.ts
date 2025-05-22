let WATCH_TIME_SECONDS_FORMATTER = new Intl.NumberFormat([navigator.language], {
  style: "unit",
  unit: "second",
  unitDisplay: "short",
});

let STORAGE_GIB_FORMATTER = new Intl.NumberFormat([navigator.language], {
  maximumSignificantDigits: 3,
});

let QUANTITY_FORMATTER = new Intl.NumberFormat([navigator.language], {
  style: "decimal",
});

export function formatWatchTimeSeconds(seconds: number): string {
  return WATCH_TIME_SECONDS_FORMATTER.format(seconds);
}

export function formatBytesShort(bytes: number): string {
  let value = bytes;
  if (value >= 1024) {
    value /= 1024; // KiB
    if (value >= 1024) {
      value /= 1024; // MiB
      if (value >= 1024) {
        value /= 1024; // GiB
        return `${STORAGE_GIB_FORMATTER.format(value)} GiB`;
      } else {
        return `${STORAGE_GIB_FORMATTER.format(value)} MiB`;
      }
    } else {
      return `${STORAGE_GIB_FORMATTER.format(value)} KiB`;
    }
  } else {
    return `${STORAGE_GIB_FORMATTER.format(value)} B`;
  }
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${QUANTITY_FORMATTER.format(quantity)} ${unit}`;
}
