import { SCHEME } from "../../../../../../common/color_scheme";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../../../common/icon_button";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_M,
  ePageWithCenterForm,
} from "../../../../../../common/page_elements";
import { FONT_L } from "../../../../../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export function ePage(
  backButton: Ref<SimpleIconButton>,
  title: string,
  ...children: Array<HTMLElement>
): HTMLDivElement {
  return ePageWithCenterForm(
    new Ref(),
    `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap;`,
    assign(backButton, createBackButton(SCHEME.neutral1)).body,
    E.div(
      {
        class: "upload-page-title",
        style: `align-self: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; max-width: 80%;`,
      },
      E.text(title),
    ),
    ...children,
  );
}
