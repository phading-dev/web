import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { DeletePage } from "./body";
import {
  DELETE_SEASON,
  DELETE_SEASON_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "DeletePageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_InvalidInput_ValidInput_DeleteError_Deleted_Back";
      private cut: DeletePage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new DeletePage(
          serviceClientMock,
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_default.png"),
          path.join(__dirname, "/golden/delete_page_default.png"),
          path.join(__dirname, "/delete_page_default_diff.png"),
        );

        // Execute
        this.cut.seasonIdInput.val.value = "1233333333333333";
        this.cut.seasonIdInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_invalid.png"),
          path.join(__dirname, "/golden/delete_page_invalid.png"),
          path.join(__dirname, "/delete_page_invalid_diff.png"),
        );

        // Execute
        this.cut.seasonIdInput.val.value =
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        this.cut.seasonIdInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_valid.png"),
          path.join(__dirname, "/golden/delete_page_valid.png"),
          path.join(__dirname, "/delete_page_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.seasonIdInput.val.dispatchEnter();
        await new Promise<void>((resolve) => this.cut.on("deleted", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(DELETE_SEASON),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
            },
            DELETE_SEASON_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_delete_error.png"),
          path.join(__dirname, "/golden/delete_page_delete_error.png"),
          path.join(__dirname, "/delete_page_delete_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let deleted = false;
        this.cut.on("delete", () => (deleted = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("deleted", resolve));

        // Verify
        assertThat(deleted, eq(true), "Delete event");
        await asyncAssertScreenshot(
          path.join(__dirname, "/delete_page_deleted.png"),
          path.join(__dirname, "/golden/delete_page_valid.png"),
          path.join(__dirname, "/delete_page_deleted_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => (back = true));

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
