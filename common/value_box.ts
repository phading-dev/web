import { SCHEME } from "./color_scheme";
import { createArrowIcon } from "./icons";
import { BORDER_RADIUS_S, BORDER_WIDTH_1, FONT_M, FONT_S, GAP_1X, GAP_d_25X, ICON_M, LINE_HEIGHT_M, LINE_HEIGHT_S } from "./sizes";
import { E } from "@selfage/element/factory";

export function eLabelAndText(label: string, value?: string): HTMLDivElement {
  return E.div(
    {
      class: "label-and-text",
      style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_d_25X}rem;`,
    },
    E.div(
      {
        class: "label-and-text-label",
        style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
      },
      E.text(label),
    ),
    E.div(
      {
        class: "label-and-text-value",
        style: `width: 100%; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${value ? SCHEME.neutral0 : SCHEME.neutral2}; ${value ? "" : "font-style: italic;"} `,
      },
      E.text(value ? value : "Empty"),
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
  options.linesGap = options.linesGap ?? GAP_1X;
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
      customeStyle: `display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_1X}rem; ${options.customeStyle}`,
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
  options.columnGap = options.columnGap ?? GAP_1X;
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
      style: `border: ${BORDER_WIDTH_1}rem solid ${options.clickable ? SCHEME.neutral1 : SCHEME.neutral2}; border-radius: ${BORDER_RADIUS_S}rem; padding: ${GAP_1X}rem; ${options.clickable ? "cursor: pointer" : ""}; ${options.customeStyle}`,
    },
    ...children,
  );
}
