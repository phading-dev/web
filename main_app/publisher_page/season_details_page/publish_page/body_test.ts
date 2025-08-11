import "../../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { PublishPage } from "./body";
import {
  PUBLISH_SEASON,
  PUBLISH_SEASON_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "PublishPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_InvalidInput_ValidInput_DeleteError_Deleted_Back";
      private cut: PublishPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new PublishPage(
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          {
            grade: 100,
          }
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publish_page_default.png"),
          path.join(__dirname, "/golden/publish_page_default.png"),
          path.join(__dirname, "/publish_page_default_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("published", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(PUBLISH_SEASON),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
            },
            PUBLISH_SEASON_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publish_page_publish_error.png"),
          path.join(__dirname, "/golden/publish_page_publish_error.png"),
          path.join(__dirname, "/publish_page_publish_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("published", resolve));

        // Verify
        assertThat(back, eq(true), "Back after publish");
        await asyncAssertScreenshot(
          path.join(__dirname, "/publish_page_published.png"),
          path.join(__dirname, "/golden/publish_page_default.png"),
          path.join(__dirname, "/publish_page_published_diff.png"),
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
  ],
});
