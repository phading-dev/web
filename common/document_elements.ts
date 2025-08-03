import { CLICKABLE_TEXT_STYLE } from "./button";
import { SCHEME } from "./color_scheme";
import { FONT_M, FONT_WEIGHT_600, FONT_XL, LINE_HEIGHT_M, LINE_HEIGHT_XL } from "./sizes";
import { E } from "@selfage/element/factory";

export function eDocumentPage(...children: Array<Node>): HTMLElement {
  return E.div(
    {
      class: "document-page",
      style: `padding: 1rem 2rem; background-color: ${SCHEME.neutral4};`,
    },
    ...children,
  );
}

export function eHeader1(text: string): HTMLElement {
  return E.div(
    {
      class: "header1",
      style: `margin: 1.5rem 0; font-size: ${FONT_XL}rem; line-height: ${LINE_HEIGHT_XL}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
    },
    E.text(text),
  );
}

export function eHeader2(text: string): HTMLElement {
  return E.div(
    {
      class: "header2",
      style: `margin: 1.5rem 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
    },
    E.text(text),
  );
}

export function eNormalText(text: string): Node {
  return E.text(text);
}

export function eBoldText(text: string): HTMLElement {
  return E.div(
    {
      class: "bold-text",
      style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
    },
    E.text(text),
  );
}

export function eLink(text: string, href: string): HTMLElement {
  return E.a(
    {
      class: "link",
      style: CLICKABLE_TEXT_STYLE,
      href,
    },
    E.text(text),
  );
}

export function eParagraph(...children: Array<Node>): HTMLElement {
  return E.div(
    {
      class: "paragraph",
      style: `margin: 1rem 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
    },
    ...children,
  );
}

export function eUl(...children: Array<Node>): HTMLElement {
  return E.ul(
    {
      class: "unordered-list",
      style: `margin: 0;`,
    },
    ...children,
  );
}

export function eOl(...children: Array<Node>): HTMLElement {
  return E.ol(
    {
      class: "ordered-list",
      style: `margin: 0;`,
    },
    ...children,
  );
}

export function eLi(...children: Array<Node>): HTMLElement {
  return E.li(
    {
      class: "list-item",
      style: `margin: 0; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
    },
    ...children,
  );
}

export function eTable(
  templateColumns: string,
  ...children: Array<Node>
): HTMLElement {
  return E.div(
    {
      class: "table",
      style: `margin: 1rem 0; display: grid; grid-template-columns: ${templateColumns}; border: .1rem solid ${SCHEME.neutral1}; border-radius: .5rem; overflow: hidden;`,
    },
    ...children,
  );
}

export function eTableHeaderItem(text: string): HTMLElement {
  return E.div(
    {
      class: "table-header-item",
      style: `padding: 1rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600}; background-color: ${SCHEME.neutral3};`,
    },
    E.text(text),
  );
}

export function eTableItem(text: string): HTMLElement {
  return E.div(
    {
      class: "table-item",
      style: `padding: 1rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; border-top: .1rem solid ${SCHEME.neutral1};`,
    },
    E.text(text),
  );
}
