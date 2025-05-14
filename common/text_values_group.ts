import { SCHEME } from "./color_scheme";
import { createArrowIcon } from "./icons";
import { FONT_M, ICON_M } from "./sizes";
import { E } from "@selfage/element/factory";

export function eTextValue(label: string, value?: string): HTMLDivElement {
  return E.div(
    {
      class: "text-value",
      style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 1rem;`,
    },
    E.div(
      {
        class: "text-value-label",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(label),
    ),
    E.div(
      {
        class: "text-value-value",
        style: `width: 100%; line-height: 2rem; font-size: ${FONT_M}rem; ${
          value ? "" : "height: 2rem;"
        } color: ${SCHEME.neutral0}; border-bottom: .1rem solid ${
          SCHEME.neutral1
        };`,
      },
      E.text(value),
    ),
  );
}

export function eValuesGroup(
  lines: Array<HTMLElement>,
  editable: boolean = true,
  customeStyle: string = "",
): HTMLDivElement {
  return E.div(
    {
      class: "text-values-group",
      style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 2rem; border: .1rem solid ${SCHEME.neutral1}; border-radius: .5rem; padding: 2rem; ${editable ? "cursor: pointer" : ""}; ${customeStyle}`,
    },
    E.div(
      {
        class: "text-values-group-lines",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: 2rem;`,
      },
      ...lines,
    ),
    E.div(
      {
        class: "text-values-group-edit-icon",
        style: `flex: 0 0 auto; height: ${ICON_M}rem; transform: rotate(180deg); visibility: ${editable ? "visible" : "hidden"};`,
      },
      createArrowIcon(SCHEME.neutral1),
    ),
  );
}
