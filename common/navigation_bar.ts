import { Ref } from "@selfage/ref";
import { SCHEME } from "./color_scheme";
import { FONT_S, ICON_XL } from "./sizes";
import { E } from "@selfage/element/factory";

export let PAGE_NAVIGATION_PADDING_BOTTOM = 7; // rem

export function eNavigationItemRef(
  ref: Ref<HTMLDivElement>,
  icon: SVGSVGElement,
  label: string,
): HTMLDivElement {
  return E.divRef(
    ref,
    {
      class: "publisher-page-navigation-bar-home-button",
      style: `flex: 1 0 0; padding: .7rem 0 .3rem 0; display: flex; flex-flow: column nowrap; align-items: center; gap: .3rem; cursor: pointer;`,
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
        style: `background-color: ${SCHEME.neutral4}; box-shadow: 0 0 .3rem ${SCHEME.neutral1}; width: 100%; max-width: 60rem; border-top-left-radius: .5rem; border-top-right-radius: .5rem; display: flex; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "publisher-page-navigation-bar-level-one",
          style: `display: flex; flex-flow: row nowrap; gap: 1rem;`,
        },
        ...items,
      ),
    ),
  );
}
