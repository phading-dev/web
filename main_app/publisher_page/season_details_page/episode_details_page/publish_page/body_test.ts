import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { PublishPage } from "./body";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "EpisodeDetailsPublishPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: PublishPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new PublishPage(
          serviceClientMock,
          () => new Date("2023-10-01T00:00").getTime(),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publish_page_tablet_default.png"),
          path.join(__dirname, "/golden/publish_page_tablet_default.png"),
          path.join(__dirname, "/publish_page_tablet_default_diff.png"),
        );

        // Execute
        this.cut.premiereTimeInput.val.value = "2023-09-01T00:00";
        this.cut.premiereTimeInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publish_page_tablet_invalid.png"),
          path.join(__dirname, "/golden/publish_page_tablet_invalid.png"),
          path.join(__dirname, "/publish_page_tablet_invalid_diff.png"),
        );

        // Execute
        this.cut.premiereTimeInput.val.value = "2023-10-01T00:00";
        this.cut.premiereTimeInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publish_page_tablet_valid.png"),
          path.join(__dirname, "/golden/publish_page_tablet_valid.png"),
          path.join(__dirname, "/publish_page_tablet_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.premiereTimeInput.val.dispatchEnter();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publish_page_tablet_error.png"),
          path.join(__dirname, "/golden/publish_page_tablet_error.png"),
          path.join(__dirname, "/publish_page_tablet_error_diff.png"),
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
          path.join(__dirname, "/publish_page_tablet_success.png"),
          path.join(__dirname, "/golden/publish_page_tablet_valid.png"),
          path.join(__dirname, "/publish_page_tablet_success_diff.png"),
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
  ],
});
