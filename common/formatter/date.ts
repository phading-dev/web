export function formatPremieredTime(timestampMs: number): string {
  let formatter = new Intl.DateTimeFormat([navigator.language], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
  });
  return formatter.format(new Date(timestampMs));
}

export function formatUpcomingPremiereTime(timestampMs: number): string {
  let formatter = new Intl.DateTimeFormat([navigator.language], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return formatter.format(new Date(timestampMs));
}
