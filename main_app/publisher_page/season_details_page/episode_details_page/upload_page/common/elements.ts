import { SCHEME } from "../../../../../../common/color_scheme";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../../../common/icon_button";
import {
  PAGE_CENTER_CARD_BACKGROUND_STYLE,
  PAGE_MEDIUM_CENTER_CARD_STYLE,
} from "../../../../../../common/page_style";
import { FONT_L } from "../../../../../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export function ePage(
  backButton: Ref<SimpleIconButton>,
  title: string,
  ...children: Array<HTMLElement>
): HTMLDivElement {
  return E.div(
    {
      class: "upload-page",
      style: PAGE_CENTER_CARD_BACKGROUND_STYLE,
    },
    E.div(
      {
        class: "upload-page-card",
        style: `${PAGE_MEDIUM_CENTER_CARD_STYLE} display: flex; flex-flow: column nowrap;`,
      },
      assign(backButton, createBackButton(SCHEME.neutral1)).body,
      E.div(
        {
          class: "upload-page-title",
          style: `align-self: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; max-width: 80%;`,
        },
        E.text(title),
      ),
      ...children,
    ),
  );
}
