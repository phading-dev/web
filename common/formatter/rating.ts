export let RATING_FORMATTER = new Intl.NumberFormat([navigator.language], {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export let RATINGS_COUNT_FORMATTER = new Intl.NumberFormat(
  [navigator.language],
  {
    notation: "compact",
    compactDisplay: "short",
  },
);
