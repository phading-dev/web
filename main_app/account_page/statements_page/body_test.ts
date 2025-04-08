import "../../../common/normalize_body";
import path = require("path");
import { setPhoneView, setTabletView } from "../../../common/view_port";
import { StatementsPage } from "./body";
import {
  LIST_TRANSACTION_STATEMENTS,
  LIST_TRANSACTION_STATEMENTS_REQUEST_BODY,
  ListTransactionStatementsResponse,
} from "@phading/commerce_service_interface/web/statements/interface";
import { ProductID } from "@phading/price";
import { AmountType } from "@phading/price/amount_type";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "StatementsPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "PhoneView_BillingStatementsEmptyList_InvalidRange_ListStatements_ExpandLineItems";
      private cut: StatementsPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          statements: [],
        } as ListTransactionStatementsResponse;
        // 2025-04-05T08:xx:xx.000Z
        this.cut = new StatementsPage(
          serviceClientMock,
          () => new Date(1743867646000),
          false,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("listed", () => resolve()),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_TRANSACTION_STATEMENTS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startMonth: "2025-03",
              endMonth: "2025-03",
            },
            LIST_TRANSACTION_STATEMENTS_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/statements_page_billing_no_statements.png"),
          path.join(
            __dirname,
            "/golden/statements_page_billing_no_statements.png",
          ),
          path.join(
            __dirname,
            "/statements_page_billing_no_statements_diff.png",
          ),
        );

        // Execute
        this.cut.monthRangeInput.val.startMonthInput.val.value = "2025-04";
        this.cut.monthRangeInput.val.startMonthInput.val.dispatchEvent(
          new Event("input"),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/statements_page_billing_invalid_range.png"),
          path.join(
            __dirname,
            "/golden/statements_page_billing_invalid_range.png",
          ),
          path.join(
            __dirname,
            "/statements_page_billing_invalid_range_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.response = {
          statements: [
            {
              month: "2025-08",
              currency: "USD",
              totalAmount: 816,
              totalAmountType: AmountType.DEBIT,
              items: [
                {
                  productID: ProductID.SHOW,
                  amount: 816,
                  quantity: 1020,
                  amountType: AmountType.DEBIT,
                  unit: "seconds",
                },
                {
                  productID: ProductID.STORAGE,
                  amount: 38000,
                  quantity: 988880,
                  amountType: AmountType.DEBIT,
                  unit: "MiB",
                },
              ],
            },
            {
              month: "2025-06",
              currency: "USD",
              totalAmount: 1200,
              totalAmountType: AmountType.DEBIT,
              items: [
                {
                  productID: ProductID.SHOW,
                  amount: 1200,
                  quantity: 240000,
                  amountType: AmountType.DEBIT,
                  unit: "seconds",
                },
              ],
            },
          ],
        } as ListTransactionStatementsResponse;

        // Execute
        this.cut.monthRangeInput.val.endMonthInput.val.value = "2026-04";
        this.cut.monthRangeInput.val.endMonthInput.val.dispatchEvent(
          new Event("input"),
        );
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startMonth: "2025-04",
              endMonth: "2026-04",
            },
            LIST_TRANSACTION_STATEMENTS_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/statements_page_billing_list_statements.png"),
          path.join(
            __dirname,
            "/golden/statements_page_billing_list_statements.png",
          ),
          path.join(
            __dirname,
            "/statements_page_billing_list_statements_diff.png",
          ),
        );

        // Execute
        this.cut.statementLines[0].dispatchEvent(new Event("click"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/statements_page_billing_expand_line_item.png"),
          path.join(
            __dirname,
            "/golden/statements_page_billing_expand_line_item.png",
          ),
          path.join(
            __dirname,
            "/statements_page_billing_expand_line_item_diff.png",
          ),
        );

        // Execute
        this.cut.statementLines[0].dispatchEvent(new Event("click"));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/statements_page_billing_collapse_line_items.png",
          ),
          path.join(
            __dirname,
            "/golden/statements_page_billing_list_statements.png",
          ),
          path.join(
            __dirname,
            "/statements_page_billing_collapse_line_items_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_EarningsStatements_ExpandLineItemsWithMixedTypes";
      private cut: StatementsPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          statements: [
            {
              month: "2025-08",
              currency: "USD",
              totalAmount: 816,
              totalAmountType: AmountType.CREDIT,
              items: [
                {
                  productID: ProductID.SHOW_CREDIT,
                  amount: 816,
                  quantity: 1020,
                  amountType: AmountType.CREDIT,
                  unit: "seconds",
                },
              ],
            },
            {
              month: "2025-06",
              currency: "USD",
              totalAmount: 2400,
              totalAmountType: AmountType.DEBIT,
              items: [
                {
                  productID: ProductID.SHOW_CREDIT,
                  amount: 1200,
                  quantity: 240000,
                  amountType: AmountType.CREDIT,
                  unit: "seconds",
                },
                {
                  productID: ProductID.STORAGE,
                  amount: 38000,
                  quantity: 988880,
                  amountType: AmountType.DEBIT,
                  unit: "MiB x hour",
                },
              ],
            },
          ],
        } as ListTransactionStatementsResponse;
        // 2025-04-05T08:xx:xx.000Z
        this.cut = new StatementsPage(
          serviceClientMock,
          () => new Date(1743867646000),
          true,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("listed", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/statements_page_earnings_list_statements.png"),
          path.join(
            __dirname,
            "/golden/statements_page_earnings_list_statements.png",
          ),
          path.join(
            __dirname,
            "/statements_page_earnings_list_statements_diff.png",
          ),
        );

        // Execute
        this.cut.statementLines[1].dispatchEvent(new Event("click"));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/statements_page_earnings_expand_line_item.png",
          ),
          path.join(
            __dirname,
            "/golden/statements_page_earnings_expand_line_item.png",
          ),
          path.join(
            __dirname,
            "/statements_page_earnings_expand_line_item_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
