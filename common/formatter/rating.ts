let RATING_FORMATTER = new Intl.NumberFormat([navigator.language], {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

let RATINGS_COUNT_SHORT_FORMATTER = new Intl.NumberFormat(
  [navigator.language],
  {
    notation: "compact",
    compactDisplay: "short",
  },
);

let RATINGS_COUNT_LONG_FORMATTER = new Intl.NumberFormat(
  [navigator.language],
  {},
);

export function formatRating(rating: number): string {
  return RATING_FORMATTER.format(rating);
}

export function formatRatingsCountShort(count: number): string {
  return RATINGS_COUNT_SHORT_FORMATTER.format(count);
}

export function formatRatingsCountLong(count: number): string {
  return RATINGS_COUNT_LONG_FORMATTER.format(count);
}
