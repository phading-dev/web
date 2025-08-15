import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { UnpublishPage } from "./body";
import {
  UNPUBLISH_EPISODE,
  UNPUBLISH_EPISODE_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "EpisodeDetailsUnpublishPageTest",
  cases: [
    new (class implements TestCase {
      public name = "TabletView_Default_UnpublishError_UnpublishSuccess_Back";
      private cut: UnpublishPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UnpublishPage(serviceClientMock, "season1", "episode1");

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/unpublish_page_tablet_default.png"),
          path.join(__dirname, "/golden/unpublish_page_tablet_default.png"),
          path.join(__dirname, "/unpublish_page_tablet_default_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("unpublished", resolve),
        );

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
          path.join(__dirname, "/unpublish_page_tablet_error.png"),
          path.join(__dirname, "/golden/unpublish_page_tablet_error.png"),
          path.join(__dirname, "/unpublish_page_tablet_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("unpublished", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/unpublish_page_tablet_success.png"),
          path.join(__dirname, "/golden/unpublish_page_tablet_default.png"),
          path.join(__dirname, "/unpublish_page_tablet_success_diff.png"),
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
