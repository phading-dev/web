import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import {
  getLastMonth,
  getMonthDifference,
  toDateWrtTimezone,
} from "../../../common/date_helper";
import { BASIC_INPUT_STYLE } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_M, FONT_WEIGHT_600 } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  newGetEarningsProfileInfoRequest,
  newListPayoutsRequest,
} from "@phading/commerce_service_interface/web/earnings/client";
import { LinkType } from "@phading/commerce_service_interface/web/earnings/interface";
import { PayoutState } from "@phading/commerce_service_interface/web/earnings/payout";
import { MAX_MONTH_RANGE } from "@phading/constants/commerce";
import { CURRENCY_TO_CENTS } from "@phading/price_config/amount_conversion";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface EarningsPage {
  on(event: "listed", listener: () => void): this;
}

export class EarningsPage extends EventEmitter {
  public static create(): EarningsPage {
    return new EarningsPage(SERVICE_CLIENT, () => new Date());
  }

  public body: HTMLDivElement;
  public startMonthInput = new Ref<HTMLInputElement>();
  public endMonthInput = new Ref<HTMLInputElement>();
  public payoutActivityList = new Ref<HTMLDivElement>();
  private listRequestIndex = 0;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = E.div({
      class: "earnings-page",
      style: PAGE_BACKGROUND_STYLE,
    });
    this.load();
  }

  private async load() {
    let response = await this.serviceClient.send(
      newGetEarningsProfileInfoRequest({}),
    );
    let nowDate = this.getNowDate();
    let startMonth = getLastMonth(toDateWrtTimezone(nowDate));
    let endMonth = startMonth;
    this.body.appendChild(
      E.div(
        {
          class: "earnings-page-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "earnings-page-earnings-profile-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.earningsManagementTitle),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        E.div(
          {
            class: "earnings-page-link-info",
            style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem;`,
          },
          ...this.getEarningsManagementText(
            response.connectedAccountLinkType,
            response.connectedAccountUrl,
          ),
        ),
        E.div({
          style: `height: 3rem;`,
        }),
        E.div(
          {
            class: "earnings-page-payout-activities-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.payoutActivitiesTitle),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        E.div(
          {
            class: "earnings-page-payout-activities-date-inputs",
            style: `width: 100%; display: flex; flex-flow: row wrap; align-items: center; justify-content: flex-end;`,
          },
          E.inputRef(this.startMonthInput, {
            type: "month",
            pattern: "[0-9]{4}-[0-9]{2}",
            class: "earnings-page-start-month-input",
            style: `${BASIC_INPUT_STYLE} width: 15rem; border-color: ${SCHEME.neutral1};`,
            value: startMonth,
          }),
          E.div({
            style: `height: .2rem; width: 1rem; background-color: ${SCHEME.neutral1}; margin: 0 2rem;`,
          }),
          E.inputRef(this.endMonthInput, {
            type: "month",
            pattern: "[0-9]{4}-[0-9]{2}",
            class: "earnings-page-end-month-input",
            style: `${BASIC_INPUT_STYLE} width: 15rem; border-color: ${SCHEME.neutral1};`,
            value: endMonth,
          }),
        ),
        E.div({
          style: `height: 1.5rem;`,
        }),
        E.divRef(this.payoutActivityList, {
          class: "earnings-page-payout-activities-list",
          style: `display: flex; flex-flow: column nowrap; width: 100%; gap: 1rem;`,
        }),
      ),
    );
    this.listPayouts();

    this.startMonthInput.val.addEventListener("input", () =>
      this.listPayouts(),
    );
    this.endMonthInput.val.addEventListener("input", () => this.listPayouts());
  }

  private getEarningsManagementText(
    linkType: LinkType,
    connectedAccountUrl: string,
  ): Array<Node> {
    switch (linkType) {
      case LinkType.ONBOARDING:
        return [
          E.text(LOCALIZED_TEXT.completeOnboardInStripe[0]),
          E.a(
            {
              style: `color: ${SCHEME.link}; text-decoration: underline;`,
              href: connectedAccountUrl,
              target: "_blank",
            },
            E.text(LOCALIZED_TEXT.completeOnboardInStripe[1]),
          ),
          E.text(LOCALIZED_TEXT.completeOnboardInStripe[2]),
        ];
      case LinkType.LOGIN:
        return [
          E.a(
            {
              style: `color: ${SCHEME.link}; text-decoration: underline;`,
              href: connectedAccountUrl,
              target: "_blank",
            },
            E.text(LOCALIZED_TEXT.managePayoutInStripe[0]),
          ),
          E.text(LOCALIZED_TEXT.managePayoutInStripe[1]),
        ];
    }
  }

  private async listPayouts() {
    this.listRequestIndex++;
    let startMonth = this.startMonthInput.val.value;
    let endMonth = this.endMonthInput.val.value;
    let startDate = new Date(startMonth);
    let endDate = new Date(endMonth);
    if (
      isNaN(startDate.valueOf()) ||
      isNaN(endDate.valueOf()) ||
      startDate.valueOf() > endDate.valueOf() ||
      getMonthDifference(startDate, endDate) > MAX_MONTH_RANGE
    ) {
      while (this.payoutActivityList.val.lastElementChild) {
        this.payoutActivityList.val.lastElementChild.remove();
      }
      this.payoutActivityList.val.append(
        E.div(
          {
            class: "billing-page-invalid-payment-activity-range",
            style: `width: 100%; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
          },
          E.text(LOCALIZED_TEXT.invalidActivityRange),
        ),
      );
      return;
    }

    let currentIndex = this.listRequestIndex;
    let response = await this.serviceClient.send(
      newListPayoutsRequest({
        startMonth,
        endMonth,
      }),
    );
    if (currentIndex !== this.listRequestIndex) {
      // A new request has been made. Abort any changes.
      return;
    }
    while (this.payoutActivityList.val.lastElementChild) {
      this.payoutActivityList.val.lastElementChild.remove();
    }
    if (response.payouts.length === 0) {
      this.payoutActivityList.val.append(
        E.div(
          {
            class: "billing-page-no-payment-activity",
            style: `width: 100%; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
          },
          E.text(LOCALIZED_TEXT.noActivities),
        ),
      );
    } else {
      for (let payment of response.payouts) {
        let amount = new Intl.NumberFormat([navigator.language, "en-US"], {
          style: "currency",
          currency: payment.currency,
        }).format(payment.amount / CURRENCY_TO_CENTS.get(payment.currency));
        this.payoutActivityList.val.append(
          E.div(
            {
              class: "billing-page-payment-activity",

              style: `width: 100%; display: flex; flex-flow: row nowrap; justify-content: space-evenly;`,
            },
            E.div(
              {
                class: "billing-page-payment-month",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(payment.month),
            ),
            E.div(
              {
                class: "billing-page-payment-amount",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; min-width: 20rem;`,
              },
              E.text(amount),
            ),
            E.div(
              {
                class: "billing-page-payment-state",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; min-width: 10rem;`,
              },
              E.text(this.getPayoutStateText(payment.state)),
            ),
          ),
        );
      }
    }
    this.emit("listed");
  }

  private getPayoutStateText(payoutState: PayoutState): string {
    switch (payoutState) {
      case PayoutState.PROCESSING:
        return LOCALIZED_TEXT.payoutStateProcessing;
      case PayoutState.PAID:
        return LOCALIZED_TEXT.payoutStatePaid;
      case PayoutState.DISABLED:
        return LOCALIZED_TEXT.payoutStateDisabled;
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
