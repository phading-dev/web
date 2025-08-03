import EventEmitter = require("events");
import { BlockingButton, FilledButton } from "../../../common/button";
import { SCHEME } from "../../../common/color_scheme";
import { DateRangeInput, DateType } from "../../../common/date_range_input";
import { formatMoney } from "../../../common/formatter/price";
import {
  createCheckmarkIcon,
  createExclamationMarkInACycle,
  createForbiddenIcon,
  createMoneyBagIcon,
} from "../../../common/icons";
import { eLineItemRow, eThreeColumns } from "../../../common/line_item";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { ePageWithTopDownCard } from "../../../common/page_elements";
import {
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  GAP_1X,
  GAP_2X,
  GAP_d_25X,
  GAP_d_5X,
  GAP_d_75X,
  ICON_L,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
  PAGE_MAX_WIDTH_L,
} from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import { AddCardPaymentItem, CardPaymentItem } from "./card_payment_item";
import {
  newCreateStripeSessionToAddPaymentMethodRequest,
  newGetPaymentProfileInfoRequest,
  newListPaymentsRequest,
  newReactivatePaymentProfileRequest,
  newRetryFailedPaymentsRequest,
} from "@phading/commerce_service_interface/web/payment/client";
import { CreateStripeSessionToAddPaymentMethodResponse } from "@phading/commerce_service_interface/web/payment/interface";
import { PaymentState } from "@phading/commerce_service_interface/web/payment/payment";
import {
  PaymentProfile,
  PaymentProfileState,
  PaymentsOverallState,
} from "@phading/commerce_service_interface/web/payment/payment_profile";
import { MAX_MONTH_RANGE } from "@phading/constants/commerce";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PaymentPage {
  on(event: "retried", listener: () => void): this;
  on(event: "reactivated", listener: () => void): this;
  on(event: "added", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
  on(event: "listed", listener: () => void): this;
}

export class PaymentPage extends EventEmitter {
  public static create(): PaymentPage {
    return new PaymentPage(SERVICE_CLIENT, window, () => new Date());
  }

  private static INIT_MONTHS = 5;

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public paymentStatusContent = new Ref<HTMLDivElement>();
  public retryPaymentsButton = new Ref<BlockingButton>();
  public retryPaymentsErrorMessage = new Ref<HTMLDivElement>();
  public reactivateButton = new Ref<BlockingButton>();
  public reactivateErrorMessage = new Ref<HTMLDivElement>();
  public addPaymentMethodButton = new Ref<
    BlockingButton<CreateStripeSessionToAddPaymentMethodResponse>
  >();
  public addPaymentMethodErrorMessage = new Ref<HTMLDivElement>();
  public monthRangeInput = new Ref<DateRangeInput>();
  public paymentActivityList = new Ref<HTMLDivElement>();
  private listRequestIndex = 0;

  public constructor(
    private serviceClient: WebServiceClient,
    private window: Window,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${GAP_1X}rem ${GAP_1X}rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem ${GAP_1X}rem; display: flex; flex-flow: column nowrap;`,
    );
    this.load();
  }

  private async load(): Promise<void> {
    let response = await this.serviceClient.send(
      newGetPaymentProfileInfoRequest({}),
    );
    if (response.notAvailable) {
      this.card.val.append(
        E.div(
          {
            class: "payment-page-status-title",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.paymentStatusTitle),
        ),
        E.div({
          style: `flex: 0 0 auto; height: ${GAP_d_25X}rem;`,
        }),
        E.div(
          {
            class: "payment-page-not-available",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.paymentStatusNotAvailable),
        ),
      );
      this.emit("loaded");
      return;
    }

    let profile = response.paymentProfile;
    let nowDate = TzDate.fromDate(
      this.getNowDate(),
      ENV_VARS.timezoneNegativeOffset,
    );
    let endMonth = nowDate.clone().moveToFirstDayOfMonth().addMonths(-1);
    let startMonth = endMonth.clone().addMonths(-PaymentPage.INIT_MONTHS);
    this.card.val.append(
      E.div(
        {
          class: "payment-page-status-title",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(LOCALIZED_TEXT.paymentStatusTitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_d_25X}rem;`,
      }),
      E.div(
        {
          class: "payment-page-status-line",
          style: `display: flex; flex-flow: row nowrap; gap: ${GAP_d_5X}rem; align-items: center;`,
        },
        E.div(
          {
            class: "payment-page-status-icon",
            style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
          },
          this.getIcon(profile),
        ),
        E.divRef(
          this.paymentStatusContent,
          {
            class: "payment-page-status-content",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(this.getStatusText(nowDate, profile)),
        ),
      ),
      ...(profile.profileState === PaymentProfileState.HEALTHY &&
      profile.balanceAmount !== 0
        ? [
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_d_25X}rem;`,
            }),
            E.div(
              {
                class: "payment-page-balance-line",
                style: `display: flex; flex-flow: row nowrap; gap: ${GAP_d_5X}rem; align-items: center;`,
              },
              E.div(
                {
                  class: "payment-page-status-icon",
                  style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
                },
                createMoneyBagIcon(SCHEME.money),
              ),
              E.div(
                {
                  class: "payment-page-balance",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.paymentBalance[0]),
                E.div(
                  {
                    style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                  },
                  E.text(
                    formatMoney(profile.balanceAmount, profile.balanceCurrency),
                  ),
                ),
                E.text(
                  `${LOCALIZED_TEXT.paymentBalance[1]} ${profile.balanceAmount < 0 ? LOCALIZED_TEXT.paymentCreditExplanation : ""}${profile.balanceAmount > 0 ? LOCALIZED_TEXT.paymentDebitExplanation : ""}`,
                ),
              ),
            ),
          ]
        : []),
      ...(profile.paymentsOverallState ===
      PaymentsOverallState.WITH_FAILED_PAYMENTS
        ? [
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_d_5X}rem;`,
            }),
            E.div(
              {
                class: "payment-page-retry-payments-line",
                style: `width: 100%; display: flex; flex-flow: row-reverse wrap; gap: ${GAP_d_5X}rem; align-items: center; justify-content: flex-start;`,
              },
              assign(
                this.retryPaymentsButton,
                new BlockingButton(
                  new FilledButton("").append(
                    E.text(LOCALIZED_TEXT.retryPaymentsLabel),
                  ),
                ),
              ).body,
              E.divRef(
                this.retryPaymentsErrorMessage,
                {
                  class: "payment-page-retry-payments-error-message",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.error0}; visibility: hidden;`,
                },
                E.text("1"),
              ),
            ),
          ]
        : []),
      ...(profile.profileState === PaymentProfileState.SUSPENDED &&
      profile.paymentsOverallState === PaymentsOverallState.ALL_PAID
        ? [
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_d_5X}rem;`,
            }),
            E.div(
              {
                class: "payment-page-reactivate-line",
                style: `width: 100%; display: flex; flex-flow: row-reverse wrap; gap: ${GAP_d_5X}rem; align-items: center; justify-content: flex-start;`,
              },
              assign(
                this.reactivateButton,
                new BlockingButton(
                  new FilledButton("").append(
                    E.text(LOCALIZED_TEXT.reactivatePaymentProfileLabel),
                  ),
                ),
              ).body,
              E.divRef(
                this.reactivateErrorMessage,
                {
                  class: "payment-page-retry-payments-error-message",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.error0}; visibility: hidden;`,
                },
                E.text("1"),
              ),
            ),
          ]
        : []),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "payment-page-payment-methods-title",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(LOCALIZED_TEXT.paymentMethodTitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_d_5X}rem;`,
      }),
      profile.primaryPaymentMethod
        ? new CardPaymentItem(
            nowDate.toTimestampMs(),
            profile.primaryPaymentMethod,
          ).body
        : new AddCardPaymentItem().body,
      ...(profile.canClaimInitCredit
        ? [
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_d_5X}rem;`,
            }),
            E.div(
              {
                class: "payment-page-init-credit",
              },
              E.div(
                {
                  class: "payment-page-init-credit-available",
                  style: `display: inline; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(
                  `${LOCALIZED_TEXT.initCreditAvailable[0]}${formatMoney(ENV_VARS.initCreditAmount, ENV_VARS.defaultCurrency)}${LOCALIZED_TEXT.initCreditAvailable[1]} `,
                ),
              ),
              E.div(
                {
                  class: "payment-page-init-credit-caveat",
                  style: `display: inline; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(` (${LOCALIZED_TEXT.initCreditCaveat})`),
              ),
            ),
          ]
        : []),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_d_75X}rem;`,
      }),
      E.div(
        {
          class: "payment-page-add-payment-method-line",
          style: `width: 100%; display: flex; flex-flow: row-reverse wrap; gap: ${GAP_d_5X}rem; align-items: center; justify-content: flex-start;`,
        },
        assign(
          this.addPaymentMethodButton,
          new BlockingButton<CreateStripeSessionToAddPaymentMethodResponse>(
            new FilledButton("").append(
              E.text(
                profile.primaryPaymentMethod
                  ? LOCALIZED_TEXT.updateCardPaymentLabel
                  : LOCALIZED_TEXT.addCardPaymentLabel,
              ),
            ),
          ),
        ).body,
        E.divRef(
          this.addPaymentMethodErrorMessage,
          {
            class: "payment-page-add-payment-method-error-message",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.error0}; visibility: hidden;`,
          },
          E.text("1"),
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "payment-page-payment-activities-title",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(LOCALIZED_TEXT.paymentActivitiesTitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_d_5X}rem;`,
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
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.divRef(this.paymentActivityList, {
        class: "payment-page-payment-activities-list",
        style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_d_5X}rem;`,
      }),
    );
    this.monthRangeInput.val.setValues(
      startMonth.toLocalMonthISOString(),
      endMonth.toLocalMonthISOString(),
    );
    this.listPayments();
    this.monthRangeInput.val.on("change", () => this.listPayments());
    this.monthRangeInput.val.on("invalid", () => this.showInvalidRange());
    this.retryPaymentsButton.val?.addAction(
      () => this.retryFailedPayments(),
      (error) => this.postRetryFailedPayments(error),
    );
    this.reactivateButton.val?.addAction(
      () => this.reactivatePaymentMethod(),
      (error) => this.postReactivatePaymentMethod(error),
    );

    this.addPaymentMethodButton.val.addAction(
      async () => this.startStripeSession(),
      (error, response) => this.postStartStripeSession(error, response),
    );
    this.emit("loaded");
  }

  private getIcon(profile: PaymentProfile): SVGSVGElement {
    switch (profile.profileState) {
      case PaymentProfileState.HEALTHY:
        switch (profile.paymentsOverallState) {
          case PaymentsOverallState.ALL_PAID:
          case PaymentsOverallState.WITH_PROCESSING_PAYMENTS:
            return createCheckmarkIcon(SCHEME.success0);
          case PaymentsOverallState.WITH_FAILED_PAYMENTS:
            return createExclamationMarkInACycle(SCHEME.warning0);
        }
      case PaymentProfileState.SUSPENDED:
        return createForbiddenIcon(SCHEME.error0);
    }
  }

  private getStatusText(nowDate: TzDate, profile: PaymentProfile): string {
    switch (profile.profileState) {
      case PaymentProfileState.HEALTHY:
        switch (profile.paymentsOverallState) {
          case PaymentsOverallState.ALL_PAID:
            return `${LOCALIZED_TEXT.paymentStatusHealthy[0]}${nowDate.clone().moveToFirstDayOfMonth().addMonths(1).toLocalDateISOString()}${LOCALIZED_TEXT.paymentStatusHealthy[1]}`;
          case PaymentsOverallState.WITH_PROCESSING_PAYMENTS:
            return LOCALIZED_TEXT.paymentStatusHealthyWithProcessingPayments;
          case PaymentsOverallState.WITH_FAILED_PAYMENTS:
            return LOCALIZED_TEXT.paymentStatusHealthyWithFailedPayments;
        }
      case PaymentProfileState.SUSPENDED:
        switch (profile.paymentsOverallState) {
          case PaymentsOverallState.ALL_PAID:
            return LOCALIZED_TEXT.paymentStatusSuspendedWithSettledPayments;
          case PaymentsOverallState.WITH_PROCESSING_PAYMENTS:
            return LOCALIZED_TEXT.paymentStatusSuspendedWithProcessingPayments;
          case PaymentsOverallState.WITH_FAILED_PAYMENTS:
            return LOCALIZED_TEXT.paymentStatusSuspendedWithFailedPayments;
        }
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
          style: `width: 100%; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
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
            style: `width: 100%; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
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
          eLineItemRow(
            "",
            ...eThreeColumns(
              payment.month,
              formatMoney(payment.amount, payment.currency),
              this.getPaymentStateText(payment.state),
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
        LOCALIZED_TEXT.retryPaymentsGenericError;
    } else {
      this.retryPaymentsButton.val.disable();
      this.paymentStatusContent.val.textContent =
        LOCALIZED_TEXT.paymentStatusRetryingPayments;
    }
    this.emit("retried");
  }

  private async reactivatePaymentMethod(): Promise<void> {
    this.reactivateErrorMessage.val.style.visibility = "hidden";
    await this.serviceClient.send(newReactivatePaymentProfileRequest({}));
  }

  private postReactivatePaymentMethod(error?: Error): void {
    if (error) {
      this.reactivateErrorMessage.val.style.visibility = "visible";
      this.reactivateErrorMessage.val.textContent =
        LOCALIZED_TEXT.reactivatePaymentProfileGenericError;
    } else {
      this.reactivateButton.val.hide();
      this.paymentStatusContent.val.textContent =
        LOCALIZED_TEXT.reactivatePaymentProfileSuccess;
    }
    this.emit("reactivated");
  }

  private startStripeSession(): Promise<CreateStripeSessionToAddPaymentMethodResponse> {
    this.addPaymentMethodErrorMessage.val.style.visibility = "hidden";
    return this.serviceClient.send(
      newCreateStripeSessionToAddPaymentMethodRequest({}),
    );
  }

  private postStartStripeSession(
    error?: Error,
    response?: CreateStripeSessionToAddPaymentMethodResponse,
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

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
