export function normalize(name: string): Array<string> {
  return name
    .normalize("NFC")
    .replace(/[\uFF08\uFF09]/g, " ") // Full-width parentheses
    .replace(/[\u2010-\u2015\u2212\u30FC]/g, " ") // Hyphens and dashes
    .replace(/\u3000/g, " ") // Full-width space
    .replace(/[\s\-()_]+/g, " ")
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 0);
}

export function score(normalizedTarget: Array<string>, option: string): number {
  let normalizedOption = normalize(option);
  let score = 0;
  normalizedTarget.forEach((word) => {
    if (normalizedOption.includes(word)) {
      score++;
    }
  });
  return score;
}

export function fuzzyMatch(
  target: string,
  options: Array<string>,
  defaultOption: string,
): string {
  let normalizedTarget = normalize(target);
  let highestScore = 0;
  let highestIndex = 0;
  options.forEach((option, index) => {
    let scored = score(normalizedTarget, option);
    if (scored > highestScore) {
      highestScore = scored;
      highestIndex = index;
    }
  });
  return highestScore > 0 ? options[highestIndex] : defaultOption;
}
