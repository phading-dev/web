import path = require("path");
import { PaymentMethodsListPage } from "./body";
import { CardPaymentItemMock } from "./card_payment_item/body_mock";
import {
  CREATE_STRIPE_SESSION_TO_ADD_PAYMENT_METHOD,
  CREATE_STRIPE_SESSION_TO_ADD_PAYMENT_METHOD_REQUEST_BODY,
  CreateStripeSessionToAddPaymentMethodResponse,
  LIST_PAYMENT_METHODS,
  LIST_PAYMENT_METHODS_REQUEST_BODY,
  ListPaymentMethodsResponse,
} from "@phading/billing_service_interface/web/interface";
import {
  CardBrand,
  PAYMENT_METHOD_MASKED,
  PaymentMethodMasked,
} from "@phading/billing_service_interface/web/payment_method_masked";
import { PaymentMethodPriority } from "@phading/billing_service_interface/web/payment_method_priority";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "PaymentMethodsListPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_Edit_RedirectFailed_RedirectSuccess";
      private cut: PaymentMethodsListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        let windowMock = {
          location: { href: "fake_url" },
        };
        let requestCaptured: any;
        let serviceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            requestCaptured = request;
            return {
              paymentMethods: [
                {
                  paymentMethodId: "id1",
                  priority: PaymentMethodPriority.PRIMARY,
                  card: {
                    brand: CardBrand.AMEX,
                    expMonth: 11,
                    expYear: 2023,
                    lastFourDigits: "1234",
                  },
                },
                {
                  paymentMethodId: "id2",
                  priority: PaymentMethodPriority.BACKUP,
                  card: {
                    brand: CardBrand.DINERS,
                    expMonth: 12,
                    expYear: 2023,
                    lastFourDigits: "1111",
                  },
                },
                {
                  paymentMethodId: "id3",
                  priority: PaymentMethodPriority.NORMAL,
                  card: {
                    brand: CardBrand.DISCOVER,
                    expMonth: 1,
                    expYear: 2024,
                    lastFourDigits: "0000",
                  },
                },
              ],
            } as ListPaymentMethodsResponse;
          }
        })();
        this.cut = new PaymentMethodsListPage(
          windowMock as any,
          (paymentMethod) => new CardPaymentItemMock(paymentMethod),
          serviceClientMock
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve())
        );

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(LIST_PAYMENT_METHODS),
          "service"
        );
        assertThat(
          requestCaptured.body,
          eqMessage({}, LIST_PAYMENT_METHODS_REQUEST_BODY),
          "request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_list_page_default.png"),
          path.join(__dirname, "/golden/payment_methods_list_page_default.png"),
          path.join(__dirname, "/payment_methods_list_page_default_diff.png")
        );

        // Prepare
        let paymentMethodCaptured: PaymentMethodMasked;
        this.cut.on("update", (paymentMethod) => {
          paymentMethodCaptured = paymentMethod;
        });

        // Execute
        this.cut.paymentMethodItems[1].emit(
          "update",
          {
            paymentMethodId: "id2",
            priority: PaymentMethodPriority.BACKUP,
            card: {
              brand: CardBrand.DINERS,
              expMonth: 12,
              expYear: 2023,
              lastFourDigits: "1111",
            },
          },
          false
        );

        // Verify
        assertThat(
          paymentMethodCaptured,
          eqMessage(
            {
              paymentMethodId: "id2",
              priority: PaymentMethodPriority.BACKUP,
              card: {
                brand: CardBrand.DINERS,
                expMonth: 12,
                expYear: 2023,
                lastFourDigits: "1111",
              },
            },
            PAYMENT_METHOD_MASKED
          ),
          "card"
        );

        // Prepare
        let resolveCaptured: () => void;
        serviceClientMock.send = async (request: any) => {
          requestCaptured = request;
          await new Promise<void>((resolve) => {
            resolveCaptured = resolve;
          });
          throw new Error("fake error");
        };

        // Execute
        this.cut.addPaymentMethodButton.click();

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(CREATE_STRIPE_SESSION_TO_ADD_PAYMENT_METHOD),
          "create session service"
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              backUrl: "fake_url",
            },
            CREATE_STRIPE_SESSION_TO_ADD_PAYMENT_METHOD_REQUEST_BODY
          ),
          "create session request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_list_page_redirecting.png"),
          path.join(
            __dirname,
            "/golden/payment_methods_list_page_redirecting.png"
          ),
          path.join(
            __dirname,
            "/payment_methods_list_page_redirecting_diff.png"
          )
        );

        // Execute
        resolveCaptured();
        await new Promise<void>((resolve) =>
          this.cut.once("redirectError", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_list_page_redirect_error.png"),
          path.join(
            __dirname,
            "/golden/payment_methods_list_page_redirect_error.png"
          ),
          path.join(
            __dirname,
            "/payment_methods_list_page_redirect_error_diff.png"
          )
        );

        // Prepare
        serviceClientMock.send = async (request: any) => {
          return {
            redirectUrl: "redirect_url",
          } as CreateStripeSessionToAddPaymentMethodResponse;
        };

        // Execute
        this.cut.addPaymentMethodButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("redirected", resolve)
        );

        // Verify
        assertThat(
          windowMock.location.href,
          eq("redirect_url"),
          "redirect url"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_list_page_redirected.png"),
          path.join(
            __dirname,
            "/golden/payment_methods_list_page_redirected.png"
          ),
          path.join(__dirname, "/payment_methods_list_page_redirected_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
