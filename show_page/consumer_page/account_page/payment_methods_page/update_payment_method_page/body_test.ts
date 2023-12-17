import path = require("path");
import { UpdatePaymentMethodPage } from "./body";
import {
  DELETE_PAYMENT_METHOD,
  DELETE_PAYMENT_METHOD_REQUEST_BODY,
  DeletePaymentMethodResponse,
  UPDATE_PAYMENT_METHOD,
  UPDATE_PAYMENT_METHOD_REQUEST_BODY,
  UpdatePaymentMethodRequestBody,
  UpdatePaymentMethodResponse,
} from "@phading/billing_service_interface/interface";
import { CardBrand } from "@phading/billing_service_interface/payment_method_masked";
import { PaymentMethodPriority } from "@phading/billing_service_interface/payment_method_priority";
import { CardUpdates } from "@phading/billing_service_interface/payment_method_updates";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

class ExpDateParsingTestCase implements TestCase {
  private cut: UpdatePaymentMethodPage;
  public constructor(
    public name: string,
    private expMonthValue: string,
    private expYearValue: string,
    private expectedCard?: CardUpdates
  ) {}
  public async execute() {
    // Prepare
    let requestBodyCaptured: UpdatePaymentMethodRequestBody;
    let webServiceClientMock = new (class extends WebServiceClient {
      public constructor() {
        super(undefined, undefined);
      }
      public async send(request: any) {
        requestBodyCaptured = request.body;
        return {} as UpdatePaymentMethodResponse;
      }
    })();
    this.cut = new UpdatePaymentMethodPage(webServiceClientMock, {
      id: "id1",
      priority: PaymentMethodPriority.BACKUP,
      card: {
        brand: CardBrand.AMEX,
        lastFourDigits: "1234",
      },
    });
    document.body.append(this.cut.body);
    menuBodyContainer.append(this.cut.menuBody);

    // Execute
    this.cut.expMonthInput.value = this.expMonthValue;
    this.cut.expMonthInput.dispatchEvent(new Event("input"));
    this.cut.expYearInput.value = this.expYearValue;
    this.cut.expYearInput.dispatchEvent(new Event("input"));

    // Verify
    this.cut.updateButton.click();
    await new Promise<void>((resolve) => this.cut.once("updated", resolve));
    assertThat(
      requestBodyCaptured.paymentMethodUpdates.card,
      eqMessage(this.expectedCard, UPDATE_PAYMENT_METHOD_REQUEST_BODY),
      "exp date"
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

let menuBodyContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "UpdatePaymentMethodPageTest",
  environment: {
    setUp: () => {
      menuBodyContainer = E.div({});
      document.body.append(menuBodyContainer);
    },
    tearDown: () => {
      menuBodyContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name =
        "Default_SetExpDate_SetPrimary_SetNotInUse_SetBackup_UpdateFailure_UpdateSuccess";
      private cut: UpdatePaymentMethodPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        this.cut = new UpdatePaymentMethodPage(webServiceClientMock, {
          id: "id1",
          priority: PaymentMethodPriority.BACKUP,
          card: {
            brand: CardBrand.AMEX,
            lastFourDigits: "1234",
          },
        });

        // Execute
        document.body.append(this.cut.body);
        menuBodyContainer.append(this.cut.menuBody);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_default.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_default.png"
          ),
          path.join(__dirname, "/update_payment_method_page_default_diff.png")
        );

        // Execute
        this.cut.expMonthInput.value = "12";
        this.cut.expMonthInput.dispatchEvent(new Event("input"));
        this.cut.expYearInput.value = "2020";
        this.cut.expYearInput.dispatchEvent(new Event("input"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_exp_input.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_exp_input.png"
          ),
          path.join(__dirname, "/update_payment_method_page_exp_input_diff.png")
        );

        // Execute
        this.cut.priorityOptionInput.optionButtons[0].click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_primary.png"
          ),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_set_as_primary.png"
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_primary_diff.png"
          )
        );

        // Execute
        this.cut.priorityOptionInput.optionButtons[2].click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_not_in_use.png"
          ),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_set_as_not_in_use.png"
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_not_in_use_diff.png"
          )
        );

        // Execute
        this.cut.priorityOptionInput.optionButtons[1].click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_set_as_backup.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_set_as_backup.png"
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_backup_diff.png"
          )
        );

        // Prepare
        let requestCaptured: any;
        webServiceClientMock.send = async (request: any) => {
          requestCaptured = request;
          throw new Error("Fake error");
        };

        // Execute
        this.cut.updateButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve)
        );

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(UPDATE_PAYMENT_METHOD),
          "service"
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              paymentMethodUpdates: {
                id: "id1",
                priority: PaymentMethodPriority.BACKUP,
                card: { expMonth: 12, expYear: 2020 },
              },
            },
            UPDATE_PAYMENT_METHOD_REQUEST_BODY
          ),
          "request body"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_update_error.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_update_error.png"
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_update_error_diff.png"
          )
        );

        // Prepare
        webServiceClientMock.send = async (request: any) => {
          return {} as UpdatePaymentMethodResponse;
        };

        // Execute
        this.cut.updateButton.click();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_payment_method_page_update_success.png"
          ),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_update_success.png"
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_update_success_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DeleteFailure_DeleteSuccess";
      private cut: UpdatePaymentMethodPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        this.cut = new UpdatePaymentMethodPage(webServiceClientMock, {
          id: "id1",
          priority: PaymentMethodPriority.BACKUP,
          card: {
            brand: CardBrand.AMEX,
            lastFourDigits: "1234",
          },
        });

        // Execute
        document.body.append(this.cut.body);
        menuBodyContainer.append(this.cut.menuBody);

        // Prepare
        let requestCaptured: any;
        webServiceClientMock.send = async (request: any) => {
          requestCaptured = request;
          throw new Error("Fake error");
        };

        // Execute
        this.cut.deleteButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("deleteError", resolve)
        );

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(DELETE_PAYMENT_METHOD),
          "service"
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              id: "id1",
            },
            DELETE_PAYMENT_METHOD_REQUEST_BODY
          ),
          "request body"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_delete_error.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_delete_error.png"
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_delete_error_diff.png"
          )
        );

        // Prepare
        webServiceClientMock.send = async (request: any) => {
          return {} as DeletePaymentMethodResponse;
        };

        // Execute
        this.cut.deleteButton.click();
        await new Promise<void>((resolve) => this.cut.once("deleted", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_payment_method_page_delete_success.png"
          ),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_delete_success.png"
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_delete_success_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new ExpDateParsingTestCase("ExpMonthNan", "ss", "2020", undefined),
    new ExpDateParsingTestCase("ExpMonthTooSmall", "0", "2020", undefined),
    new ExpDateParsingTestCase("ExpMonthTooLarge", "13", "2020", undefined),
    new ExpDateParsingTestCase("ExpYearNan", "12", "ss", undefined),
    new ExpDateParsingTestCase("ExpYearTooSmall", "12", "0", undefined),
    new ExpDateParsingTestCase("ExpDateValid", "12", "2020", {
      expMonth: 12,
      expYear: 2020,
    }),
    new (class implements TestCase {
      public name = "Back";
      private cut: UpdatePaymentMethodPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        this.cut = new UpdatePaymentMethodPage(webServiceClientMock, {
          id: "id1",
          priority: PaymentMethodPriority.BACKUP,
          card: {
            brand: CardBrand.AMEX,
            lastFourDigits: "1234",
          },
        });
        document.body.append(this.cut.body);
        menuBodyContainer.append(this.cut.menuBody);
        let goBack = false;
        this.cut.on("back", () => (goBack = true));

        // Execute
        this.cut.backMenuItem.click();

        // Verify
        assertThat(goBack, eq(true), "go back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
