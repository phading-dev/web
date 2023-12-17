import path = require("path");
import { PaymentMethodsPage } from "./body";
import { PaymentMethodsListPageMock } from "./payment_methods_list_page/body_mock";
import { UpdatePaymentMethodPageMock } from "./update_payment_method_page/body_mock";
import {
  CardBrand,
  PaymentMethodMasked,
} from "@phading/billing_service_interface/payment_method_masked";
import { PaymentMethodPriority } from "@phading/billing_service_interface/payment_method_priority";
import { E } from "@selfage/element/factory";
import {
  deleteFile,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../../common/normalize_body";

let menBodyContainer: HTMLDivElement;

class NavigateToUpdateAndBack implements TestCase {
  public constructor(public name: string, private eventName: string) {}
  private cut: PaymentMethodsPage;
  public async execute() {
    // Prepare
    await setViewport(800, 600);
    this.cut = new PaymentMethodsPage(
      () => new PaymentMethodsListPageMock(),
      (paymentMethod) => new UpdatePaymentMethodPageMock(paymentMethod),
      (...bodies) => document.body.append(...bodies),
      (...bodies) => menBodyContainer.append(...bodies)
    );
    await screenshot(
      path.join(__dirname, "/payment_methods_page_baseline.png")
    );
    this.cut.paymentMethodsListPage.emit("update", {
      id: "id1",
      priority: PaymentMethodPriority.PRIMARY,
      card: {
        brand: CardBrand.AMEX,
        lastFourDigits: "1234",
        expMonth: 12,
        expYear: 202,
      },
    } as PaymentMethodMasked);

    // Execute
    this.cut.updatePaymentMethodPage.emit(this.eventName);
    // await new Promise<void>((resolve) => this.cut.paymentMethodsListPage.once('loaded', resolve));

    // Verify
    await asyncAssertScreenshot(
      path.join(__dirname, "/payment_methods_page_navigate_back.png"),
      path.join(__dirname, "/payment_methods_page_baseline.png"),
      path.join(__dirname, "/payment_methods_page_navigate_back_diff.png")
    );

    // Cleanup
    await deleteFile(
      path.join(__dirname, "/payment_methods_page_baseline.png")
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "PaymentMethodsPageTest",
  environment: {
    setUp: () => {
      menBodyContainer = E.div({
        style: "display: fixed; left: 0; top: 0;",
      });
      document.body.append(menBodyContainer);
    },
    tearDown: () => {
      menBodyContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: PaymentMethodsPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);

        // Execute
        this.cut = new PaymentMethodsPage(
          () => new PaymentMethodsListPageMock(),
          (paymentMethod) => new UpdatePaymentMethodPageMock(paymentMethod),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menBodyContainer.append(...bodies)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_page_default.png"),
          path.join(__dirname, "/golden/payment_methods_page_default.png"),
          path.join(__dirname, "/payment_methods_page_default_diff.png")
        );

        // Execute
        this.cut.paymentMethodsListPage.emit("update", {
          id: "id1",
          priority: PaymentMethodPriority.PRIMARY,
          card: {
            brand: CardBrand.AMEX,
            lastFourDigits: "1234",
            expMonth: 12,
            expYear: 202,
          },
        } as PaymentMethodMasked);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payment_methods_page_update.png"),
          path.join(__dirname, "/golden/payment_methods_page_update.png"),
          path.join(__dirname, "/payment_methods_page_update_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new NavigateToUpdateAndBack("BackButton", "back"),
    new NavigateToUpdateAndBack("Updated", "updated"),
    new NavigateToUpdateAndBack("Deleted", "deleted"),
  ],
});
