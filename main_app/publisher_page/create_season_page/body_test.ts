import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { CreateSeasonPage } from "./body";
import { CreateSeasonResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "CreateSeasonPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: CreateSeasonPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serivceClientMock = new WebServiceClientMock();
        this.cut = new CreateSeasonPage(serivceClientMock);

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_season_page_tablet.png"),
          path.join(__dirname, "/golden/create_season_page_tablet.png"),
          path.join(__dirname, "/create_season_page_tablet_diff.png"),
        );

        // Execute
        this.cut.seasonNameInput.val.value = Array(101).fill("a").join("");
        this.cut.seasonNameInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_season_page_tablet_invalid.png"),
          path.join(__dirname, "/golden/create_season_page_tablet_invalid.png"),
          path.join(__dirname, "/create_season_page_tablet_invalid_diff.png"),
        );

        // Execute
        this.cut.seasonNameInput.val.value = "some name";
        this.cut.seasonNameInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_season_page_tablet_valid.png"),
          path.join(__dirname, "/golden/create_season_page_tablet_valid.png"),
          path.join(__dirname, "/create_season_page_tablet_valid_diff.png"),
        );

        // Prepare
        serivceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_season_page_tablet_error.png"),
          path.join(__dirname, "/golden/create_season_page_tablet_error.png"),
          path.join(__dirname, "/create_season_page_tablet_error_diff.png"),
        );

        // Prepare
        serivceClientMock.error = undefined;
        serivceClientMock.response = {
          seasonId: "season1",
        } as CreateSeasonResponse;
        let seasonId: string;
        this.cut.on("showDetails", (id) => {
          seasonId = id;
        });

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(seasonId, eq("season1"), "seasonId");
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_season_page_tablet_done.png"),
          path.join(__dirname, "/golden/create_season_page_tablet_done.png"),
          path.join(__dirname, "/create_season_page_tablet_done_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
