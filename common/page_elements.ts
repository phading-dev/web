import { SCHEME } from "./color_scheme";
import { BORDER_RADIUS_M, FONT_L, GAP_2X, LINE_HEIGHT_L } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

// The container of a page needs to pre-define its width and height. E.g. a page container might set width: 100vw and height: 100vh;
export function ePageWithCenterForm(
  card: Ref<HTMLFormElement>,
  customPageStyle: string,
  customCardStyle: string,
  ...children: Array<Node>
): HTMLDivElement {
  return E.div(
    {
      class: "page",
      style: `width: 100%; min-height: 100%; box-sizing: border-box; display: flex; flex-flow: column nowrap; justify-content: center; align-items: center; ${customPageStyle}`,
    },
    E.formRef(
      card,
      {
        class: "page-center-card",
        style: `flex: 0 0 auto; box-sizing: border-box; width: 100%; padding: ${GAP_2X}rem; border-radius: ${BORDER_RADIUS_M}rem; background-color: ${SCHEME.neutral4}; position: relative; ${customCardStyle}`,
      },
      ...children,
    ),
  );
}

export function eFormTitle(text: string): HTMLDivElement {
  return E.div(
    {
      class: "input-form-title",
      style: `font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0}; text-align: center; align-self: center;`,
    },
    E.text(text),
  );
}

export function ePageWithTopDownCard(
  card: Ref<HTMLDivElement>,
  customStyle: string,
  ...children: Array<Node>
): HTMLDivElement {
  return E.div(
    {
      class: "page",
      style: `width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center;`,
    },
    E.divRef(
      card,
      {
        class: "page-top-down-card",
        style: `flex: 0 0 auto; box-sizing: border-box; width: 100%; min-height: 100%; background-color: ${SCHEME.neutral4}; position: relative; ${customStyle}`,
      },
      ...children,
    ),
  );
}

export function eFullPage(
  customStyle: string,
  ...elements: Array<HTMLElement>
): HTMLDivElement {
  return E.div(
    {
      class: "full-page",
      style: `width: 100%; min-height: 100%; background-color: ${SCHEME.neutral4}; box-sizing: border-box; display: flex; flex-flow: column nowrap; ${customStyle}`,
    },
    ...elements,
  );
}
