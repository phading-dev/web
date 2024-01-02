import path = require("path");
import { SecurityPage } from "./body";
import { SecurityInfoPageMock } from "./security_info_page/body_mock";
import { UpdatePasswordPageMock } from "./update_password_page/body_mock";
import { UpdateRecoveryEmailPageMock } from "./update_recovery_email_page/body_mock";
import { UpdateUsernamePageMock } from "./update_username_page/body_mock";
import { E } from "@selfage/element/factory";
import {
  deleteFile,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../../common/normalize_body";

let menuContainer: HTMLDivElement;

class NavigateForwardAndBack implements TestCase {
  private cut: SecurityPage;
  public constructor(
    public name: string,
    private click: (cut: SecurityPage) => void,
    private emitBack: (cut: SecurityPage) => void,
    private emitUpdated: (cut: SecurityPage) => void,
    private goToPageActualFile: string,
    private goToPageExpectedFile: string,
    private goToPageDiffFile: string,
    private backActualFile: string,
    private backDiffFile: string,
    private updatedActualFile: string,
    private updatedDiffFile: string
  ) {}

  public async execute() {
    // Prepare
    await setViewport(1000, 800);
    this.cut = new SecurityPage(
      () => new SecurityInfoPageMock(),
      () => new UpdatePasswordPageMock(),
      () => new UpdateRecoveryEmailPageMock(),
      () => new UpdateUsernamePageMock(),
      (...bodies) => document.body.append(...bodies),
      (...bodies) => menuContainer.append(...bodies)
    );
    await screenshot(path.join(__dirname, "/security_page_baseline.png"));

    // Execute
    this.click(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.goToPageActualFile,
      this.goToPageExpectedFile,
      this.goToPageDiffFile
    );

    // Execute
    this.emitBack(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.backActualFile,
      path.join(__dirname, "/security_page_baseline.png"),
      this.backDiffFile
    );

    // Prepare
    this.click(this.cut);

    // Execute
    this.emitUpdated(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.updatedActualFile,
      path.join(__dirname, "/security_page_baseline.png"),
      this.updatedDiffFile
    );

    // Clearnup
    await deleteFile(path.join(__dirname, "/security_page_baseline.png"));
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "ProfilePageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; top: 0; left: 0;`,
      });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_UpdateStates";
      private cut: SecurityPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);

        // Execute
        this.cut = new SecurityPage(
          () => new SecurityInfoPageMock(),
          () => new UpdatePasswordPageMock(),
          () => new UpdateRecoveryEmailPageMock(),
          () => new UpdateUsernamePageMock(),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.append(...bodies)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/security_page_default.png"),
          path.join(__dirname, "/golden/security_page_default.png"),
          path.join(__dirname, "/security_page_default_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new NavigateForwardAndBack(
      "GoToUpdatePasswordAndBack",
      (cut) => cut.securityInfoPage.password.click(),
      (cut) => cut.updatePasswordPage.emit("back"),
      (cut) => cut.updatePasswordPage.emit("updated"),
      path.join(__dirname, "/security_page_go_to_update_password.png"),
      path.join(__dirname, "/golden/security_page_go_to_update_password.png"),
      path.join(__dirname, "/security_page_go_to_update_password_diff.png"),
      path.join(__dirname, "/security_page_back_from_update_password.png"),
      path.join(__dirname, "/security_page_back_from_update_password_diff.png"),
      path.join(__dirname, "/security_page_back_from_updated_password.png"),
      path.join(__dirname, "/security_page_back_from_updated_password_diff.png")
    ),
    new NavigateForwardAndBack(
      "GoToUpdateRecoveryEmailAndBack",
      (cut) => cut.securityInfoPage.recoveryEmail.click(),
      (cut) => cut.updateRecoveryEmailPage.emit("back"),
      (cut) => cut.updateRecoveryEmailPage.emit("updated"),
      path.join(__dirname, "/security_page_go_to_update_recovery_email.png"),
      path.join(
        __dirname,
        "/golden/security_page_go_to_update_recovery_email.png"
      ),
      path.join(
        __dirname,
        "/security_page_go_to_update_recovery_email_diff.png"
      ),
      path.join(
        __dirname,
        "/security_page_back_from_update_recovery_email.png"
      ),
      path.join(
        __dirname,
        "/security_page_back_from_update_recovery_email_diff.png"
      ),
      path.join(
        __dirname,
        "/security_page_back_from_updated_recovery_email.png"
      ),
      path.join(
        __dirname,
        "/security_page_back_from_updated_recovery_email_diff.png"
      )
    ),
    new NavigateForwardAndBack(
      "GoToUpdateUsernameAndBack",
      (cut) => cut.securityInfoPage.username.click(),
      (cut) => cut.updateUsernamePage.emit("back"),
      (cut) => cut.updateUsernamePage.emit("updated"),
      path.join(__dirname, "/security_page_go_to_update_username.png"),
      path.join(__dirname, "/golden/security_page_go_to_update_username.png"),
      path.join(__dirname, "/security_page_go_to_update_username_diff.png"),
      path.join(__dirname, "/security_page_back_from_update_username.png"),
      path.join(__dirname, "/security_page_back_from_update_username_diff.png"),
      path.join(__dirname, "/security_page_back_from_updated_username.png"),
      path.join(__dirname, "/security_page_back_from_updated_username_diff.png")
    ),
  ],
});
