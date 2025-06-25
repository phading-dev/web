import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { DateRangeInput, DateType } from "../../../common/date_range_input";
import { ExpandableLineItems } from "../../../common/expandable_line_items";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_L,
  ePageWithTopDownCard,
} from "../../../common/page_elements";
import { FONT_M, FONT_WEIGHT_600 } from "../../../common/sizes";
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
  public statementLines = new Array<ExpandableLineItems>();
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
    this.body = ePageWithTopDownCard(
      new Ref(),
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: 1rem 2rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem 2rem; display: flex; flex-flow: column nowrap;`,
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
        style: `flex: 0 0 auto; height: 1rem;`,
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
        style: `flex: 0 0 auto; height: 1.5rem;`,
      }),
      E.divRef(this.statementsList, {
        class: "statements-page-list",
        style: `display: flex; flex-flow: column nowrap; width: 100%; gap: 1rem;`,
      }),
    );
    this.monthRangeInput.val.setValues(
      startMonth.toLocalMonthISOString(),
      endMonth.toLocalMonthISOString(),
    );
    this.listStatements();

    this.monthRangeInput.val.on("change", () => this.listStatements());
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
    while (this.statementsList.val.lastElementChild) {
      this.statementsList.val.lastElementChild.remove();
    }
    this.statementLines.length = 0;

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
    let line = new ExpandableLineItems({
      totalLabel: statement.month,
      totalAmount:
        statement.totalAmount *
        (statement.totalAmountType === this.positiveAmountType ? 1 : -1),
      totalAmountCurrency: statement.currency,
      items: statement.items.map((item) => ({
        label: ProductID[item.productID],
        quantity: item.quantity,
        unit: item.unit,
        amount:
          item.amount * (item.amountType === this.positiveAmountType ? 1 : -1),
        currency: statement.currency,
      })),
    });
    this.statementsList.val.append(line.body);
    this.statementLines.push(line);
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
