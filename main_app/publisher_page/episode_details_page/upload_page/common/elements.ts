import { SCHEME } from "../../../../../common/color_scheme";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../../common/icon_button";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_M,
  eFormTitle,
  ePageWithCenterForm,
} from "../../../../../common/page_elements";
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
    eFormTitle(title),
    ...children,
  );
}
