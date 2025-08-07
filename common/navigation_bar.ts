import { SCHEME } from "./color_scheme";
import {
  BORDER_RADIUS_S,
  BORDER_WIDTH_2,
  FONT_S,
  GAP_5X,
  GAP_0_25X,
  GAP_0_5X,
  GAP_0_75X,
  ICON_XL,
  PAGE_MAX_WIDTH_M,
} from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export let PAGE_NAVIGATION_PADDING_BOTTOM = GAP_5X;

export function eNavigationItemRef(
  ref: Ref<HTMLDivElement>,
  icon: SVGSVGElement,
  label: string,
): HTMLDivElement {
  return E.divRef(
    ref,
    {
      class: "publisher-page-navigation-bar-home-button",
      style: `flex: 1 0 0; padding: ${GAP_0_5X}rem 0 ${GAP_0_25X}rem 0; display: flex; flex-flow: column nowrap; align-items: center; gap: ${GAP_0_25X}rem; cursor: pointer;`,
    },
    E.div(
      {
        class: "publisher-page-navigation-bar-home-icon",
        style: `width: ${ICON_XL}rem; height: ${ICON_XL}rem;`,
      },
      icon,
    ),
    E.div(
      {
        class: "publisher-page-navigation-bar-home-text",
        style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(label),
    ),
  );
}

export function eBottomNavigationBarRef(
  ref: Ref<HTMLDivElement>,
  ...items: Array<HTMLDivElement>
): HTMLDivElement {
  return E.divRef(
    ref,
    {
      class: "publisher-page-navigation-bar-parent",
      style: `position: fixed; left: 0; bottom: 0; z-index: 1; width: 100%; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center;`,
    },
    E.div(
      {
        class: "publisher-page-navigation-bar-content-container",
        style: `background-color: ${SCHEME.neutral4}; box-shadow: 0 0 ${BORDER_WIDTH_2}rem ${SCHEME.neutral1}; width: 100%; max-width: ${PAGE_MAX_WIDTH_M}rem; border-top-left-radius: ${BORDER_RADIUS_S}rem; border-top-right-radius: ${BORDER_RADIUS_S}rem; display: flex; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "publisher-page-navigation-bar-level-one",
          style: `display: flex; flex-flow: row nowrap; gap: ${GAP_0_75X}rem;`,
        },
        ...items,
      ),
    ),
  );
}
