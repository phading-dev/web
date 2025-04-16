import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { getLastMonth, toDateWrtTimezone } from "../../../common/date_helper";
import { createArrowIcon, createCornerIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_M, FONT_WEIGHT_600, ICON_S, ICON_XS } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { MonthRangeInput } from "../common/month_range_input";
import { newListTransactionStatementsRequest } from "@phading/commerce_service_interface/web/statements/client";
import { TransactionStatement } from "@phading/commerce_service_interface/web/statements/transaction_statement";
import { ProductID } from "@phading/price";
import { AmountType } from "@phading/price/amount_type";
import { CURRENCY_TO_CENTS } from "@phading/price_config/amount_conversion";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface StatementsPage {
  on(event: "listed", listener: () => void): this;
}

export class StatementsPage extends EventEmitter {
  public static create(canEarn: boolean): StatementsPage {
    return new StatementsPage(SERVICE_CLIENT, () => new Date(), canEarn);
  }

  public body: HTMLDivElement;
  public monthRangeInput = new Ref<MonthRangeInput>();
  public statementsList = new Ref<HTMLDivElement>();
  public statementLines = new Array<HTMLDivElement>();
  private listRequestIndex = 0;
  private positiveAmountType: AmountType;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    private canEarn: boolean,
  ) {
    super();
    this.positiveAmountType = this.canEarn
      ? AmountType.CREDIT
      : AmountType.DEBIT;
    let nowDate = this.getNowDate();
    let startMonth = getLastMonth(toDateWrtTimezone(nowDate));
    let endMonth = startMonth;
    this.body = E.div(
      {
        class: "statements-page",
        style: PAGE_BACKGROUND_STYLE,
      },
      E.div(
        {
          class: "statements-page-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "statements-page-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(
            canEarn
              ? LOCALIZED_TEXT.earningsStatementsTitle
              : LOCALIZED_TEXT.billingStatementsTitle,
          ),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        assign(
          this.monthRangeInput,
          MonthRangeInput.create(startMonth, endMonth),
        ).body,
        E.div({
          style: `height: 1.5rem;`,
        }),
        E.divRef(this.statementsList, {
          class: "statements-page-list",
          style: `display: flex; flex-flow: column nowrap; width: 100%; gap: 1rem;`,
        }),
      ),
    );
    this.listStatements();

    this.monthRangeInput.val.on("input", () => this.listStatements());
    this.monthRangeInput.val.on("invalid", () => this.showInvalidRange());
  }

  private showInvalidRange(): void {
    this.listRequestIndex++;
    while (this.statementsList.val.lastElementChild) {
      this.statementsList.val.lastElementChild.remove();
    }
    this.statementsList.val.append(
      E.div(
        {
          class: "statements-page-invalid-activity-range",
          style: `width: 100%; text-align: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.invaliRange),
      ),
    );
  }

  private async listStatements(): Promise<void> {
    this.listRequestIndex++;
    let currentIndex = this.listRequestIndex;
    let { startMonth, endMonth } = this.monthRangeInput.val.getValues();
    let response = await this.serviceClient.send(
      newListTransactionStatementsRequest({
        startMonth,
        endMonth,
      }),
    );
    if (currentIndex !== this.listRequestIndex) {
      // A new request has been made. Abort any changes.
      return;
    }
    while (this.statementsList.val.lastElementChild) {
      this.statementsList.val.lastElementChild.remove();
    }
    if (response.statements.length === 0) {
      this.statementsList.val.append(
        E.div(
          {
            class: "statements-page-no-results",
            style: `width: 100%; text-align: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.noStatements),
        ),
      );
    } else {
      for (let statement of response.statements) {
        this.statementsList.val.append(...this.createStatementLine(statement));
      }
    }
    this.emit("listed");
  }

  private createStatementLine(
    statement: TransactionStatement,
  ): Array<HTMLDivElement> {
    let numberFormatter = new Intl.NumberFormat([navigator.language, "en-US"], {
      style: "decimal",
    });
    let currencyFormatter = new Intl.NumberFormat(
      [navigator.language, "en-US"],
      {
        style: "currency",
        currency: statement.currency,
      },
    );
    let totalAmount = currencyFormatter.format(
      (statement.totalAmount / CURRENCY_TO_CENTS.get(statement.currency)) *
        (statement.totalAmountType === this.positiveAmountType ? 1 : -1),
    );
    let statementLine = new Ref<HTMLDivElement>();
    let expandIcon = new Ref<HTMLDivElement>();
    let lineItemList = new Ref<HTMLDivElement>();
    let elements = [
      E.div(
        {
          class: "statements-page-statement-item-container",
          style: `width: 100%; display: flex; flex-flow: column nowrap;`,
        },
        E.divRef(
          statementLine,
          {
            class: "statements-page-statement",
            style: `padding: 0 1rem; width: 100%; box-sizing: border-box; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem; cursor: pointer;`,
          },
          E.divRef(
            expandIcon,
            {
              class: "statements-page-expand-button",
              style: `height: ${ICON_S}rem; transition: transform .2s;`,
            },
            createArrowIcon(SCHEME.neutral1),
          ),
          E.div(
            {
              class: "statements-page-month",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(statement.month),
          ),
          E.div(
            {
              class: "statements-page-amount",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; flex: 1 0 auto; text-align: end;`,
            },
            E.text(totalAmount),
          ),
        ),
        E.divRef(
          lineItemList,
          {
            class: "statements-page-line-item-list",
            style: `padding: 1rem 1rem 0 2rem; width: 100%; box-sizing: border-box; flex-flow: column nowrap; gap: 1rem; transition: height .2s; overflow: hidden;`,
          },
          ...statement.items.map((item) => {
            let amount = currencyFormatter.format(
              (item.amount / CURRENCY_TO_CENTS.get(statement.currency)) *
                (item.amountType === this.positiveAmountType ? 1 : -1),
            );
            return E.div(
              {
                class: "statements-page-line-item",
                style: `width: 100%; display: flex; flex-flow: row wrap; align-items: center; gap: 1rem;`,
              },
              E.div(
                {
                  class: "statements-page-line-item-leading-line",
                  style: `height: ${ICON_XS}rem; padding: 0 0 .6rem 0;`,
                },
                createCornerIcon(SCHEME.neutral1),
              ),
              E.div(
                {
                  class: "statements-page-line-item-product-id",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(ProductID[item.productID]),
              ),
              E.div(
                {
                  class: "statements-page-line-item-quantity",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; flex: 3 0 auto; text-align: end;`,
                },
                E.text(`${numberFormatter.format(item.quantity)} ${item.unit}`),
              ),
              E.div(
                {
                  class: "statements-page-line-item-amount",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; flex: 1 0 auto; text-align: end;`,
                },
                E.text(amount),
              ),
            );
          }),
        ),
      ),
    ];
    this.statementLines.push(statementLine.val);
    this.hideLineItemList(expandIcon.val, lineItemList.val);

    statementLine.val.addEventListener("click", () => {
      if (lineItemList.val.style.display === "none") {
        this.showLineItemList(expandIcon.val, lineItemList.val);
      } else {
        this.hideLineItemList(expandIcon.val, lineItemList.val);
      }
    });
    lineItemList.val.addEventListener("transitionend", () => {
      lineItemList.val.style.height = `auto`;
    });
    return elements;
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

  public remove(): void {
    this.body.remove();
  }
}
