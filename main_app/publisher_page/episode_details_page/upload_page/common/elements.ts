import { IconButton, createBackButton } from "../../../../../common/button";
import { SCHEME } from "../../../../../common/color_scheme";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../../common/navigation_bar";
import {
  eCenteredTitle,
  ePageWithCenterForm,
} from "../../../../../common/page_elements";
import { PAGE_MAX_WIDTH_M } from "../../../../../common/sizes";
import { Ref, assign } from "@selfage/ref";

export function ePage(
  backButton: Ref<IconButton>,
  title: string,
  ...children: Array<HTMLElement>
): HTMLDivElement {
  return ePageWithCenterForm(
    new Ref(),
    `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap;`,
    assign(backButton, createBackButton(SCHEME.neutral1)).body,
    eCenteredTitle(title),
    ...children,
  );
}
