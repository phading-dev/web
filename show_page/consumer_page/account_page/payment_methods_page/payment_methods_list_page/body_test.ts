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
} from "@phading/commerce_service_interface/consumer/frontend/interface";
import {
  CardBrand,
  PAYMENT_METHOD_MASKED,
  PaymentMethodMasked,
} from "@phading/commerce_service_interface/consumer/frontend/payment_method_masked";
import { PaymentMethodPriority } from "@phading/commerce_service_interface/consumer/frontend/payment_method_priority";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import {
  eqRequestMessageBody,
  eqService,
} from "@selfage/web_service_client/request_test_matcher";
import "../../../../../common/normalize_body";

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "PaymentMethodsListPageTest",
  environment: {
    setUp: () => {
      container = E.div({
        style: `width: 100vw; height: 100vh;`,
      });
      document.body.append(container);
    },
    tearDown: () => {
      container.remove();
    },
  },
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
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = {
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
        this.cut = new PaymentMethodsListPage(
          windowMock as any,
          (paymentMethod) => new CardPaymentItemMock(paymentMethod),
          webServiceClientMock,
        );

        // Execute
        container.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        assertThat(
          webServiceClientMock.request,
          eqService(LIST_PAYMENT_METHODS),
          "list payment methods",
        );
        assertThat(
          webServiceClientMock.request,
          eqRequestMessageBody({}, LIST_PAYMENT_METHODS_REQUEST_BODY),
          "list request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_list_page_default.png"),
          path.join(__dirname, "/golden/payment_methods_list_page_default.png"),
          path.join(__dirname, "/payment_methods_list_page_default_diff.png"),
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
          false,
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
            PAYMENT_METHOD_MASKED,
          ),
          "card",
        );

        // Prepare
        let requestCaptured: any;
        let resolveCaptured: () => void;
        webServiceClientMock.send = async (request: any) => {
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
          "create session service",
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              backUrl: "fake_url",
            },
            CREATE_STRIPE_SESSION_TO_ADD_PAYMENT_METHOD_REQUEST_BODY,
          ),
          "create session request",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_list_page_redirecting.png"),
          path.join(
            __dirname,
            "/golden/payment_methods_list_page_redirecting.png",
          ),
          path.join(
            __dirname,
            "/payment_methods_list_page_redirecting_diff.png",
          ),
        );

        // Execute
        resolveCaptured();
        await new Promise<void>((resolve) =>
          this.cut.once("redirectError", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_list_page_redirect_error.png"),
          path.join(
            __dirname,
            "/golden/payment_methods_list_page_redirect_error.png",
          ),
          path.join(
            __dirname,
            "/payment_methods_list_page_redirect_error_diff.png",
          ),
        );

        // Prepare
        webServiceClientMock.send = async (request: any) => {
          return {
            redirectUrl: "redirect_url",
          } as CreateStripeSessionToAddPaymentMethodResponse;
        };

        // Execute
        this.cut.addPaymentMethodButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("redirected", resolve),
        );

        // Verify
        assertThat(
          windowMock.location.href,
          eq("redirect_url"),
          "redirect url",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_list_page_redirected.png"),
          path.join(
            __dirname,
            "/golden/payment_methods_list_page_redirected.png",
          ),
          path.join(
            __dirname,
            "/payment_methods_list_page_redirected_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
