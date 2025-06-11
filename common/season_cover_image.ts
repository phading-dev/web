import { SCHEME } from "./color_scheme";
import { LOCALIZED_TEXT } from "./locales/localized_text";
import { FONT_L } from "./sizes";
import { E } from "@selfage/element/factory";

export function eCoverImage(width: string, src?: string): HTMLElement {
  if (src) {
    return E.image({
      class: "season-cover-image",
      style: `width: ${width}; aspect-ratio: 2/3; object-fit: contain;`,
      src,
    });
  } else {
    return E.div(
      {
        class: "sesason-no-cover-image",
        style: `width: ${width}; aspect-ratio: 2/3; box-sizing: border-box; padding: 1rem; border: .1rem solid ${SCHEME.neutral1}; display: flex; justify-content: center; align-items: center; text-align: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(LOCALIZED_TEXT.noCoverImage),
    );
  }
}
