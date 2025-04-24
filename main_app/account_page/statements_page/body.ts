import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { DateRangeInput, DateType } from "../../../common/date_range_input";
import { formatMoney } from "../../../common/formatter/price";
import { formatQuantity } from "../../../common/formatter/quantity";
import { createArrowIcon, createCornerIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_CARD_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../common/page_style";
import {
  FONT_M,
  FONT_WEIGHT_600,
  ICON_S,
  ICON_XS,
} from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import { newListTransactionStatementsRequest } from "@phading/commerce_service_interface/web/statements/client";
import { TransactionStatement } from "@phading/commerce_service_interface/web/statements/transaction_statement";
import { MAX_MONTH_RANGE } from "@phading/constants/commerce";
import { ProductID } from "@phading/price";
import { AmountType } from "@phading/price/amount_type";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";

export interface StatementsPage {
  on(event: "listed", listener: () => void): this;
}

export class StatementsPage extends EventEmitter {
  public static create(canEarn: boolean): StatementsPage {
    return new StatementsPage(SERVICE_CLIENT, () => new Date(), canEarn);
  }

  private static INIT_MONTHS = 5;

  public body: HTMLDivElement;
  public monthRangeInput = new Ref<DateRangeInput>();
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
    let nowDate = TzDate.fromDate(
      this.getNowDate(),
      ENV_VARS.timezoneNegativeOffset,
    );
    let endMonth = nowDate.clone().moveToFirstDayOfMonth().addMonths(-1);
    let startMonth = endMonth.clone().addMonths(-StatementsPage.INIT_MONTHS);
    this.body = E.div(
      {
        class: "statements-page",
        style: PAGE_CARD_BACKGROUND_STYLE,
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
          DateRangeInput.create(
            DateType.MONTH,
            MAX_MONTH_RANGE,
            `width: 100%;`,
          ).show(),
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
    this.monthRangeInput.val.setValues(
      startMonth.toLocalMonthISOString(),
      endMonth.toLocalMonthISOString(),
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
    let { startRange, endRange } = this.monthRangeInput.val.getValues();
    let response = await this.serviceClient.send(
      newListTransactionStatementsRequest({
        startMonth: startRange,
        endMonth: endRange,
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
      response.statements.sort((a, b) => {
        if (a.month < b.month) {
          return -1;
        } else if (a.month > b.month) {
          return 1;
        } else {
          return 0;
        }
      });
      for (let statement of response.statements) {
        this.createStatementLine(statement);
      }
    }
    this.emit("listed");
  }

  private createStatementLine(statement: TransactionStatement): void {
    let statementLine = new Ref<HTMLDivElement>();
    let expandIcon = new Ref<HTMLDivElement>();
    let lineItemList = new Ref<HTMLDivElement>();
    this.statementsList.val.append(
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
            E.text(
              formatMoney(
                statement.totalAmount *
                  (statement.totalAmountType === this.positiveAmountType
                    ? 1
                    : -1),
                statement.currency,
              ),
            ),
          ),
        ),
        E.divRef(
          lineItemList,
          {
            class: "statements-page-line-item-list",
            style: `padding: 1rem 1rem 0 2rem; width: 100%; box-sizing: border-box; flex-flow: column nowrap; gap: 1rem; transition: height .2s; overflow: hidden;`,
          },
          ...statement.items.map((item) => {
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
                E.text(formatQuantity(item.quantity, item.unit)),
              ),
              E.div(
                {
                  class: "statements-page-line-item-amount",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; flex: 1 0 auto; text-align: end;`,
                },
                E.text(
                  formatMoney(
                    item.amount *
                      (item.amountType === this.positiveAmountType ? 1 : -1),
                    statement.currency,
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
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
