import { SCHEME } from "./color_scheme";
import { formatMoney } from "./formatter/price";
import { formatQuantity } from "./formatter/quantity";
import { createArrowIcon, createCornerIcon } from "./icons";
import { FONT_M, ICON_S, ICON_XS } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface LineItemData {
  label: string;
  quantity: number;
  unit: string;
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
        E.divRef(
          this.totalLine,
          {
            class: "line-items-total",
            style: `width: 100%; display: flex; flex-flow: row nowrap; align-items: center; cursor: pointer;`,
          },
          E.divRef(
            this.expandIcon,
            {
              class: "line-items-expand-button",
              style: `height: ${ICON_S}rem; transition: transform .2s;`,
            },
            createArrowIcon(SCHEME.neutral1),
          ),
          E.div({
            style: `flex: 0 0 auto; width: 1rem;`,
          }),
          E.div(
            {
              class: "line-items-total-label",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(data.totalLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: 1rem;`,
          }),
          E.div(
            {
              class: "line-items-total-amount",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(formatMoney(data.totalAmount, data.totalAmountCurrency)),
          ),
          E.div({
            style: `flex: 1 0 auto; width: 5rem;`,
          }),
        ),
        E.divRef(
          this.lineItemList,
          {
            class: "line-items-list",
            style: `padding: 1rem 0 0 .5rem; width: 100%; box-sizing: border-box; flex-flow: column nowrap; gap: 1rem; transition: height .2s; overflow: hidden;`,
          },
          ...data.items.map((item) => {
            return E.div(
              {
                class: "line-items-item",
                style: `width: 100%; display: flex; flex-flow: row nowrap; align-items: flex-start;`,
              },
              E.div(
                {
                  class: "line-items-item-leading-line",
                  style: `height: ${ICON_XS}rem; padding-bottom: .6rem;`,
                },
                createCornerIcon(SCHEME.neutral1),
              ),
              E.div({
                style: `flex: 0 0 auto; width: 1rem;`,
              }),
              E.div(
                {
                  class: "line-items-item-product-id",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(item.label),
              ),
              E.div({
                style: `flex: 1 0 auto; width: 1rem;`,
              }),
              E.div(
                {
                  class: "line-items-item-amount",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(formatMoney(item.amount, item.currency)),
              ),
              E.div({
                style: `flex: 1 0 auto; width: 1rem;`,
              }),
              E.div(
                {
                  class: "line-items-item-quantity",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: end;`,
                },
                E.text(formatQuantity(item.quantity, item.unit)),
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
