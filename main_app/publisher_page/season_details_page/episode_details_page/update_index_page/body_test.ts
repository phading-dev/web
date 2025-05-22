import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { UpdateIndexPage } from "./body";
import {
  UPDATE_EPISODE_INDEX,
  UPDATE_EPISODE_INDEX_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "EpisodeDetailsUpdateIndexPage",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_IndexTooLarge_IndexTooSmall_Empty_Valid_SubmitError_SubmitSuccess_Back";
      private cut: UpdateIndexPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateIndexPage(
          serviceClientMock,
          "season1",
          "episode1",
          {
            episodeIndex: 2,
            totalPublishedEpisodes: 5,
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_index_page_default.png"),
          path.join(__dirname, "/golden/update_index_page_default.png"),
          path.join(__dirname, "/update_index_page_default_diff.png"),
        );

        // Execute
        this.cut.episodeIndexInput.val.value = "6";
        this.cut.episodeIndexInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_index_page_too_large.png"),
          path.join(__dirname, "/golden/update_index_page_too_large.png"),
          path.join(__dirname, "/update_index_page_too_large_diff.png"),
        );

        // Execute
        this.cut.episodeIndexInput.val.value = "0";
        this.cut.episodeIndexInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_index_page_too_small.png"),
          path.join(__dirname, "/golden/update_index_page_too_small.png"),
          path.join(__dirname, "/update_index_page_too_small_diff.png"),
        );

        // Execute
        this.cut.episodeIndexInput.val.value = "";
        this.cut.episodeIndexInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_index_page_empty.png"),
          path.join(__dirname, "/golden/update_index_page_empty.png"),
          path.join(__dirname, "/update_index_page_empty_diff.png"),
        );

        // Execute
        this.cut.episodeIndexInput.val.value = "1";
        this.cut.episodeIndexInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_index_page_valid.png"),
          path.join(__dirname, "/golden/update_index_page_valid.png"),
          path.join(__dirname, "/update_index_page_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.episodeIndexInput.val.dispatchEnter();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UPDATE_EPISODE_INDEX),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              toIndex: 1,
            },
            UPDATE_EPISODE_INDEX_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_index_page_error.png"),
          path.join(__dirname, "/golden/update_index_page_error.png"),
          path.join(__dirname, "/update_index_page_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(back, eq(true), "Back when success");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_index_page_success.png"),
          path.join(__dirname, "/golden/update_index_page_valid.png"),
          path.join(__dirname, "/update_index_page_success_diff.png"),
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
