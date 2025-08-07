import { SCHEME } from "./color_scheme";
import { formatMoney } from "./formatter/price";
import { createArrowIcon } from "./icons";
import {
  BORDER_WIDTH_2,
  FONT_M,
  GAP_0_75X,
  ICON_S,
  LINE_HEIGHT_M,
} from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export function eThreeColumns(
  label: string,
  value1: string,
  value2: string = "",
): Array<HTMLDivElement> {
  return [
    E.div(
      {
        class: "row-column-label",
        style: `flex: 1 0 0; overflow-wrap: anywhere; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(label),
    ),
    E.div(
      {
        style: `flex: 1 0 0; display: flex; flex-flow: row nowrap;`,
      },
      E.div({
        style: `flex: 1 0 0;`,
      }),
      E.div(
        {
          class: "row-column-value-1",
          style: `overflow-wrap: anywhere; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(value1),
      ),
    ),
    E.div(
      {
        style: `flex: 1 0 0; display: flex; flex-flow: row nowrap;`,
      },
      E.div({
        style: `flex: 1 0 0;`,
      }),
      E.div(
        {
          class: "row-column-value-2",
          style: `overflow-wrap: anywhere; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(value2),
      ),
    ),
  ];
}

export function eLineItemRow(
  customStyle: string,
  ...children: Array<HTMLDivElement>
): HTMLDivElement {
  return E.div(
    {
      class: "row-three-column",
      style: `width: 100%; box-sizing: border-box; display: flex; flex-flow: row nowrap; align-items: flex-start; gap: ${GAP_0_75X}rem; ${customStyle}`,
    },
    ...children,
  );
}

export interface LineItemData {
  label: string;
  amount: number;
  currency: string;
}

export interface LineItemsData {
  totalLabel: string;
  totalAmount: number;
  totalAmountCurrency: string;
  items: Array<LineItemData>;
}

export class ExpandableLineItems {
  public body: HTMLDivElement;
  public totalLine = new Ref<HTMLDivElement>();
  private expandIcon = new Ref<HTMLDivElement>();
  private lineItemList = new Ref<HTMLDivElement>();

  public constructor(data: LineItemsData) {
    this.body = E.div(
      {},
      E.div(
        {
          class: "line-items-container",
          style: `width: 100%; display: flex; flex-flow: column nowrap;`,
        },
        assign(
          this.totalLine,
          eLineItemRow(
            "cursor: pointer;",
            E.divRef(
              this.expandIcon,
              {
                class: "line-items-expand-button",
                style: `flex: 0 0 auto; height: ${LINE_HEIGHT_M}rem; width: ${LINE_HEIGHT_M}rem; box-sizing: border-box; padding: ${(LINE_HEIGHT_M - ICON_S) / 2}rem; transition: transform .2s;`,
              },
              createArrowIcon(SCHEME.neutral1),
            ),
            ...eThreeColumns(
              data.totalLabel,
              formatMoney(data.totalAmount, data.totalAmountCurrency),
            ),
          ),
        ),
        E.divRef(
          this.lineItemList,
          {
            class: "line-items-list",
            style: `padding-left: ${(LINE_HEIGHT_M - BORDER_WIDTH_2) / 2}rem; width: 100%; box-sizing: border-box; flex-flow: column nowrap; transition: height .2s; overflow: hidden;`,
          },
          ...data.items.map((item) => {
            return eLineItemRow(
              `border-left: ${BORDER_WIDTH_2}rem solid ${SCHEME.neutral1}; padding-left: ${(LINE_HEIGHT_M - BORDER_WIDTH_2) / 2 + GAP_0_75X}rem;`,
              ...eThreeColumns(
                item.label,
                formatMoney(item.amount, item.currency),
              ),
            );
          }),
        ),
      ),
    );
    this.hideLineItemList(this.expandIcon.val, this.lineItemList.val);
    this.totalLine.val.addEventListener("click", () => {
      if (this.lineItemList.val.style.display === "none") {
        this.showLineItemList(this.expandIcon.val, this.lineItemList.val);
      } else {
        this.hideLineItemList(this.expandIcon.val, this.lineItemList.val);
      }
    });
    this.lineItemList.val.addEventListener("transitionend", () => {
      this.lineItemList.val.style.height = `auto`;
    });
  }

  private showLineItemList(
    expandIcon: HTMLDivElement,
    lineItemList: HTMLDivElement,
  ): void {
    expandIcon.style.transform = "rotate(-90deg)";
    lineItemList.style.display = "flex";
    lineItemList.style.height = `${lineItemList.scrollHeight}px`;
  }

  private hideLineItemList(
    expandIcon: HTMLDivElement,
    lineItemList: HTMLDivElement,
  ): void {
    expandIcon.style.transform = "rotate(-180deg)";
    lineItemList.style.display = "none";
    lineItemList.style.height = "0px";
  }

  public click(): void {
    this.totalLine.val.click();
  }
}
