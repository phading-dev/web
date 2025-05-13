import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setDesktopView } from "../../../common/view_port";
import { ProfilePage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";
import { UpdateAccountInfoPageMock } from "./update_account_info/body_mock";
import { UpdateAvatarPageMock } from "./update_avatar_page/body_mock";
import { UpdatePasswordPageMock } from "./update_password_page/body_mock";
import { UpdateRecoveryEmailPageMock } from "./update_recovery_email_page/body_mock";
import { deleteFile, screenshot } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

class NavigateForwardAndBack implements TestCase {
  private cut: ProfilePage;
  public constructor(
    public name: string,
    private click: (cut: ProfilePage) => void,
    private emitBack: (cut: ProfilePage) => void,
    private goToPageActualFile: string,
    private goToPageExpectedFile: string,
    private goToPageDiffFile: string,
    private backActualFile: string,
    private backDiffFile: string,
  ) {}

  public async execute() {
    // Prepare
    await setDesktopView();
    this.cut = new ProfilePage(
      () => new InfoPageMock(),
      () => new UpdateAvatarPageMock(),
      (account) => new UpdateAccountInfoPageMock(account),
      (username) => new UpdatePasswordPageMock(username),
      (username) => new UpdateRecoveryEmailPageMock(username),
      (...bodies) => document.body.append(...bodies),
    );
    await screenshot(path.join(__dirname, "/profile_page_baseline.png"));

    // Execute
    this.click(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.goToPageActualFile,
      this.goToPageExpectedFile,
      this.goToPageDiffFile,
    );

    // Execute
    this.emitBack(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.backActualFile,
      path.join(__dirname, "/profile_page_baseline.png"),
      this.backDiffFile,
    );

    // Clearnup
    await deleteFile(path.join(__dirname, "/profile_page_baseline.png"));
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "ProfilePageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: ProfilePage;
      public async execute() {
        // Prepare
        await setDesktopView();

        // Execute
        this.cut = new ProfilePage(
          () => new InfoPageMock(),
          () => new UpdateAvatarPageMock(),
          (account) => new UpdateAccountInfoPageMock(account),
          (username) => new UpdatePasswordPageMock(username),
          (username) => new UpdateRecoveryEmailPageMock(username),
          (...bodies) => document.body.append(...bodies),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_default.png"),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(__dirname, "/profile_page_default_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new NavigateForwardAndBack(
      "GoToUpdateAvatarAndBack",
      (cut) => cut.infoPage.avatarContainer.val.click(),
      (cut) => cut.updateAvatarPage.emit("back"),
      path.join(__dirname, "/profile_page_go_to_update_avatar.png"),
      path.join(__dirname, "/golden/profile_page_go_to_update_avatar.png"),
      path.join(__dirname, "/profile_page_go_to_update_avatar_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_avatar.png"),
      path.join(__dirname, "/profile_page_back_from_update_avatar_diff.png"),
    ),
    new NavigateForwardAndBack(
      "GoToUpdateAccountInfoAndBack",
      (cut) => cut.infoPage.accountInfo.val.click(),
      (cut) => cut.updateAccountInfoPage.emit("back"),
      path.join(__dirname, "/profile_page_go_to_update_account_info.png"),
      path.join(
        __dirname,
        "/golden/profile_page_go_to_update_account_info.png",
      ),
      path.join(__dirname, "/profile_page_go_to_update_account_info_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_account_info.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_update_account_info_diff.png",
      ),
    ),
    new NavigateForwardAndBack(
      "GoToUpdatePasswordAndBack",
      (cut) => cut.infoPage.password.val.click(),
      (cut) => cut.updatePasswordPage.emit("back"),
      path.join(__dirname, "/profile_page_go_to_update_password.png"),
      path.join(__dirname, "/golden/profile_page_go_to_update_password.png"),
      path.join(__dirname, "/profile_page_go_to_update_password_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_password.png"),
      path.join(__dirname, "/profile_page_back_from_update_password_diff.png"),
    ),
    new NavigateForwardAndBack(
      "GoToUpdateRecoveryEmailAndBack",
      (cut) => cut.infoPage.recoveryEmail.val.click(),
      (cut) => cut.updateRecoveryEmailPage.emit("back"),
      path.join(__dirname, "/profile_page_go_to_update_recovery_email.png"),
      path.join(
        __dirname,
        "/golden/profile_page_go_to_update_recovery_email.png",
      ),
      path.join(
        __dirname,
        "/profile_page_go_to_update_recovery_email_diff.png",
      ),
      path.join(__dirname, "/profile_page_back_from_update_recovery_email.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_update_recovery_email_diff.png",
      ),
    ),
  ],
});
