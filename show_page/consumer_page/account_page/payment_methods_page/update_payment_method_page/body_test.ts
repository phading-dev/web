import path = require("path");
import { UpdatePaymentMethodPage } from "./body";
import {
  DELETE_PAYMENT_METHOD,
  DELETE_PAYMENT_METHOD_REQUEST_BODY,
  UPDATE_PAYMENT_METHOD,
  UPDATE_PAYMENT_METHOD_REQUEST_BODY,
} from "@phading/commerce_service_interface/consumer/frontend/interface";
import { CardBrand } from "@phading/commerce_service_interface/consumer/frontend/payment_method_masked";
import { PaymentMethodPriority } from "@phading/commerce_service_interface/consumer/frontend/payment_method_priority";
import { CardUpdates } from "@phading/commerce_service_interface/consumer/frontend/payment_method_updates";
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

class ExpDateParsingTestCase implements TestCase {
  private cut: UpdatePaymentMethodPage;
  public constructor(
    public name: string,
    private expMonthValue: string,
    private expYearValue: string,
    private actualFile: string,
    private expectedFile: string,
    private diffFile: string,
    private expectedCard?: CardUpdates,
  ) {}
  public async execute() {
    // Prepare
    let webServiceClientMock = new WebServiceClientMock();
    this.cut = new UpdatePaymentMethodPage(webServiceClientMock, {
      paymentMethodId: "id1",
      priority: PaymentMethodPriority.BACKUP,
      card: {
        brand: CardBrand.AMEX,
        lastFourDigits: "1234",
        expMonth: 9,
        expYear: 2023,
      },
    });
    document.body.append(this.cut.body);

    // Execute
    this.cut.expMonthInput.val.value = this.expMonthValue;
    this.cut.expMonthInput.val.dispatchInputEvent();
    this.cut.expYearInput.val.value = this.expYearValue;
    this.cut.expYearInput.val.dispatchInputEvent();

    // Verify
    await asyncAssertScreenshot(
      this.actualFile,
      this.expectedFile,
      this.diffFile,
    );

    // Verify
    if (this.expectedCard) {
      this.cut.inputFormPage.submit();
      await new Promise<void>((resolve) => this.cut.once("updated", resolve));
      assertThat(
        webServiceClientMock.request,
        eqRequestMessageBody(
          {
            paymentMethodUpdates: {
              paymentMethodId: "id1",
              priority: PaymentMethodPriority.BACKUP,
              card: this.expectedCard,
            },
          },
          UPDATE_PAYMENT_METHOD_REQUEST_BODY,
        ),
        "exp date",
      );
    }
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "UpdatePaymentMethodPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_SetExpDate_SetPrimary_SetNotInUse_SetBackup_UpdateFailure_UpdateSuccess";
      private cut: UpdatePaymentMethodPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        let webServiceClientMock = new WebServiceClientMock();
        this.cut = new UpdatePaymentMethodPage(webServiceClientMock, {
          paymentMethodId: "id1",
          priority: PaymentMethodPriority.BACKUP,
          card: {
            brand: CardBrand.AMEX,
            lastFourDigits: "1234",
            expMonth: 9,
            expYear: 2023,
          },
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_default.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_default.png",
          ),
          path.join(__dirname, "/update_payment_method_page_default_diff.png"),
        );

        // Execute
        this.cut.expMonthInput.val.value = "12";
        this.cut.expMonthInput.val.dispatchInputEvent();
        this.cut.expYearInput.val.value = "2020";
        this.cut.expYearInput.val.dispatchInputEvent();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_exp_input.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_exp_input.png",
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_exp_input_diff.png",
          ),
        );

        // Execute
        this.cut.priorityOptionInput.val.optionButtons[0].click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_primary.png",
          ),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_set_as_primary.png",
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_primary_diff.png",
          ),
        );

        // Execute
        this.cut.priorityOptionInput.val.optionButtons[2].click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_not_in_use.png",
          ),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_set_as_not_in_use.png",
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_not_in_use_diff.png",
          ),
        );

        // Execute
        this.cut.priorityOptionInput.val.optionButtons[1].click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_set_as_backup.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_set_as_backup.png",
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_set_as_backup_diff.png",
          ),
        );

        // Prepare
        webServiceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve),
        );

        // Verify
        assertThat(
          webServiceClientMock.request,
          eqService(UPDATE_PAYMENT_METHOD),
          "updaate payment method",
        );
        assertThat(
          webServiceClientMock.request,
          eqRequestMessageBody(
            {
              paymentMethodUpdates: {
                paymentMethodId: "id1",
                priority: PaymentMethodPriority.BACKUP,
                card: { expMonth: 12, expYear: 2020 },
              },
            },
            UPDATE_PAYMENT_METHOD_REQUEST_BODY,
          ),
          "update request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_update_error.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_update_error.png",
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_update_error_diff.png",
          ),
        );

        // Prepare
        webServiceClientMock.error = undefined;
        webServiceClientMock.response = {};

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_payment_method_page_update_success.png",
          ),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_update_success.png",
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_update_success_diff.png",
          ),
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
        let webServiceClientMock = new WebServiceClientMock();
        this.cut = new UpdatePaymentMethodPage(webServiceClientMock, {
          paymentMethodId: "id1",
          priority: PaymentMethodPriority.BACKUP,
          card: {
            brand: CardBrand.AMEX,
            lastFourDigits: "1234",
            expMonth: 9,
            expYear: 2023,
          },
        });

        // Execute
        document.body.append(this.cut.body);

        // Prepare
        webServiceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickSecondaryBlockingButton();
        await new Promise<void>((resolve) =>
          this.cut.once("deleteError", resolve),
        );

        // Verify
        assertThat(
          webServiceClientMock.request,
          eqService(DELETE_PAYMENT_METHOD),
          "delete payment method",
        );
        assertThat(
          webServiceClientMock.request,
          eqRequestMessageBody(
            {
              paymentMethodId: "id1",
            },
            DELETE_PAYMENT_METHOD_REQUEST_BODY,
          ),
          "delete request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_payment_method_page_delete_error.png"),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_delete_error.png",
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_delete_error_diff.png",
          ),
        );

        // Prepare
        webServiceClientMock.error = undefined;
        webServiceClientMock.response = {};

        // Execute
        this.cut.inputFormPage.clickSecondaryBlockingButton();
        await new Promise<void>((resolve) => this.cut.once("deleted", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_payment_method_page_delete_success.png",
          ),
          path.join(
            __dirname,
            "/golden/update_payment_method_page_delete_success.png",
          ),
          path.join(
            __dirname,
            "/update_payment_method_page_delete_success_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new ExpDateParsingTestCase(
      "ExpMonthNan",
      "ss",
      "2020",
      path.join(__dirname, "/update_payment_method_page_exp_month_nan.png"),
      path.join(
        __dirname,
        "/golden/update_payment_method_page_exp_month_nan.png",
      ),
      path.join(
        __dirname,
        "/update_payment_method_page_exp_month_nan_diff.png",
      ),
    ),
    new ExpDateParsingTestCase(
      "ExpMonthTooSmall",
      "0",
      "2020",
      path.join(
        __dirname,
        "/update_payment_method_page_exp_month_too_small.png",
      ),
      path.join(
        __dirname,
        "/golden/update_payment_method_page_exp_month_too_small.png",
      ),
      path.join(
        __dirname,
        "/update_payment_method_page_exp_month_too_small_diff.png",
      ),
    ),
    new ExpDateParsingTestCase(
      "ExpMonthTooLarge",
      "13",
      "2020",
      path.join(
        __dirname,
        "/update_payment_method_page_exp_month_too_large.png",
      ),
      path.join(
        __dirname,
        "/golden/update_payment_method_page_exp_month_too_large.png",
      ),
      path.join(
        __dirname,
        "/update_payment_method_page_exp_month_too_large_diff.png",
      ),
    ),
    new ExpDateParsingTestCase(
      "ExpYearNan",
      "12",
      "ss",
      path.join(__dirname, "/update_payment_method_page_exp_year_nan.png"),
      path.join(
        __dirname,
        "/golden/update_payment_method_page_exp_year_nan.png",
      ),
      path.join(__dirname, "/update_payment_method_page_exp_year_nan_diff.png"),
    ),
    new ExpDateParsingTestCase(
      "ExpYearTooSmall",
      "12",
      "0",
      path.join(
        __dirname,
        "/update_payment_method_page_exp_year_too_small.png",
      ),
      path.join(
        __dirname,
        "/golden/update_payment_method_page_exp_year_too_small.png",
      ),
      path.join(
        __dirname,
        "/update_payment_method_page_exp_year_too_small_diff.png",
      ),
    ),
    new ExpDateParsingTestCase(
      "ExpYearTooLarge",
      "12",
      "10000",
      path.join(
        __dirname,
        "/update_payment_method_page_exp_year_too_large.png",
      ),
      path.join(
        __dirname,
        "/golden/update_payment_method_page_exp_year_too_large.png",
      ),
      path.join(
        __dirname,
        "/update_payment_method_page_exp_year_too_large_diff.png",
      ),
    ),
    new ExpDateParsingTestCase(
      "ExpDateValid",
      "1",
      "2020",
      path.join(__dirname, "/update_payment_method_page_exp_date_valid.png"),
      path.join(
        __dirname,
        "/golden/update_payment_method_page_exp_date_valid.png",
      ),
      path.join(
        __dirname,
        "/update_payment_method_page_exp_date_valid_diff.png",
      ),
      {
        expMonth: 1,
        expYear: 2020,
      },
    ),
    new (class implements TestCase {
      public name = "Back";
      private cut: UpdatePaymentMethodPage;
      public async execute() {
        // Prepare
        this.cut = new UpdatePaymentMethodPage(new WebServiceClientMock(), {
          paymentMethodId: "id1",
          priority: PaymentMethodPriority.BACKUP,
          card: {
            brand: CardBrand.AMEX,
            lastFourDigits: "1234",
            expMonth: 9,
            expYear: 2023,
          },
        });
        document.body.append(this.cut.body);
        let goBack = false;
        this.cut.on("back", () => (goBack = true));

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(goBack, eq(true), "go back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
