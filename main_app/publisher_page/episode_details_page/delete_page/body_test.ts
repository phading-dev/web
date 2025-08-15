import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { DeletePage } from "./body";
import {
  DELETE_EPISODE,
  DELETE_EPISODE_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "EpisodeDetailsDeletePageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_Default_PublishError_InvalidTime_ValidTime_PublishSuccess_Back";
      private cut: DeletePage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new DeletePage(
          serviceClientMock,
          "season1",
          "xxxx-4xxxx-xxxxx",
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_tablet_default.png"),
          path.join(__dirname, "/golden/delete_page_tablet_default.png"),
          path.join(__dirname, "/delete_page_tablet_default_diff.png"),
        );

        // Execute
        this.cut.episodeIdInput.val.value = "xxxx-4xxxx";
        this.cut.episodeIdInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_tablet_invalid.png"),
          path.join(__dirname, "/golden/delete_page_tablet_invalid.png"),
          path.join(__dirname, "/delete_page_tablet_invalid_diff.png"),
        );

        // Execute
        this.cut.episodeIdInput.val.value = "xxxx-4xxxx-xxxxx";
        this.cut.episodeIdInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_tablet_valid.png"),
          path.join(__dirname, "/golden/delete_page_tablet_valid.png"),
          path.join(__dirname, "/delete_page_tablet_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
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
              episodeId: "xxxx-4xxxx-xxxxx",
            },
            DELETE_EPISODE_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_tablet_error.png"),
          path.join(__dirname, "/golden/delete_page_tablet_error.png"),
          path.join(__dirname, "/delete_page_tablet_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let toDelete = false;
        this.cut.on("delete", () => (toDelete = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("deleted", resolve));

        // Verify
        assertThat(toDelete, eq(true), "Delete event");
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_tablet_success.png"),
          path.join(__dirname, "/golden/delete_page_tablet_valid.png"),
          path.join(__dirname, "/delete_page_tablet_success_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "Back when back button clicked");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
