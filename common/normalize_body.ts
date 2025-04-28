import { SCHEME } from "./color_scheme";

export function normalizeBody() {
  document.documentElement.style.width = "100%";
  document.documentElement.style.height = "100%";
  document.documentElement.style.backgroundColor = SCHEME.neutral3;
  document.body.style.margin = "0";
  document.body.style.fontSize = "0";
  document.body.style.fontFamily = "sans-serif";
  document.body.style.width = "100%";
  document.body.style.height = "100%";

  window.removeEventListener("resize", setRootFontSize);
  setRootFontSize();
  window.addEventListener("resize", setRootFontSize);
}

function setRootFontSize() {
  if (window.innerWidth < 600) {
    document.documentElement.style.fontSize = "56.25%"; // 9px
  } else {
    document.documentElement.style.fontSize = "62.5%"; // 10px
  }
}
