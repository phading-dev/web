import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { UpdateInfoPage } from "./body";
import {
  CreateEpisodeResponse,
  UPDATE_SEASON,
  UPDATE_SEASON_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "UpdateInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_NameTooLong_NameEmpty_NameValid_DescriptionTooLong_DescriptionValid_UpdateError_UpdateSuccess_BackAfterClick";
      private cut: UpdateInfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateInfoPage(serviceClientMock, "season1", {
          name: "Season 1",
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_default.png"),
          path.join(__dirname, "/golden/update_info_page_default.png"),
          path.join(__dirname, "/update_info_page_default_diff.png"),
        );

        // Execute
        this.cut.nameInput.val.value = Array(200).fill("a").join("");
        this.cut.nameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_name_too_long.png"),
          path.join(__dirname, "/golden/update_info_page_name_too_long.png"),
          path.join(__dirname, "/update_info_page_name_too_long_diff.png"),
        );

        // Execute
        this.cut.nameInput.val.value = "";
        this.cut.nameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_name_empty.png"),
          path.join(__dirname, "/golden/update_info_page_name_empty.png"),
          path.join(__dirname, "/update_info_page_name_empty_diff.png"),
        );

        // Execute
        this.cut.nameInput.val.value = " Season 2 ";
        this.cut.nameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_name_valid.png"),
          path.join(__dirname, "/golden/update_info_page_name_valid.png"),
          path.join(__dirname, "/update_info_page_name_valid_diff.png"),
        );

        // Execute
        this.cut.descriptionInput.val.value = Array(1001).fill("b").join("");
        this.cut.descriptionInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_description_too_long.png"),
          path.join(
            __dirname,
            "/golden/update_info_page_description_too_long.png",
          ),
          path.join(
            __dirname,
            "/update_info_page_description_too_long_diff.png",
          ),
        );

        // Execute
        this.cut.descriptionInput.val.value = " This is a description. ";
        this.cut.descriptionInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_description_valid.png"),
          path.join(
            __dirname,
            "/golden/update_info_page_description_valid.png",
          ),
          path.join(__dirname, "/update_info_page_description_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.nameInput.val.dispatchEnter();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UPDATE_SEASON),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              name: "Season 2",
              description: "This is a description.",
            },
            UPDATE_SEASON_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_update_error.png"),
          path.join(__dirname, "/golden/update_info_page_update_error.png"),
          path.join(__dirname, "/update_info_page_update_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let response: CreateEpisodeResponse = {
          episodeId: "episode1",
        };
        serviceClientMock.response = response;
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.inputFormPage.primaryButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(back, eq(true), "back after success");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_update_success.png"),
          path.join(
            __dirname,
            "/golden/update_info_page_description_valid.png",
          ),
          path.join(__dirname, "/update_info_page_update_success_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.inputFormPage.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back after click");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithDescription";
      private cut: UpdateInfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateInfoPage(serviceClientMock, "season1", {
          name: "Season 1",
          description: "This is a description.",
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_info_page_with_description.png"),
          path.join(__dirname, "/golden/update_info_page_with_description.png"),
          path.join(__dirname, "/update_info_page_with_description_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
