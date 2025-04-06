import EventEmitter = require("events");
import {
  BlockingButton,
  FilledBlockingButton,
} from "../../../common/blocking_button";
import { SCHEME } from "../../../common/color_scheme";
import {
  getFirstDayOfNextMonth,
  getLastMonth,
  getMonthDifference,
  toDateWrtTimezone,
} from "../../../common/date_helper";
import {
  createCheckmarkIcon,
  createExclamationMarkInACycle,
  createForbiddenIcon,
} from "../../../common/icons";
import { BASIC_INPUT_STYLE } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_M, FONT_WEIGHT_600, ICON_XS } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import { AddCardPaymentItem, CardPaymentItem } from "./card_payment_item";
import { BillingProfileState } from "@phading/commerce_service_interface/web/billing/billing_profile_state";
import {
  newCreateStripeSessionToAddPaymentMethodRequest,
  newGetBillingProfileInfoRequest,
  newListPaymentsRequest,
  newRetryFailedPaymentsRequest,
} from "@phading/commerce_service_interface/web/billing/client";
import { CreateStripeSessionToAddPaymentMethodResponse } from "@phading/commerce_service_interface/web/billing/interface";
import { PaymentState } from "@phading/commerce_service_interface/web/billing/payment";
import { MAX_MONTH_RANGE } from "@phading/constants/commerce";
import { CURRENCY_TO_CENTS } from "@phading/price_config/amount_conversion";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface BillingPage {
  on(event: "retried", listener: () => void): this;
  on(event: "added", listener: () => void): this;
  on(event: "listed", listener: () => void): this;
}

export class BillingPage extends EventEmitter {
  public static create(): BillingPage {
    return new BillingPage(SERVICE_CLIENT, window, () => new Date());
  }

  public body: HTMLDivElement;
  public billingStatusContent = new Ref<HTMLDivElement>();
  public retryPaymentsButton = new Ref<BlockingButton>();
  public retryPaymentsErrorMessage = new Ref<HTMLDivElement>();
  public addPaymentMethodButton = new Ref<
    BlockingButton<CreateStripeSessionToAddPaymentMethodResponse>
  >();
  public addPaymentMethodErrorMessage = new Ref<HTMLDivElement>();
  public startMonthInput = new Ref<HTMLInputElement>();
  public endMonthInput = new Ref<HTMLInputElement>();
  public paymentActivityList = new Ref<HTMLDivElement>();
  private listRequestIndex = 0;

  public constructor(
    public serviceClient: WebServiceClient,
    private window: Window,
    private nowDate: () => Date,
  ) {
    super();
    this.body = E.div({
      class: "billing-page",
      style: PAGE_BACKGROUND_STYLE,
    });
    this.load();
  }

  private async load(): Promise<void> {
    let response = await this.serviceClient.send(
      newGetBillingProfileInfoRequest({}),
    );
    let now = this.nowDate();
    let startMonth = getLastMonth(toDateWrtTimezone(now));
    let endMonth = startMonth;
    this.body.append(
      E.div(
        {
          class: "billing-page-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "billing-page-status-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.billingStatusTitle),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        E.div(
          {
            class: "billing-page-status-line",
            style: `display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
          },
          E.div(
            {
              class: "billing-page-status-icon",
              style: `width: ${ICON_XS}rem; height: ${ICON_XS}rem;`,
            },
            this.getIcon(response.state),
          ),
          E.divRef(
            this.billingStatusContent,
            {
              class: "billing-page-status-content",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              this.getStatusText(
                now.valueOf(),
                response.paymentAfterMs,
                response.state,
              ),
            ),
          ),
        ),
        ...(response.state === BillingProfileState.WITH_FAILED_PAYMENTS
          ? [
              E.div({
                style: `height: 1rem;`,
              }),
              E.div(
                {
                  class: "billing-page-retry-payments-line",
                  style: `width: 100%; display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center; justify-content: flex-end;`,
                },
                E.divRef(
                  this.retryPaymentsErrorMessage,
                  {
                    class: "billing-page-retry-payments-error-message",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.error0}; visibility: hidden;`,
                  },
                  E.text("1"),
                ),
                assign(
                  this.retryPaymentsButton,
                  FilledBlockingButton.create("")
                    .append(E.text(LOCALIZED_TEXT.retryPaymentsLabel))
                    .enable(),
                ).body,
              ),
            ]
          : []),
        E.div({
          style: `height: 3rem;`,
        }),
        E.div(
          {
            class: "billing-page-payment-methods-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.paymentMethodTitle),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        response.primaryPaymentMethod
          ? new CardPaymentItem(now.valueOf(), response.primaryPaymentMethod)
              .body
          : new AddCardPaymentItem().body,
        E.div({
          style: `height: 1.5rem;`,
        }),
        E.div(
          {
            class: "billing-page-add-payment-method-line",
            style: `width: 100%; display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center; justify-content: flex-end;`,
          },
          E.divRef(
            this.addPaymentMethodErrorMessage,
            {
              class: "billing-page-add-payment-method-error-message",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.error0}; visibility: hidden;`,
            },
            E.text("1"),
          ),
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
        ),
        E.div({
          style: `height: 3rem;`,
        }),
        E.div(
          {
            class: "billing-page-payment-activities-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.paymentActivitiesTitle),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        E.div(
          {
            class: "billing-page-payment-activities-date-inputs",
            style: `width: 100%; display: flex; flex-flow: row wrap; align-items: center; justify-content: flex-end;`,
          },
          E.inputRef(this.startMonthInput, {
            type: "month",
            pattern: "[0-9]{4}-[0-9]{2}",
            class: "billing-page-start-month-input",
            style: `${BASIC_INPUT_STYLE} width: 15rem; border-color: ${SCHEME.neutral1};`,
            value: startMonth,
          }),
          E.div({
            style: `height: .2rem; width: 1rem; background-color: ${SCHEME.neutral1}; margin: 0 2rem;`,
          }),
          E.inputRef(this.endMonthInput, {
            type: "month",
            pattern: "[0-9]{4}-[0-9]{2}",
            class: "billing-page-end-month-input",
            style: `${BASIC_INPUT_STYLE} width: 15rem; border-color: ${SCHEME.neutral1};`,
            value: endMonth,
          }),
        ),
        E.div({
          style: `height: 1.5rem;`,
        }),
        E.divRef(this.paymentActivityList, {
          class: "billing-page-payment-activities-list",
          style: `display: flex; flex-flow: column nowrap; width: 100%; gap: 1rem;`,
        }),
      ),
    );
    this.listPayments();

    this.startMonthInput.val.addEventListener("input", () =>
      this.listPayments(),
    );
    this.endMonthInput.val.addEventListener("input", () => this.listPayments());
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

  private getIcon(billingProfileState: BillingProfileState): SVGSVGElement {
    switch (billingProfileState) {
      case BillingProfileState.HEALTHY:
        return createCheckmarkIcon(SCHEME.success0);
      case BillingProfileState.WITH_FAILED_PAYMENTS:
        return createExclamationMarkInACycle(SCHEME.warning0);
      case BillingProfileState.SUSPENDED:
        return createForbiddenIcon(SCHEME.error0);
    }
  }

  private getStatusText(
    now: number,
    paymentAfterMs: number,
    billingProfileState: BillingProfileState,
  ): string {
    switch (billingProfileState) {
      case BillingProfileState.HEALTHY:
        let firstDayOfNextMonth = getFirstDayOfNextMonth(
          toDateWrtTimezone(new Date(Math.max(now, paymentAfterMs))),
        );
        return `${LOCALIZED_TEXT.billingStatusHealthy[0]}${firstDayOfNextMonth}${LOCALIZED_TEXT.billingStatusHealthy[1]}`;
      case BillingProfileState.WITH_FAILED_PAYMENTS:
        return LOCALIZED_TEXT.billingStatusWarning;
      case BillingProfileState.SUSPENDED:
        return `${LOCALIZED_TEXT.billingStatusSuspended[0]}${ENV_VARS.contactEmail}${LOCALIZED_TEXT.billingStatusSuspended[1]}`;
    }
  }

  private async listPayments(): Promise<void> {
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
      while (this.paymentActivityList.val.lastElementChild) {
        this.paymentActivityList.val.lastElementChild.remove();
      }
      this.paymentActivityList.val.append(
        E.div(
          {
            class: "billing-page-invalid-payment-activity-range",
            style: `width: 100%; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
          },
          E.text(LOCALIZED_TEXT.invalidPaymentActivityRange),
        ),
      );
      return;
    }

    let currentIndex = this.listRequestIndex;
    let response = await this.serviceClient.send(
      newListPaymentsRequest({
        startMonth,
        endMonth,
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
            class: "billing-page-no-payment-activity",
            style: `width: 100%; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
          },
          E.text(LOCALIZED_TEXT.noPaymentActivities),
        ),
      );
    } else {
      for (let payment of response.payments) {
        let amount = new Intl.NumberFormat([navigator.language, "en-US"], {
          style: "currency",
          currency: payment.currency,
        }).format(payment.amount / CURRENCY_TO_CENTS.get(payment.currency));
        this.paymentActivityList.val.append(
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
      this.billingStatusContent.val.textContent =
        LOCALIZED_TEXT.billingStatusRetryingPayments;
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
