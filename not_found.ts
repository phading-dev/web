import { SCHEME } from "./common/color_scheme";
import { normalizeBody } from "./common/normalize_body";
import { FONT_L } from "./common/sizes";
import { E } from "@selfage/element/factory";

async function main(): Promise<void> {
  normalizeBody();
  document.body.append(
    E.div(
      {
        style: `width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;`,
      },
      E.div(
        {
          style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
        },
        E.text("404 Not Found"),
      ),
    ),
  );
}

main();
