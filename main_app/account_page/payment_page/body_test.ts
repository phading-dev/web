import "../../../dev/env";
import "../../../common/normalize_body";
import path = require("path");
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { PaymentPage } from "./body";
import {
  CREATE_STRIPE_SESSION_TO_ADD_PAYMENT_METHOD,
  CreateStripeSessionToAddPaymentMethodResponse,
  GET_PAYMENT_PROFILE_INFO,
  GetPaymentProfileInfoResponse,
  LIST_PAYMENTS,
  LIST_PAYMENTS_REQUEST_BODY,
  ListPaymentsResponse,
  RETRY_FAILED_PAYMENTS,
  RetryFailedPaymentsResponse,
} from "@phading/commerce_service_interface/web/payment/interface";
import { PaymentState } from "@phading/commerce_service_interface/web/payment/payment";
import { CardBrand } from "@phading/commerce_service_interface/web/payment/payment_method_masked";
import { PaymentProfileState } from "@phading/commerce_service_interface/web/payment/payment_profile_state";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "PaymentPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "PhoneView_HealthyWithNoPaymentMethodAndEmptyList_StartMonthLargerThanEndMonth_ListActivitiesWithMultipleStates_TabletView";
      private cut: PaymentPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(request: any): Promise<any> {
            switch (request.descriptor) {
              case GET_PAYMENT_PROFILE_INFO:
                return {
                  state: PaymentProfileState.HEALTHY,
                  paymentAfterMs: 0,
                } as GetPaymentProfileInfoResponse;
              case LIST_PAYMENTS:
                this.request = request;
                return this.response;
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        serviceClientMock.response = {
          payments: [],
        } as ListPaymentsResponse;
        this.cut = new PaymentPage(
          serviceClientMock,
          {} as any,
          () => new Date("2025-04-05T08:00:00.000Z"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startMonth: "2024-10",
              endMonth: "2025-03",
            },
            LIST_PAYMENTS_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_healthy_no_card_no_activity.png"),
          path.join(
            __dirname,
            "/golden/payment_page_healthy_no_card_no_activity.png",
          ),
          path.join(
            __dirname,
            "/payment_page_healthy_no_card_no_activity_diff.png",
          ),
        );

        // Execute
        this.cut.monthRangeInput.val.startRangeInput.val.value = "2025-04";
        this.cut.monthRangeInput.val.startRangeInput.val.dispatchEvent(
          new Event("input"),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_invalid_range.png"),
          path.join(__dirname, "/golden/payment_page_invalid_range.png"),
          path.join(__dirname, "/payment_page_invalid_range_diff.png"),
        );

        // Prepare
        serviceClientMock.response = {
          payments: [
            {
              month: "2026-06",
              currency: "USD",
              amount: 13300,
              state: PaymentState.FAILED,
            },
            {
              month: "2026-12",
              currency: "USD",
              amount: 1330,
              state: PaymentState.PAID,
            },
            {
              month: "2025-06",
              currency: "USD",
              amount: 10,
              state: PaymentState.PAID,
            },
            {
              month: "2026-01",
              currency: "USD",
              amount: 10000,
              state: PaymentState.PROCESSING,
            },
            {
              month: "2025-05",
              currency: "USD",
              amount: 900,
              state: PaymentState.PAID,
            },
          ],
        } as ListPaymentsResponse;

        // Execute
        this.cut.monthRangeInput.val.endRangeInput.val.value = "2026-12";
        this.cut.monthRangeInput.val.endRangeInput.val.dispatchEvent(
          new Event("input"),
        );
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startMonth: "2025-04",
              endMonth: "2026-12",
            },
            LIST_PAYMENTS_REQUEST_BODY,
          ),
          "RC request body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_list_payments.png"),
          path.join(__dirname, "/golden/payment_page_list_payments.png"),
          path.join(__dirname, "/payment_page_list_payments_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_list_payments_tablet.png"),
          path.join(__dirname, "/golden/payment_page_list_payments_tablet.png"),
          path.join(__dirname, "/payment_page_list_payments_tablet_diff.png"),
        );
      }
      public async tearDown() {
        this.cut.body.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "HealthyWithLaterPaymentDate";
      private cut: PaymentPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(request: any): Promise<any> {
            switch (request.descriptor) {
              case GET_PAYMENT_PROFILE_INFO:
                return {
                  state: PaymentProfileState.HEALTHY,
                  // 2025-05-06
                  paymentAfterMs: 1746549117000,
                } as GetPaymentProfileInfoResponse;
              case LIST_PAYMENTS:
                return {
                  payments: [],
                } as ListPaymentsResponse;
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        // 2025-04-05
        this.cut = new PaymentPage(
          serviceClientMock,
          {} as any,
          () => new Date(1743867646000),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_healthy_later_payment_date.png"),
          path.join(
            __dirname,
            "/golden/payment_page_healthy_later_payment_date.png",
          ),
          path.join(
            __dirname,
            "/payment_page_healthy_later_payment_date_diff.png",
          ),
        );
      }
      public async tearDown() {
        this.cut.body.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "PhoneView_WithFailedPayments_RetryFailed_TabletView_RetrySuccess";
      private cut: PaymentPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(request: any): Promise<any> {
            switch (request.descriptor) {
              case GET_PAYMENT_PROFILE_INFO:
                return {
                  state: PaymentProfileState.WITH_FAILED_PAYMENTS,
                } as GetPaymentProfileInfoResponse;
              case LIST_PAYMENTS:
                return {
                  payments: [],
                } as ListPaymentsResponse;
              case RETRY_FAILED_PAYMENTS:
                if (this.error) {
                  throw this.error;
                } else {
                  return this.response;
                }
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        // 2025-04-05
        this.cut = new PaymentPage(
          serviceClientMock,
          {} as any,
          () => new Date(1743867646000),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_with_failed_payments.png"),
          path.join(__dirname, "/golden/payment_page_with_failed_payments.png"),
          path.join(__dirname, "/payment_page_with_failed_payments_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.retryPaymentsButton.val.click();
        await new Promise((resolve) => this.cut.once("retried", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/payment_page_with_failed_payments_retry_failed.png",
          ),
          path.join(
            __dirname,
            "/golden/payment_page_with_failed_payments_retry_failed.png",
          ),
          path.join(
            __dirname,
            "/payment_page_with_failed_payments_retry_failed_diff.png",
          ),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/payment_page_with_failed_payments_retry_failed_tablet.png",
          ),
          path.join(
            __dirname,
            "/golden/payment_page_with_failed_payments_retry_failed_tablet.png",
          ),
          path.join(
            __dirname,
            "/payment_page_with_failed_payments_retry_failed_tablet_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = undefined;
        serviceClientMock.response = {} as RetryFailedPaymentsResponse;

        // Execute
        this.cut.retryPaymentsButton.val.click();
        await new Promise((resolve) => this.cut.once("retried", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/payment_page_with_failed_payments_retry_success.png",
          ),
          path.join(
            __dirname,
            "/golden/payment_page_with_failed_payments_retry_success.png",
          ),
          path.join(
            __dirname,
            "/payment_page_with_failed_payments_retry_success_diff.png",
          ),
        );
      }
      public async tearDown() {
        this.cut.body.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PhoneView_WithVisaCard_AddFailed_TabletView_AddSuccess";
      private cut: PaymentPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(request: any): Promise<any> {
            switch (request.descriptor) {
              case GET_PAYMENT_PROFILE_INFO:
                return {
                  state: PaymentProfileState.HEALTHY,
                  paymentAfterMs: 0,
                  primaryPaymentMethod: {
                    card: {
                      brand: CardBrand.VISA,
                      lastFourDigits: "1234",
                      expMonth: 12,
                      expYear: 2025,
                    },
                  },
                } as GetPaymentProfileInfoResponse;
              case LIST_PAYMENTS:
                return {
                  payments: [],
                } as ListPaymentsResponse;
              case CREATE_STRIPE_SESSION_TO_ADD_PAYMENT_METHOD:
                if (this.error) {
                  throw this.error;
                } else {
                  return this.response;
                }
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        let windowMock = {
          location: {},
        } as any;
        // 2025-04-05
        this.cut = new PaymentPage(
          serviceClientMock,
          windowMock,
          () => new Date(1743867646000),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_with_visa_card.png"),
          path.join(__dirname, "/golden/payment_page_with_visa_card.png"),
          path.join(__dirname, "/payment_page_with_visa_card_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.addPaymentMethodButton.val.click();
        await new Promise((resolve) => this.cut.once("added", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_add_card_failed.png"),
          path.join(__dirname, "/golden/payment_page_add_card_failed.png"),
          path.join(__dirname, "/payment_page_add_card_failed_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_add_card_failed_tablet.png"),
          path.join(
            __dirname,
            "/golden/payment_page_add_card_failed_tablet.png",
          ),
          path.join(__dirname, "/payment_page_add_card_failed_tablet_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        serviceClientMock.response = {
          redirectUrl: "https://stripe.com/add_card",
        } as CreateStripeSessionToAddPaymentMethodResponse;

        // Execute
        this.cut.addPaymentMethodButton.val.click();
        await new Promise((resolve) => this.cut.once("added", resolve));

        // Verify
        assertThat(
          windowMock.location.href,
          eq("https://stripe.com/add_card"),
          "redirect url",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_page_add_card_success.png"),
          path.join(__dirname, "/golden/payment_page_add_card_success.png"),
          path.join(__dirname, "/payment_page_add_card_success_diff.png"),
        );
      }
      public async tearDown() {
        this.cut.body.remove();
      }
    })(),
  ],
});
