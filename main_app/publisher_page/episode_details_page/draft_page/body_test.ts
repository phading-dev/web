import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { DraftPage } from "./body";
import {
  DELETE_EPISODE,
  DELETE_EPISODE_REQUEST_BODY,
  PUBLISH_EPISODE,
  PUBLISH_EPISODE_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "EpisodeDetailsDraftPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_Default_PublishError_InvalidTime_ValidTime_PublishSuccess_Back";
      private cut: DraftPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new DraftPage(
          serviceClientMock,
          () => new Date("2023-10-01T00:00").getTime(),
          "season1",
          "episode1",
          {
            videoContainerCached: {},
            totalPublishedEpisodes: 0,
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/draft_page_tablet_default.png"),
          path.join(__dirname, "/golden/draft_page_tablet_default.png"),
          path.join(__dirname, "/draft_page_tablet_default_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.premiereTimeInput.val.dispatchEnter();
        await new Promise<void>((resolve) =>
          this.cut.once("published", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(PUBLISH_EPISODE),
          "RC 1",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
            },
            PUBLISH_EPISODE_REQUEST_BODY,
          ),
          "RC body 1",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/draft_page_tablet_error.png"),
          path.join(__dirname, "/golden/draft_page_tablet_error.png"),
          path.join(__dirname, "/draft_page_tablet_error_diff.png"),
        );

        // Execute
        this.cut.premiereTimeInput.val.value = "2023-09-01T00:00";
        this.cut.premiereTimeInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/draft_page_tablet_invalid.png"),
          path.join(__dirname, "/golden/draft_page_tablet_invalid.png"),
          path.join(__dirname, "/draft_page_tablet_invalid_diff.png"),
        );

        // Execute
        this.cut.premiereTimeInput.val.value = "2023-10-01T00:00";
        this.cut.premiereTimeInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/draft_page_tablet_valid.png"),
          path.join(__dirname, "/golden/draft_page_tablet_valid.png"),
          path.join(__dirname, "/draft_page_tablet_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("published", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(PUBLISH_EPISODE),
          "RC 2",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              premiereTimeMs: new Date("2023-10-01T00:00").getTime(),
            },
            PUBLISH_EPISODE_REQUEST_BODY,
          ),
          "RC body 2",
        );
        assertThat(back, eq(true), "Back when done");
        await asyncAssertScreenshot(
          path.join(__dirname, "/draft_page_tablet_success.png"),
          path.join(__dirname, "/golden/draft_page_tablet_success.png"),
          path.join(__dirname, "/draft_page_tablet_success_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "Back when back button clicked");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_DeleteError_DeleteSuccess";
      private cut: DraftPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new DraftPage(
          serviceClientMock,
          () => new Date("2023-10-01T00:00").getTime(),
          "season1",
          "episode1",
          {
            videoContainerCached: {},
            totalPublishedEpisodes: 0,
          },
        );

        document.body.append(this.cut.body);
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickSecondaryButton();
        await new Promise<void>((resolve) => this.cut.once("deleted", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(DELETE_EPISODE),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
            },
            DELETE_EPISODE_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/draft_page_tablet_delete_error.png"),
          path.join(__dirname, "/golden/draft_page_tablet_delete_error.png"),
          path.join(__dirname, "/draft_page_tablet_delete_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let deleted = false;
        this.cut.on("delete", () => (deleted = true));

        // Execute
        this.cut.inputFormPage.clickSecondaryButton();
        await new Promise<void>((resolve) => this.cut.once("deleted", resolve));

        // Verify
        assertThat(deleted, eq(true), "Delete event");
        await asyncAssertScreenshot(
          path.join(__dirname, "/draft_page_tablet_delete_success.png"),
          path.join(__dirname, "/golden/draft_page_tablet_delete_success.png"),
          path.join(__dirname, "/draft_page_tablet_delete_success_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_FailedPreconditionToPublish_ValidTime";
      private cut: DraftPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new DraftPage(
          serviceClientMock,
          () => new Date("2023-10-01T00:00").getTime(),
          "season1",
          "episode1",
          {
            totalPublishedEpisodes: 1000,
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/draft_page_tablet_invalid_precondition.png"),
          path.join(
            __dirname,
            "/golden/draft_page_tablet_invalid_precondition.png",
          ),
          path.join(
            __dirname,
            "/draft_page_tablet_invalid_precondition_diff.png",
          ),
        );

        // Execute
        this.cut.premiereTimeInput.val.value = "2023-10-02T00:00";
        this.cut.premiereTimeInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/draft_page_tablet_invalid_precondition_with_valid_time.png",
          ),
          path.join(
            __dirname,
            "/golden/draft_page_tablet_invalid_precondition_with_valid_time.png",
          ),
          path.join(
            __dirname,
            "/draft_page_tablet_invalid_precondition_with_valid_time_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
