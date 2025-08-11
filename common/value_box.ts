import { SCHEME } from "./color_scheme";
import { createArrowIcon } from "./icons";
import { BORDER_RADIUS_S, BORDER_WIDTH_1, FONT_M, FONT_S, GAP_1X, GAP_0_25X, ICON_M, LINE_HEIGHT_M, LINE_HEIGHT_S } from "./sizes";
import { E } from "@selfage/element/factory";

export function eLabelAndText(label: string, value?: string): HTMLDivElement {
  return E.div(
    {
      class: "label-and-text",
      style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_0_25X}rem;`,
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
    customStyle?: string;
  } = {},
): HTMLDivElement {
  options.clickable = options.clickable ?? true;
  options.linesGap = options.linesGap ?? GAP_1X;
  options.customStyle = options.customStyle ?? "";
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
      customStyle: `display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_1X}rem; ${options.customStyle}`,
    },
  );
}

export function eRowBoxWithArrow(
  children: Array<HTMLElement>,
  options: {
    clickable?: boolean;
    columnGap?: number; // in rem
    justifyContent?: string;
    customStyle?: string;
  } = {},
): HTMLDivElement {
  options.clickable = options.clickable ?? true;
  options.columnGap = options.columnGap ?? GAP_1X;
  options.justifyContent = options.justifyContent ?? "flex-start";
  options.customStyle = options.customStyle ?? "";
  return eBox(
    [
      E.div(
        {
          class: "box-lines",
          style: `flex: 1 0 0; display: flex; flex-flow: row nowrap; gap: ${options.columnGap}rem; align-items: center; justify-content: ${options.justifyContent};`,
        },
      ...children,
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
      customStyle: `display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_1X}rem; ${options.customStyle}`,
    },
  );
}

export function eBox(
  children: Array<HTMLElement>,
  options: {
    clickable?: boolean;
    customStyle?: string;
  } = {},
): HTMLDivElement {
  options.clickable = options.clickable ?? true;
  options.customStyle = options.customStyle ?? "";
  return E.div(
    {
      class: "box",
      style: `border: ${BORDER_WIDTH_1}rem solid ${options.clickable ? SCHEME.neutral1 : SCHEME.neutral2}; border-radius: ${BORDER_RADIUS_S}rem; padding: ${GAP_1X}rem; ${options.clickable ? "cursor: pointer; pointer-events: none;" : ""} ${options.customStyle}`,
    },
    ...children,
  );
}
