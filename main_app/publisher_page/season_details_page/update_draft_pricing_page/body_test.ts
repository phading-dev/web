import "../../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { UpdateDraftPricingPage } from "./body";
import {
  UPDATE_SEASON_GRADE,
  UPDATE_SEASON_GRADE_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "UpdateDraftPricingPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_EmptyValue_LargestValue_UpdateError_Updated_Back";
      private cut: UpdateDraftPricingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateDraftPricingPage(
          serviceClientMock,
          () => new Date("2023-10-01"),
          "season1",
          1,
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_draft_pricing_page_default.png"),
          path.join(__dirname, "/golden/update_draft_pricing_page_default.png"),
          path.join(__dirname, "/update_draft_pricing_page_default_diff.png"),
        );

        // Execute
        this.cut.gradeInput.val.value = "";
        this.cut.gradeInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_draft_pricing_page_rate_empty.png"),
          path.join(
            __dirname,
            "/golden/update_draft_pricing_page_rate_empty.png",
          ),
          path.join(
            __dirname,
            "/update_draft_pricing_page_rate_empty_diff.png",
          ),
        );

        // Execute
        this.cut.gradeInput.val.value = "0.9";
        this.cut.gradeInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_draft_pricing_page_rate_invalid.png"),
          path.join(
            __dirname,
            "/golden/update_draft_pricing_page_rate_invalid.png",
          ),
          path.join(
            __dirname,
            "/update_draft_pricing_page_rate_invalid_diff.png",
          ),
        );

        // Execute
        this.cut.gradeInput.val.value = "10000";
        this.cut.gradeInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_draft_pricing_page_rate_too_large.png"),
          path.join(
            __dirname,
            "/golden/update_draft_pricing_page_rate_too_large.png",
          ),
          path.join(
            __dirname,
            "/update_draft_pricing_page_rate_too_large_diff.png",
          ),
        );

        // Execute
        this.cut.gradeInput.val.value = "9999";
        this.cut.gradeInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_draft_pricing_page_rate_largest.png"),
          path.join(
            __dirname,
            "/golden/update_draft_pricing_page_rate_largest.png",
          ),
          path.join(
            __dirname,
            "/update_draft_pricing_page_rate_largest_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.gradeInput.val.dispatchEnter();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UPDATE_SEASON_GRADE),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              grade: 9999,
            },
            UPDATE_SEASON_GRADE_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_draft_pricing_page_update_error.png"),
          path.join(
            __dirname,
            "/golden/update_draft_pricing_page_update_error.png",
          ),
          path.join(
            __dirname,
            "/update_draft_pricing_page_update_error_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(back, eq(true), "Back when updated");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_draft_pricing_page_updated.png"),
          path.join(
            __dirname,
            "/golden/update_draft_pricing_page_rate_largest.png",
          ),
          path.join(__dirname, "/update_draft_pricing_page_updated_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "Back when clicked");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
