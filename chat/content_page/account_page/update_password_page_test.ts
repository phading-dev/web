import path = require("path");
import { UpdatePasswordPage } from "./update_password_page";
import {
  UPDATE_PASSWORD,
  UPDATE_PASSWORD_REQUEST_BODY,
  UpdatePasswordResponse,
} from "@phading/user_service_interface/interface";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../common/normalize_body";

function createLongString(length: number): string {
  let strArray = new Array<string>();
  for (let i = 0; i < length; i++) {
    strArray.push("1");
  }
  return strArray.join("");
}

let container: HTMLDivElement;
let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "UPdatePasswordPageTest",
  environment: {
    setUp() {
      container = E.div({});
      menuContainer = E.div({
        style: `position: fixed; top: 0; left: 0;`,
      });
      document.body.append(container, menuContainer);
    },
    tearDown() {
      container.remove();
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Render_SubmitFailure_SubmitSuccess";
      private cut: UpdatePasswordPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();

        // Execute
        this.cut = new UpdatePasswordPage(webServiceClientMock);
        container.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_render.png"),
          path.join(__dirname, "/golden/update_password_page_render.png"),
          path.join(__dirname, "/update_password_page_render_diff.png")
        );

        // Prepare
        webServiceClientMock.send = async () => {
          throw new Error("fake error");
        };

        // Execute
        this.cut.currentPasswordInput.value = "123123123";
        this.cut.currentPasswordInput.emit("input");
        this.cut.newPasswordInput.value = "123123";
        this.cut.newPasswordInput.emit("input");
        this.cut.repeatPasswordInput.value = "123123";
        this.cut.repeatPasswordInput.emit("input");
        await this.cut.submitButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_submit_error.png"),
          path.join(__dirname, "/golden/update_password_page_submit_error.png"),
          path.join(__dirname, "/update_password_page_submit_error_diff.png")
        );

        // Prepare
        webServiceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(UPDATE_PASSWORD), "service");
          assertThat(
            request.body,
            eqMessage(
              {
                currentPassword: "123123123",
                newPassword: "123123",
              },
              UPDATE_PASSWORD_REQUEST_BODY
            ),
            "request"
          );
          return {} as UpdatePasswordResponse;
        };

        // Execute
        this.cut.submitButton.click();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "CurrentPasswordValid_Missing_Valid";
      private cut: UpdatePasswordPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();

        this.cut = new UpdatePasswordPage(webServiceClientMock);
        container.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);
        this.cut.newPasswordInput.value = "123123";
        this.cut.newPasswordInput.emit("input");
        this.cut.repeatPasswordInput.value = "123123";
        this.cut.repeatPasswordInput.emit("input");

        // Execute
        this.cut.currentPasswordInput.value = "123123123";
        this.cut.currentPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_current_password_valid.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_current_password_valid.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_current_password_valid_diff.png"
          )
        );

        // Execute
        this.cut.currentPasswordInput.value = "";
        this.cut.currentPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_current_password_missing.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_current_password_missing.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_current_password_missing_diff.png"
          )
        );

        // Execute
        this.cut.currentPasswordInput.value = "123123123";
        this.cut.currentPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_current_password_valid_again.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_current_password_valid.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_current_password_valid_again_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "NewPasswordMismatch_Valid_NewPasswordMissing_Valid_RepeatPasswordMissing_Valid";
      private cut: UpdatePasswordPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();

        this.cut = new UpdatePasswordPage(webServiceClientMock);
        container.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);
        this.cut.currentPasswordInput.value = "123123123";
        this.cut.currentPasswordInput.emit("input");

        // Execute
        this.cut.newPasswordInput.value = "123123";
        this.cut.newPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_new_password_mismatch.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_new_password_mismatch.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_new_password_mismatch_diff.png"
          )
        );

        // Execute
        this.cut.repeatPasswordInput.value = "123123";
        this.cut.repeatPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_new_password_valid.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_new_password_valid.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_new_password_valid_diff.png"
          )
        );

        // Execute
        this.cut.newPasswordInput.value = "";
        this.cut.newPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_new_password_missing.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_new_password_missing.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_new_password_missing_diff.png"
          )
        );

        // Execute
        this.cut.newPasswordInput.value = createLongString(120);
        this.cut.newPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_new_password_too_long.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_new_password_too_long.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_new_password_too_long_diff.png"
          )
        );

        // Execute
        this.cut.newPasswordInput.value = "123123";
        this.cut.newPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_new_password_valid_again.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_new_password_valid.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_new_password_valid_again_diff.png"
          )
        );

        // Execute
        this.cut.repeatPasswordInput.value = "";
        this.cut.repeatPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_repeat_password_missing.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_repeat_password_missing.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_repeat_password_missing_diff.png"
          )
        );

        // Execute
        this.cut.repeatPasswordInput.value = "123123";
        this.cut.repeatPasswordInput.emit("input");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_password_page_repeat_password_valid.png"
          ),
          path.join(
            __dirname,
            "/golden/update_password_page_new_password_valid.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_repeat_password_valid_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
