export function getRootFontSize(): number {
  return parseInt(
    window
      .getComputedStyle(window.document.documentElement)
      .fontSize.replace("px", ""),
  );
}
