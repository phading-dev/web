import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { UpdateInfoPage } from "./body";
import {
  UPDATE_EPISODE_NAME,
  UPDATE_EPISODE_NAME_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "EpisodeDetailsUpdateInfoPage",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_Empty_TooLong_Valid_SubmitError_SubmitSuccess_Back";
      private cut: UpdateInfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateInfoPage(
          serviceClientMock,
          "season1",
          "episode1",
          {
            episodeName: "A name!",
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_default.png"),
          path.join(__dirname, "/golden/update_info_page_default.png"),
          path.join(__dirname, "/update_info_page_default_diff.png"),
        );

        // Execute
        this.cut.episodeNameInput.val.value = "";
        this.cut.episodeNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_empty.png"),
          path.join(__dirname, "/golden/update_info_page_empty.png"),
          path.join(__dirname, "/update_info_page_empty_diff.png"),
        );

        // Execute
        this.cut.episodeNameInput.val.value = Array(200).fill("a").join("");
        this.cut.episodeNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_name_too_long.png"),
          path.join(__dirname, "/golden/update_info_page_name_too_long.png"),
          path.join(__dirname, "/update_info_page_name_too_long_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.episodeNameInput.val.value = "A name 2!";
        this.cut.episodeNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_valid.png"),
          path.join(__dirname, "/golden/update_info_page_valid.png"),
          path.join(__dirname, "/update_info_page_valid_diff.png"),
        );

        // Execute
        this.cut.episodeNameInput.val.dispatchEnter();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UPDATE_EPISODE_NAME),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              name: "A name 2!",
            },
            UPDATE_EPISODE_NAME_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_error.png"),
          path.join(__dirname, "/golden/update_info_page_error.png"),
          path.join(__dirname, "/update_info_page_error_diff.png"),
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
        assertThat(back, eq(true), "back when success");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_success.png"),
          path.join(__dirname, "/golden/update_info_page_valid.png"),
          path.join(__dirname, "/update_info_page_success_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "back when clicked");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
