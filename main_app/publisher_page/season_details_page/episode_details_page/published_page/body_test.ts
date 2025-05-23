import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { PublishedPage } from "./body";
import {
  UNPUBLISH_EPISODE,
  UNPUBLISH_EPISODE_REQUEST_BODY,
  UPDATE_EPISODE_PREMIERE_TIME,
  UPDATE_EPISODE_PREMIERE_TIME_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "EpisodeDetailsPublishedPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_Default_InvalidTime_ValidTime_UpdateError_UpdateSuccess_Back_UnpublishError_UnpublishSuccess";
      private cut: PublishedPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new PublishedPage(
          serviceClientMock,
          () => new Date("2023-10-03T00:00").getTime(),
          "season1",
          "episode1",
          {
            premiereTimeMs: new Date("2023-10-01T00:00").getTime(),
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_page_tablet_default.png"),
          path.join(__dirname, "/golden/published_page_tablet_default.png"),
          path.join(__dirname, "/published_page_tablet_default_diff.png"),
        );

        // Execute
        this.cut.premiereTimeInput.val.value = "2023-09-01T00:00";
        this.cut.premiereTimeInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_page_tablet_invalid.png"),
          path.join(__dirname, "/golden/published_page_tablet_invalid.png"),
          path.join(__dirname, "/published_page_tablet_invalid_diff.png"),
        );

        // Execute
        this.cut.premiereTimeInput.val.value = "2023-10-03T00:00";
        this.cut.premiereTimeInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_page_tablet_valid.png"),
          path.join(__dirname, "/golden/published_page_tablet_valid.png"),
          path.join(__dirname, "/published_page_tablet_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.premiereTimeInput.val.dispatchEnter();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UPDATE_EPISODE_PREMIERE_TIME),
          "Update Episode Premiere Time",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              premiereTimeMs: new Date("2023-10-03T00:00").getTime(),
            },
            UPDATE_EPISODE_PREMIERE_TIME_REQUEST_BODY,
          ),
          "Update Episode Premiere Time body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_page_tablet_error.png"),
          path.join(__dirname, "/golden/published_page_tablet_error.png"),
          path.join(__dirname, "/published_page_tablet_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(back, eq(true), "Back when done");
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_page_tablet_success.png"),
          path.join(__dirname, "/golden/published_page_tablet_valid.png"),
          path.join(__dirname, "/published_page_tablet_success_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "Back when back button clicked");

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickSecondaryButton();

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UNPUBLISH_EPISODE),
          "Unpublish Episode",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
            },
            UNPUBLISH_EPISODE_REQUEST_BODY,
          ),
          "Unpublish Episode body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_page_tablet_unpublish_error.png"),
          path.join(
            __dirname,
            "/golden/published_page_tablet_unpublish_error.png",
          ),
          path.join(
            __dirname,
            "/published_page_tablet_unpublish_error_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = undefined;

        // Execute
        this.cut.inputFormPage.clickSecondaryButton();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_page_tablet_unpublish_success.png"),
          path.join(
            __dirname,
            "/golden/published_page_tablet_unpublish_success.png",
          ),
          path.join(
            __dirname,
            "/published_page_tablet_unpublish_success_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
