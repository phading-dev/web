import "../../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setPhoneView, setTabletView } from "../../../../common/view_port";
import { UpdatePublishedPricingPage } from "./body";
import {
  DELETE_NEXT_SEASON_GRADE,
  DELETE_NEXT_SEASON_GRADE_REQUEST_BODY,
  UPDATE_NEXT_SEASON_GRADE,
  UPDATE_NEXT_SEASON_GRADE_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "UpdatePublishedPricingPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "NoNextGrade_PhoneView_TabletView_RateNonPositive_RateTooLarge_RateSameAsBefore_NewRateValid_EffectiveDateTooSoon_EffectiveDateValid_UpdateError_Updated_Back";
      private cut: UpdatePublishedPricingPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdatePublishedPricingPage(
          serviceClientMock,
          () => new Date("2023-10-01T08:00:00Z"),
          "season1",
          99,
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_published_pricing_page_phone_no_next_grade.png",
          ),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_phone_no_next_grade.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_phone_no_next_grade_diff.png",
          ),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_published_pricing_page_no_next_grade.png",
          ),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_no_next_grade.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_no_next_grade_diff.png",
          ),
        );

        // Execute
        this.cut.nextGradeInput.val.value = "0.9";
        this.cut.nextGradeInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_published_pricing_page_rate_invalid.png",
          ),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_rate_invalid.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_rate_invalid_diff.png",
          ),
        );

        // Execute
        this.cut.nextGradeInput.val.value = "10000";
        this.cut.nextGradeInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_published_pricing_page_rate_too_large.png",
          ),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_rate_too_large.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_rate_too_large_diff.png",
          ),
        );

        // Execute
        this.cut.nextGradeInput.val.value = "99.99";
        this.cut.nextGradeInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_published_pricing_page_same_rate.png"),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_same_rate.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_same_rate_diff.png",
          ),
        );

        // Execute
        this.cut.nextGradeInput.val.value = "100.12";
        this.cut.nextGradeInput.val.dispatchInput();
        this.cut.effectiveDateInput.val.value = "2023-10-02";
        this.cut.effectiveDateInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_published_pricing_page_effective_date_invalid.png",
          ),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_effective_date_invalid.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_effective_date_invalid_diff.png",
          ),
        );

        // Execute
        this.cut.effectiveDateInput.val.value = "2023-10-03";
        this.cut.effectiveDateInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_published_pricing_page_valid.png"),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_valid.png",
          ),
          path.join(__dirname, "/update_published_pricing_page_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.nextGradeInput.val.dispatchEnter();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UPDATE_NEXT_SEASON_GRADE),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              grade: 100,
              effectiveDate: "2023-10-03",
            },
            UPDATE_NEXT_SEASON_GRADE_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_published_pricing_page_update_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_update_error.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_update_error_diff.png",
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
          path.join(__dirname, "/update_published_pricing_page_updated.png"),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_valid.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_updated_diff.png",
          ),
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
    new (class implements TestCase {
      public name = "WithNextGrade_DeleteError_Deleted";
      private cut: UpdatePublishedPricingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdatePublishedPricingPage(
          serviceClientMock,
          () => new Date("2023-10-01T08:00:00Z"),
          "season1",
          99,
          { effectiveDate: "2023-10-02", grade: 120 },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_published_pricing_page_with_next_grade.png",
          ),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_with_next_grade.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_with_next_grade_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickSecondaryButton();
        await new Promise<void>((resolve) => this.cut.once("deleted", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(DELETE_NEXT_SEASON_GRADE),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
            },
            DELETE_NEXT_SEASON_GRADE_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_published_pricing_page_delete_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_delete_error.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_delete_error_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.clickSecondaryButton();
        await new Promise<void>((resolve) => this.cut.once("deleted", resolve));

        // Verify
        assertThat(back, eq(true), "Back when deleted");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_published_pricing_page_deleted.png"),
          path.join(
            __dirname,
            "/golden/update_published_pricing_page_with_next_grade.png",
          ),
          path.join(
            __dirname,
            "/update_published_pricing_page_deleted_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
