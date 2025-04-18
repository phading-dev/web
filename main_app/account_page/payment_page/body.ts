import EventEmitter = require("events");
import {
  BlockingButton,
  FilledBlockingButton,
} from "../../../common/blocking_button";
import { SCHEME } from "../../../common/color_scheme";
import { DateRangeInput, DateType } from "../../../common/date_range_input";
import { formatMoney } from "../../../common/formatter/price";
import {
  createCheckmarkIcon,
  createExclamationMarkInACycle,
  createForbiddenIcon,
} from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_M, FONT_WEIGHT_600, ICON_M } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import { AddCardPaymentItem, CardPaymentItem } from "./card_payment_item";
import {
  newCreateStripeSessionToAddPaymentMethodRequest,
  newGetPaymentProfileInfoRequest,
  newListPaymentsRequest,
  newRetryFailedPaymentsRequest,
} from "@phading/commerce_service_interface/web/payment/client";
import { CreateStripeSessionToAddPaymentMethodResponse } from "@phading/commerce_service_interface/web/payment/interface";
import { PaymentState } from "@phading/commerce_service_interface/web/payment/payment";
import { PaymentProfileState } from "@phading/commerce_service_interface/web/payment/payment_profile_state";
import { MAX_MONTH_RANGE } from "@phading/constants/commerce";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PaymentPage {
  on(event: "retried", listener: () => void): this;
  on(event: "added", listener: () => void): this;
  on(event: "listed", listener: () => void): this;
}

export class PaymentPage extends EventEmitter {
  public static create(): PaymentPage {
    return new PaymentPage(SERVICE_CLIENT, window, () => new Date());
  }

  private static INIT_MONTHS = 5;

  public body: HTMLDivElement;
  public paymentStatusContent = new Ref<HTMLDivElement>();
  public retryPaymentsButton = new Ref<BlockingButton>();
  public retryPaymentsErrorMessage = new Ref<HTMLDivElement>();
  public addPaymentMethodButton = new Ref<
    BlockingButton<CreateStripeSessionToAddPaymentMethodResponse>
  >();
  public addPaymentMethodErrorMessage = new Ref<HTMLDivElement>();
  public monthRangeInput = new Ref<DateRangeInput>();
  public paymentActivityList = new Ref<HTMLDivElement>();
  private listRequestIndex = 0;

  public constructor(
    public serviceClient: WebServiceClient,
    private window: Window,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = E.div({
      class: "payment-page",
      style: PAGE_BACKGROUND_STYLE,
    });
    this.load();
  }

  private async load(): Promise<void> {
    let response = await this.serviceClient.send(
      newGetPaymentProfileInfoRequest({}),
    );
    let nowDate = TzDate.fromDate(
      this.getNowDate(),
      ENV_VARS.timezoneNegativeOffset,
    );
    let endMonth = nowDate.clone().moveToFirstDayOfMonth().addMonths(-1);
    let startMonth = endMonth.clone().addMonths(-PaymentPage.INIT_MONTHS);
    this.body.append(
      E.div(
        {
          class: "payment-page-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "payment-page-status-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.paymentStatusTitle),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        E.div(
          {
            class: "payment-page-status-line",
            style: `display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
          },
          E.div(
            {
              class: "payment-page-status-icon",
              style: `width: ${ICON_M}rem; height: ${ICON_M}rem;`,
            },
            this.getIcon(response.state),
          ),
          E.divRef(
            this.paymentStatusContent,
            {
              class: "payment-page-status-content",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              this.getStatusText(
                nowDate,
                response.paymentAfterMs,
                response.state,
              ),
            ),
          ),
        ),
        ...(response.state === PaymentProfileState.WITH_FAILED_PAYMENTS
          ? [
              E.div({
                style: `height: 1rem;`,
              }),
              E.div(
                {
                  class: "payment-page-retry-payments-line",
                  style: `width: 100%; display: flex; flex-flow: row-reverse wrap; gap: 1rem; align-items: center; justify-content: flex-start;`,
                },
                assign(
                  this.retryPaymentsButton,
                  FilledBlockingButton.create("")
                    .append(E.text(LOCALIZED_TEXT.retryPaymentsLabel))
                    .enable(),
                ).body,
                E.divRef(
                  this.retryPaymentsErrorMessage,
                  {
                    class: "payment-page-retry-payments-error-message",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.error0}; visibility: hidden;`,
                  },
                  E.text("1"),
                ),
              ),
            ]
          : []),
        E.div({
          style: `height: 3rem;`,
        }),
        E.div(
          {
            class: "payment-page-payment-methods-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.paymentMethodTitle),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        response.primaryPaymentMethod
          ? new CardPaymentItem(
              nowDate.toTimestampMs(),
              response.primaryPaymentMethod,
            ).body
          : new AddCardPaymentItem().body,
        E.div({
          style: `height: 1.5rem;`,
        }),
        E.div(
          {
            class: "payment-page-add-payment-method-line",
            style: `width: 100%; display: flex; flex-flow: row-reverse wrap; gap: 1rem; align-items: center; justify-content: flex-start;`,
          },
          assign(
            this.addPaymentMethodButton,
            FilledBlockingButton.create<CreateStripeSessionToAddPaymentMethodResponse>(
              "",
            )
              .append(
                E.text(
                  response.primaryPaymentMethod
                    ? LOCALIZED_TEXT.updateCardPaymentLabel
                    : LOCALIZED_TEXT.addCardPaymentLabel,
                ),
              )
              .enable(),
          ).body,
          E.divRef(
            this.addPaymentMethodErrorMessage,
            {
              class: "payment-page-add-payment-method-error-message",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.error0}; visibility: hidden;`,
            },
            E.text("1"),
          ),
        ),
        E.div({
          style: `height: 3rem;`,
        }),
        E.div(
          {
            class: "payment-page-payment-activities-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.paymentActivitiesTitle),
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
        E.divRef(this.paymentActivityList, {
          class: "payment-page-payment-activities-list",
          style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 1rem;`,
        }),
      ),
    );
    this.monthRangeInput.val.setValues(
      startMonth.toLocalMonthISOString(),
      endMonth.toLocalMonthISOString(),
    );
    this.listPayments();

    this.monthRangeInput.val.on("input", () => this.listPayments());
    this.monthRangeInput.val.on("invalid", () => this.showInvalidRange());
    if (this.retryPaymentsButton.val) {
      this.retryPaymentsButton.val.addAction(
        async () => this.retryFailedPayments(),
        (response, error) => this.postRetryFailedPayments(error),
      );
    }
    this.addPaymentMethodButton.val.addAction(
      async () => this.startStripeSession(),
      (response, error) => this.postStartStripeSession(response, error),
    );
  }

  private getIcon(paymentProfileState: PaymentProfileState): SVGSVGElement {
    switch (paymentProfileState) {
      case PaymentProfileState.HEALTHY:
        return createCheckmarkIcon(SCHEME.success0);
      case PaymentProfileState.WITH_FAILED_PAYMENTS:
        return createExclamationMarkInACycle(SCHEME.warning0);
      case PaymentProfileState.SUSPENDED:
        return createForbiddenIcon(SCHEME.error0);
    }
  }

  private getStatusText(
    nowDate: TzDate,
    paymentAfterMs: number,
    paymentProfileState: PaymentProfileState,
  ): string {
    switch (paymentProfileState) {
      case PaymentProfileState.HEALTHY:
        let maxDate =
          nowDate.toTimestampMs() > paymentAfterMs
            ? nowDate.clone()
            : TzDate.fromTimestampMs(
                paymentAfterMs,
                ENV_VARS.timezoneNegativeOffset,
              );
        return `${LOCALIZED_TEXT.paymentStatusHealthy[0]}${maxDate.moveToFirstDayOfMonth().addMonths(1).toLocalDateISOString()}${LOCALIZED_TEXT.paymentStatusHealthy[1]}`;
      case PaymentProfileState.WITH_FAILED_PAYMENTS:
        return LOCALIZED_TEXT.paymentStatusWarning;
      case PaymentProfileState.SUSPENDED:
        return `${LOCALIZED_TEXT.paymentStatusSuspended[0]}${ENV_VARS.contactEmail}${LOCALIZED_TEXT.paymentStatusSuspended[1]}`;
    }
  }

  private showInvalidRange(): void {
    this.listRequestIndex++;
    while (this.paymentActivityList.val.lastElementChild) {
      this.paymentActivityList.val.lastElementChild.remove();
    }
    this.paymentActivityList.val.append(
      E.div(
        {
          class: "payment-page-invalid-activity-range",
          style: `width: 100%; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.invaliRange),
      ),
    );
  }

  private async listPayments(): Promise<void> {
    this.listRequestIndex++;
    let currentIndex = this.listRequestIndex;
    let { startRange, endRange } = this.monthRangeInput.val.getValues();
    let response = await this.serviceClient.send(
      newListPaymentsRequest({
        startMonth: startRange,
        endMonth: endRange,
      }),
    );
    if (currentIndex !== this.listRequestIndex) {
      // A new request has been made. Abort any changes.
      return;
    }
    while (this.paymentActivityList.val.lastElementChild) {
      this.paymentActivityList.val.lastElementChild.remove();
    }
    if (response.payments.length === 0) {
      this.paymentActivityList.val.append(
        E.div(
          {
            class: "payment-page-no-activity",
            style: `width: 100%; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
          },
          E.text(LOCALIZED_TEXT.noActivities),
        ),
      );
    } else {
      response.payments.sort((a, b) => {
        if (a.month > b.month) {
          return -1;
        } else if (a.month < b.month) {
          return 1;
        } else {
          return 0;
        }
      });
      for (let payment of response.payments) {
        this.paymentActivityList.val.append(
          E.div(
            {
              class: "payment-page-activity",
              style: `width: 100%; box-sizing: border-box; padding: 0 2rem; display: flex; flex-flow: row nowrap; gap: 1rem;`,
            },
            E.div(
              {
                class: "payment-page-payment-month",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(payment.month),
            ),
            E.div(
              {
                class: "payment-page-payment-amount",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; flex: 1 0 auto; text-align: end;`,
              },
              E.text(
                formatMoney(payment.amount, payment.currency),
              ),
            ),
            E.div(
              {
                class: "payment-page-payment-state",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; flex: 1 0 10rem; text-align: end;`,
              },
              E.text(this.getPaymentStateText(payment.state)),
            ),
          ),
        );
      }
    }
    this.emit("listed");
  }

  private getPaymentStateText(paymentState: PaymentState): string {
    switch (paymentState) {
      case PaymentState.PROCESSING:
        return LOCALIZED_TEXT.paymentStateProcessing;
      case PaymentState.PAID:
        return LOCALIZED_TEXT.paymentStatePaid;
      case PaymentState.FAILED:
        return LOCALIZED_TEXT.paymentStateFailed;
    }
  }

  private async retryFailedPayments(): Promise<void> {
    this.retryPaymentsErrorMessage.val.style.visibility = "hidden";
    await this.serviceClient.send(newRetryFailedPaymentsRequest({}));
  }

  private postRetryFailedPayments(error?: Error): void {
    if (error) {
      this.retryPaymentsErrorMessage.val.style.visibility = "visible";
      this.retryPaymentsErrorMessage.val.textContent =
        LOCALIZED_TEXT.retryPaymentsGenericFailure;
    } else {
      this.retryPaymentsButton.val.disable();
      this.paymentStatusContent.val.textContent =
        LOCALIZED_TEXT.paymentStatusRetryingPayments;
    }
    this.emit("retried");
  }

  private startStripeSession(): Promise<CreateStripeSessionToAddPaymentMethodResponse> {
    this.addPaymentMethodErrorMessage.val.style.visibility = "hidden";
    return this.serviceClient.send(
      newCreateStripeSessionToAddPaymentMethodRequest({}),
    );
  }

  private postStartStripeSession(
    response?: CreateStripeSessionToAddPaymentMethodResponse,
    error?: Error,
  ): void {
    if (error) {
      this.addPaymentMethodErrorMessage.val.style.visibility = "visible";
      this.addPaymentMethodErrorMessage.val.textContent =
        LOCALIZED_TEXT.addPaymentMethodGenericFailure;
    } else {
      this.window.location.href = response.redirectUrl;
    }
    this.emit("added");
  }
}
