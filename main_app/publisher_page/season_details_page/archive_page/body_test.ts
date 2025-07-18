import "../../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { ArchivePage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  ARCHIVE_SEASON,
  ARCHIVE_SEASON_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "ArchivePageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "PublishedState_InvalidInput_ValidInput_ArchiveError_Archived_Back";
      private cut: ArchivePage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new ArchivePage(
          serviceClientMock,
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
          {
            state: SeasonState.PUBLISHED,
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/archive_page_published.png"),
          path.join(__dirname, "/golden/archive_page_published.png"),
          path.join(__dirname, "/archive_page_published_diff.png"),
        );

        // Execute
        this.cut.seasonIdInput.val.value = "1233333333333333";
        this.cut.seasonIdInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/archive_page_invalid.png"),
          path.join(__dirname, "/golden/archive_page_invalid.png"),
          path.join(__dirname, "/archive_page_invalid_diff.png"),
        );

        // Execute
        this.cut.seasonIdInput.val.value =
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        this.cut.seasonIdInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/archive_page_valid.png"),
          path.join(__dirname, "/golden/archive_page_valid.png"),
          path.join(__dirname, "/archive_page_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.seasonIdInput.val.dispatchEnter();
        await new Promise<void>((resolve) => this.cut.on("archived", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(ARCHIVE_SEASON),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
            },
            ARCHIVE_SEASON_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/archive_page_archive_error.png"),
          path.join(__dirname, "/golden/archive_page_archive_error.png"),
          path.join(__dirname, "/archive_page_archive_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("archived", resolve));

        // Verify
        assertThat(back, eq(true), "Back when archived");
        await asyncAssertScreenshot(
          path.join(__dirname, "/archive_page_archived.png"),
          path.join(__dirname, "/golden/archive_page_valid.png"),
          path.join(__dirname, "/archive_page_archived_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "Back when clicked back button");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TakenDownState";
      private cut: ArchivePage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new ArchivePage(
          serviceClientMock,
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
          {
            state: SeasonState.TAKEN_DOWN,
            takenDownReason: "Fake reason",
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/archive_page_taken_down.png"),
          path.join(__dirname, "/golden/archive_page_taken_down.png"),
          path.join(__dirname, "/archive_page_taken_down_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
