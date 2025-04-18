let RATING_FORMATTER = new Intl.NumberFormat([navigator.language], {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

let RATINGS_COUNT_FORMATTER = new Intl.NumberFormat([navigator.language], {
  notation: "compact",
  compactDisplay: "short",
});

export function formatRating(rating: number): string {
  return RATING_FORMATTER.format(rating);
}

export function formatRatingsCount(count: number): string {
  return RATINGS_COUNT_FORMATTER.format(count);
}
