import path = require("path");
import { normalizeBody } from "../../../../../../common/normalize_body";
import { setTabletView } from "../../../../../../common/view_port";
import { CancelUploadPage } from "./body";
import {
  CANCEL_UPLOADING,
  CANCEL_UPLOADING_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "CancelUploadPage",
  cases: [
    new (class implements TestCase {
      public name = "Cancel";
      public cut: CancelUploadPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new CancelUploadPage(
          serviceClientMock,
          "season1",
          "episode1",
          false,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise((resolve) => this.cut.once("restart", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(CANCEL_UPLOADING),
          "Cancel uploading",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
            },
            CANCEL_UPLOADING_REQUEST_BODY,
          ),
          "Cancel uploading body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/cancel_upload_page_tablet.png"),
          path.join(__dirname, "/golden/cancel_upload_page_tablet.png"),
          path.join(__dirname, "/cancel_upload_page_tablet_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
