import path = require("path");
import { CardPaymentItem } from "./body";
import {
  CardBrand,
  PAYMENT_METHOD_MASKED,
  PaymentMethodMasked,
} from "@phading/billing_service_interface/web/payment_method_masked";
import { PaymentMethodPriority } from "@phading/billing_service_interface/web/payment_method_priority";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import "../../../../../../common/normalize_body";

class CardBrandTestCase implements TestCase {
  private cut: CardPaymentItem;
  public constructor(
    public name: string,
    private priority: PaymentMethodPriority,
    private cardBrand: CardBrand,
    private screenshotPath: string,
    private goldenFilePath: string,
    private diffFilePath: string
  ) {}
  public async execute() {
    // Prepare
    let timeEpochInMillisecond = 1701505138000; // 2023-12-02

    // Execute
    this.cut = new CardPaymentItem(() => timeEpochInMillisecond, {
      paymentMethodId: "id1",
      priority: this.priority,
      card: {
        brand: this.cardBrand,
        expMonth: 12,
        expYear: 2023,
        lastFourDigits: "1111",
      },
    });
    document.body.append(this.cut.body);

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.goldenFilePath,
      this.diffFilePath,
      {
        fullPage: true,
      }
    );

    // Prepare
    let paymentMethodCaptured: PaymentMethodMasked;
    this.cut.on("update", (paymentMethod) => {
      paymentMethodCaptured = paymentMethod;
    });

    // Execute
    this.cut.body.click();

    // Verify
    assertThat(
      paymentMethodCaptured,
      eqMessage(
        {
          paymentMethodId: "id1",
          priority: this.priority,
          card: {
            brand: this.cardBrand,
            expMonth: 12,
            expYear: 2023,
            lastFourDigits: "1111",
          },
        },
        PAYMENT_METHOD_MASKED
      ),
      "payment method"
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "CardPaymentItem",
  cases: [
    new CardBrandTestCase(
      "Amex",
      PaymentMethodPriority.PRIMARY,
      CardBrand.AMEX,
      path.join(__dirname, "/card_payment_card_amex.png"),
      path.join(__dirname, "/golden/card_payment_card_amex.png"),
      path.join(__dirname, "/card_payment_card_amex_diff.png")
    ),
    new CardBrandTestCase(
      "Diners",
      PaymentMethodPriority.BACKUP,
      CardBrand.DINERS,
      path.join(__dirname, "/card_payment_card_diners.png"),
      path.join(__dirname, "/golden/card_payment_card_diners.png"),
      path.join(__dirname, "/card_payment_card_diners_diff.png")
    ),
    new CardBrandTestCase(
      "Discover",
      PaymentMethodPriority.NORMAL,
      CardBrand.DISCOVER,
      path.join(__dirname, "/card_payment_card_discover.png"),
      path.join(__dirname, "/golden/card_payment_card_discover.png"),
      path.join(__dirname, "/card_payment_card_discover_diff.png")
    ),
    new CardBrandTestCase(
      "JCB",
      PaymentMethodPriority.NORMAL,
      CardBrand.JCB,
      path.join(__dirname, "/card_payment_card_jcb.png"),
      path.join(__dirname, "/golden/card_payment_card_jcb.png"),
      path.join(__dirname, "/card_payment_card_jcb_diff.png")
    ),
    new CardBrandTestCase(
      "Mastercard",
      PaymentMethodPriority.NORMAL,
      CardBrand.MASTERCARD,
      path.join(__dirname, "/card_payment_card_mastercard.png"),
      path.join(__dirname, "/golden/card_payment_card_mastercard.png"),
      path.join(__dirname, "/card_payment_card_mastercard_diff.png")
    ),
    new CardBrandTestCase(
      "Unionpay",
      PaymentMethodPriority.NORMAL,
      CardBrand.UNIONPAY,
      path.join(__dirname, "/card_payment_card_unionpay.png"),
      path.join(__dirname, "/golden/card_payment_card_unionpay.png"),
      path.join(__dirname, "/card_payment_card_unionpay_diff.png")
    ),
    new CardBrandTestCase(
      "Visa",
      PaymentMethodPriority.NORMAL,
      CardBrand.VISA,
      path.join(__dirname, "/card_payment_card_visa.png"),
      path.join(__dirname, "/golden/card_payment_card_visa.png"),
      path.join(__dirname, "/card_payment_card_visa_diff.png")
    ),
    new CardBrandTestCase(
      "Unknown",
      PaymentMethodPriority.NORMAL,
      CardBrand.UNKNOWN,
      path.join(__dirname, "/card_payment_card_unknown.png"),
      path.join(__dirname, "/golden/card_payment_card_unknown.png"),
      path.join(__dirname, "/card_payment_card_unknown_diff.png")
    ),
    new (class CardBrandTestCase implements TestCase {
      public name = "CardExpired";
      private cut: CardPaymentItem;
      public async execute() {
        // Prepare
        let timeEpochInMillisecond = 1701505138000; // 2023-12-02

        // Execute
        this.cut = new CardPaymentItem(() => timeEpochInMillisecond, {
          paymentMethodId: "id1",
          priority: PaymentMethodPriority.NORMAL,
          card: {
            brand: CardBrand.AMEX,
            expMonth: 11,
            expYear: 2023,
            lastFourDigits: "1111",
          },
        });
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/card_payment_card_expired.png"),
          path.join(__dirname, "/golden/card_payment_card_expired.png"),
          path.join(__dirname, "/card_payment_card_expired_diff.png"),
          {
            fullPage: true,
          }
        );

        // Prepare
        let paymentMethodCaptured: PaymentMethodMasked;
        this.cut.on("update", (paymentMethod) => {
          paymentMethodCaptured = paymentMethod;
        });

        // Execute
        this.cut.body.click();

        // Verify
        assertThat(
          paymentMethodCaptured,
          eqMessage(
            {
              paymentMethodId: "id1",
              priority: PaymentMethodPriority.NORMAL,
              card: {
                brand: CardBrand.AMEX,
                expMonth: 11,
                expYear: 2023,
                lastFourDigits: "1111",
              },
            },
            PAYMENT_METHOD_MASKED
          ),
          "payment method"
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
