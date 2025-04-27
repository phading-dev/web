import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { AddCardPaymentItem, CardPaymentItem } from "./card_payment_item";
import { CardBrand } from "@phading/commerce_service_interface/web/payment/payment_method_masked";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

class CardBrandTestCase implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private cardBrand: CardBrand,
    private screenshotPath: string,
    private goldenFilePath: string,
    private diffFilePath: string,
  ) {}
  public async execute() {
    // Prepare
    await setTabletView();
    this.container = E.div({
      style: `background-color: black;`,
    });
    document.body.append(this.container);
    let timeEpochInMillisecond = 1701505138000; // 2023-12-02

    // Execute
    let cut = new CardPaymentItem(timeEpochInMillisecond, {
      card: {
        brand: this.cardBrand,
        expMonth: 12,
        expYear: 2023,
        lastFourDigits: "1111",
      },
    });
    this.container.append(cut.body);

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.goldenFilePath,
      this.diffFilePath,
      {
        fullPage: true,
      },
    );
  }
  public tearDown() {
    this.container.remove();
  }
}

TEST_RUNNER.run({
  name: "CardPaymentItem",
  cases: [
    new CardBrandTestCase(
      "Amex",
      CardBrand.AMEX,
      path.join(__dirname, "/card_payment_card_amex.png"),
      path.join(__dirname, "/golden/card_payment_card_amex.png"),
      path.join(__dirname, "/card_payment_card_amex_diff.png"),
    ),
    new CardBrandTestCase(
      "Diners",
      CardBrand.DINERS,
      path.join(__dirname, "/card_payment_card_diners.png"),
      path.join(__dirname, "/golden/card_payment_card_diners.png"),
      path.join(__dirname, "/card_payment_card_diners_diff.png"),
    ),
    new CardBrandTestCase(
      "Discover",
      CardBrand.DISCOVER,
      path.join(__dirname, "/card_payment_card_discover.png"),
      path.join(__dirname, "/golden/card_payment_card_discover.png"),
      path.join(__dirname, "/card_payment_card_discover_diff.png"),
    ),
    new CardBrandTestCase(
      "JCB",
      CardBrand.JCB,
      path.join(__dirname, "/card_payment_card_jcb.png"),
      path.join(__dirname, "/golden/card_payment_card_jcb.png"),
      path.join(__dirname, "/card_payment_card_jcb_diff.png"),
    ),
    new CardBrandTestCase(
      "Mastercard",
      CardBrand.MASTERCARD,
      path.join(__dirname, "/card_payment_card_mastercard.png"),
      path.join(__dirname, "/golden/card_payment_card_mastercard.png"),
      path.join(__dirname, "/card_payment_card_mastercard_diff.png"),
    ),
    new CardBrandTestCase(
      "Unionpay",
      CardBrand.UNIONPAY,
      path.join(__dirname, "/card_payment_card_unionpay.png"),
      path.join(__dirname, "/golden/card_payment_card_unionpay.png"),
      path.join(__dirname, "/card_payment_card_unionpay_diff.png"),
    ),
    new CardBrandTestCase(
      "Visa",
      CardBrand.VISA,
      path.join(__dirname, "/card_payment_card_visa.png"),
      path.join(__dirname, "/golden/card_payment_card_visa.png"),
      path.join(__dirname, "/card_payment_card_visa_diff.png"),
    ),
    new CardBrandTestCase(
      "Unknown",
      undefined,
      path.join(__dirname, "/card_payment_card_unknown.png"),
      path.join(__dirname, "/golden/card_payment_card_unknown.png"),
      path.join(__dirname, "/card_payment_card_unknown_diff.png"),
    ),
    new (class implements TestCase {
      public name = "CardExpired";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: black;`,
        });
        document.body.append(this.container);
        let timeEpochInMillisecond = 1701505138000; // 2023-12-02

        // Execute
        let cut = new CardPaymentItem(timeEpochInMillisecond, {
          card: {
            brand: CardBrand.AMEX,
            expMonth: 11,
            expYear: 2023,
            lastFourDigits: "1111",
          },
        });
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/card_payment_card_expired.png"),
          path.join(__dirname, "/golden/card_payment_card_expired.png"),
          path.join(__dirname, "/card_payment_card_expired_diff.png"),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "AddCard";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: black;`,
        });
        document.body.append(this.container);

        // Execute
        let cut = new AddCardPaymentItem();
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/add_card_payment_item.png"),
          path.join(__dirname, "/golden/add_card_payment_item.png"),
          path.join(__dirname, "/add_card_payment_item_diff.png"),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
