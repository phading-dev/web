import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { DateRangeInput, DateType } from "../../../common/date_range_input";
import { formatMoney } from "../../../common/formatter/price";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_CENTER_CARD_BACKGROUND_STYLE,
  PAGE_MEDIUM_CENTER_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_M, FONT_WEIGHT_600 } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import {
  newGetPayoutProfileInfoRequest,
  newListPayoutsRequest,
} from "@phading/commerce_service_interface/web/payout/client";
import { LinkType } from "@phading/commerce_service_interface/web/payout/interface";
import { PayoutState } from "@phading/commerce_service_interface/web/payout/payout";
import { MAX_MONTH_RANGE } from "@phading/constants/commerce";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PayoutPage {
  on(event: "listed", listener: () => void): this;
}

export class PayoutPage extends EventEmitter {
  public static create(): PayoutPage {
    return new PayoutPage(SERVICE_CLIENT, () => new Date());
  }

  private static INIT_MONTHS = 5;

  public body: HTMLDivElement;
  public monthRangeInput = new Ref<DateRangeInput>();
  public payoutActivityList = new Ref<HTMLDivElement>();
  private listRequestIndex = 0;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = E.div({
      class: "payout-page",
      style: PAGE_CENTER_CARD_BACKGROUND_STYLE,
    });
    this.load();
  }

  private async load() {
    let response = await this.serviceClient.send(
      newGetPayoutProfileInfoRequest({}),
    );
    let nowDate = TzDate.fromDate(
      this.getNowDate(),
      ENV_VARS.timezoneNegativeOffset,
    );
    let endMonth = nowDate.clone().moveToFirstDayOfMonth().addMonths(-1);
    let startMonth = endMonth.clone().addMonths(-PayoutPage.INIT_MONTHS);
    this.body.appendChild(
      E.div(
        {
          class: "payout-page-card",
          style: `${PAGE_MEDIUM_CENTER_CARD_STYLE} display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "payout-page-payout-profile-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.payoutManagementTitle),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        E.div(
          {
            class: "payout-page-link-info",
            style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem;`,
          },
          ...this.getPayoutManagementText(
            response.connectedAccountLinkType,
            response.connectedAccountUrl,
          ),
        ),
        E.div({
          style: `height: 3rem;`,
        }),
        E.div(
          {
            class: "payout-page-payout-activities-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.payoutActivitiesTitle),
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
        E.divRef(this.payoutActivityList, {
          class: "payout-page-payout-activities-list",
          style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 1rem;`,
        }),
      ),
    );
    this.monthRangeInput.val.setValues(
      startMonth.toLocalMonthISOString(),
      endMonth.toLocalMonthISOString(),
    );
    this.listPayouts();

    this.monthRangeInput.val.on("input", () => this.listPayouts());
    this.monthRangeInput.val.on("invalid", () => this.showInvalidRange());
  }

  private getPayoutManagementText(
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

  private showInvalidRange(): void {
    this.listRequestIndex++;
    while (this.payoutActivityList.val.lastElementChild) {
      this.payoutActivityList.val.lastElementChild.remove();
    }
    this.payoutActivityList.val.append(
      E.div(
        {
          class: "payout-page-invalid-activity-range",
          style: `width: 100%; text-align: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.invaliRange),
      ),
    );
  }

  private async listPayouts() {
    this.listRequestIndex++;
    let currentIndex = this.listRequestIndex;
    let { startRange, endRange } = this.monthRangeInput.val.getValues();
    let response = await this.serviceClient.send(
      newListPayoutsRequest({
        startMonth: startRange,
        endMonth: endRange,
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
            class: "payout-page-no-activity",
            style: `width: 100%; text-align: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.noActivities),
        ),
      );
    } else {
      response.payouts.sort((a, b) => {
        if (a.month > b.month) {
          return -1;
        } else if (a.month < b.month) {
          return 1;
        } else {
          return 0;
        }
      });
      for (let payout of response.payouts) {
        this.payoutActivityList.val.append(
          E.div(
            {
              class: "payout-page-activity",
              style: `width: 100%; box-sizing: border-box; padding: 0 2rem; display: flex; flex-flow: row wrap; gap: 1rem;`,
            },
            E.div(
              {
                class: "payout-page-payout-month",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(payout.month),
            ),
            E.div(
              {
                class: "payout-page-payout-amount",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; flex: 2 0 auto; text-align: end;`,
              },
              E.text(formatMoney(payout.amount, payout.currency)),
            ),
            E.div(
              {
                class: "payout-page-payout-state",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; flex: 1 0 10rem; text-align: end;`,
              },
              E.text(this.getPayoutStateText(payout.state)),
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
