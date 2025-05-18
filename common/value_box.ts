import { SCHEME } from "./color_scheme";
import { createArrowIcon } from "./icons";
import { FONT_M, ICON_M } from "./sizes";
import { E } from "@selfage/element/factory";

export let BOX_BORDER_RADIUS = 0.5; // rem

export function eLabelAndText(label: string, value?: string): HTMLDivElement {
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

export function eColumnBoxWithArrow(
  lines: Array<HTMLElement>,
  options: {
    clickable?: boolean;
    linesGap?: number; // in rem
    customeStyle?: string;
  } = {},
): HTMLDivElement {
  options.clickable = options.clickable ?? true;
  options.linesGap = options.linesGap ?? 2;
  options.customeStyle = options.customeStyle ?? "";
  return eBox(
    [
      E.div(
        {
          class: "box-lines",
          style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: ${options.linesGap}rem;`,
        },
        ...lines,
      ),
      E.div(
        {
          class: "box-edit-icon",
          style: `flex: 0 0 auto; height: ${ICON_M}rem; transform: rotate(180deg); visibility: ${options.clickable ? "visible" : "hidden"};`,
        },
        createArrowIcon(SCHEME.neutral1),
      ),
    ],
    {
      clickable: options.clickable,
      customeStyle: `display: flex; flex-flow: row nowrap; align-items: center; gap: 2rem; ${options.customeStyle}`,
    },
  );
}

export function eRowBoxWithArrow(
  children: Array<HTMLElement>,
  options: {
    clickable?: boolean;
    columnGap?: number; // in rem
    justifyContent?: string;
    customeStyle?: string;
  } = {},
): HTMLDivElement {
  options.clickable = options.clickable ?? true;
  options.columnGap = options.columnGap ?? 2;
  options.justifyContent = options.justifyContent ?? "space-between";
  options.customeStyle = options.customeStyle ?? "";
  return eBox(
    [
      ...children,
      E.div(
        {
          class: "box-edit-icon",
          style: `flex: 0 0 auto; height: ${ICON_M}rem; transform: rotate(180deg); visibility: ${options.clickable ? "visible" : "hidden"};`,
        },
        createArrowIcon(SCHEME.neutral1),
      ),
    ],
    {
      clickable: options.clickable,
      customeStyle: `display: flex; flex-flow: row nowrap; justify-content: ${options.justifyContent}; align-items: center; gap: ${options.columnGap}rem; ${options.customeStyle}`,
    },
  );
}

export function eBox(
  children: Array<HTMLElement>,
  options: {
    clickable?: boolean;
    customeStyle?: string;
  } = {},
): HTMLDivElement {
  options.clickable = options.clickable ?? true;
  options.customeStyle = options.customeStyle ?? "";
  return E.div(
    {
      class: "box",
      style: `border: .1rem solid ${options.clickable ? SCHEME.neutral1 : SCHEME.neutral2}; border-radius: ${BOX_BORDER_RADIUS}rem; padding: 2rem; ${options.clickable ? "cursor: pointer" : ""}; ${options.customeStyle}`,
    },
    ...children,
  );
}
