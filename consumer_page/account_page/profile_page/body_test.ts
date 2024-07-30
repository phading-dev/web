import path = require("path");
import { BasicInfoPageMock } from "./basic_info_page/body_mock";
import { ProfilePage } from "./body";
import { UpdateAccountInfoPageMock } from "./update_account_info/body_mock";
import { UpdateAvatarPageMock } from "./update_avatar_page/body_mock";
import { UpdatePasswordPageMock } from "./update_password_page/body_mock";
import { UpdateRecoveryEmailPageMock } from "./update_recovery_email_page/body_mock";
import { UpdateUsernamePageMock } from "./update_username_page/body_mock";
import {
  deleteFile,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../common/normalize_body";

class NavigateForwardAndBack implements TestCase {
  private cut: ProfilePage;
  public constructor(
    public name: string,
    private click: (cut: ProfilePage) => void,
    private emitBack: (cut: ProfilePage) => void,
    private emitUpdated: (cut: ProfilePage) => void,
    private goToPageActualFile: string,
    private goToPageExpectedFile: string,
    private goToPageDiffFile: string,
    private backActualFile: string,
    private backDiffFile: string,
    private updatedActualFile: string,
    private updatedDiffFile: string,
  ) {}

  public async execute() {
    // Prepare
    await setViewport(1000, 800);
    this.cut = new ProfilePage(
      () => new BasicInfoPageMock(),
      () => new UpdateAvatarPageMock(),
      (account) => new UpdateAccountInfoPageMock(account),
      () => new UpdatePasswordPageMock(),
      () => new UpdateRecoveryEmailPageMock(),
      () => new UpdateUsernamePageMock(),
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

    // Prepare
    this.click(this.cut);

    // Execute
    this.emitUpdated(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.updatedActualFile,
      path.join(__dirname, "/profile_page_baseline.png"),
      this.updatedDiffFile,
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
        await setViewport(1000, 800);

        // Execute
        this.cut = new ProfilePage(
          () => new BasicInfoPageMock(),
          () => new UpdateAvatarPageMock(),
          (account) => new UpdateAccountInfoPageMock(account),
          () => new UpdatePasswordPageMock(),
          () => new UpdateRecoveryEmailPageMock(),
          () => new UpdateUsernamePageMock(),
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
      (cut) => cut.basicInfoPage.avatarContainer.val.click(),
      (cut) => cut.updateAvatarPage.emit("back"),
      (cut) => cut.updateAvatarPage.emit("updated"),
      path.join(__dirname, "/profile_page_go_to_update_avatar.png"),
      path.join(__dirname, "/golden/profile_page_go_to_update_avatar.png"),
      path.join(__dirname, "/profile_page_go_to_update_avatar_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_avatar.png"),
      path.join(__dirname, "/profile_page_back_from_update_avatar_diff.png"),
      path.join(__dirname, "/profile_page_back_from_updated_avatar.png"),
      path.join(__dirname, "/profile_page_back_from_updated_avatar_diff.png"),
    ),
    new NavigateForwardAndBack(
      "GoToUpdateAccountInfoAndBack",
      (cut) => cut.basicInfoPage.accountInfo.val.click(),
      (cut) => cut.updateAccountInfoPage.emit("back"),
      (cut) => cut.updateAccountInfoPage.emit("updated"),
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
      path.join(__dirname, "/profile_page_back_from_updated_account_info.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_updated_account_info_diff.png",
      ),
    ),
    new NavigateForwardAndBack(
      "GoToUpdatePasswordAndBack",
      (cut) => cut.basicInfoPage.password.val.click(),
      (cut) => cut.updatePasswordPage.emit("back"),
      (cut) => cut.updatePasswordPage.emit("updated"),
      path.join(__dirname, "/profile_page_go_to_update_password.png"),
      path.join(__dirname, "/golden/profile_page_go_to_update_password.png"),
      path.join(__dirname, "/profile_page_go_to_update_password_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_password.png"),
      path.join(__dirname, "/profile_page_back_from_update_password_diff.png"),
      path.join(__dirname, "/profile_page_back_from_updated_password.png"),
      path.join(__dirname, "/profile_page_back_from_updated_password_diff.png"),
    ),
    new NavigateForwardAndBack(
      "GoToUpdateRecoveryEmailAndBack",
      (cut) => cut.basicInfoPage.recoveryEmail.val.click(),
      (cut) => cut.updateRecoveryEmailPage.emit("back"),
      (cut) => cut.updateRecoveryEmailPage.emit("updated"),
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
      path.join(
        __dirname,
        "/profile_page_back_from_updated_recovery_email.png",
      ),
      path.join(
        __dirname,
        "/profile_page_back_from_updated_recovery_email_diff.png",
      ),
    ),
    new NavigateForwardAndBack(
      "GoToUpdateUsernameAndBack",
      (cut) => cut.basicInfoPage.username.val.click(),
      (cut) => cut.updateUsernamePage.emit("back"),
      (cut) => cut.updateUsernamePage.emit("updated"),
      path.join(__dirname, "/profile_page_go_to_update_username.png"),
      path.join(__dirname, "/golden/profile_page_go_to_update_username.png"),
      path.join(__dirname, "/profile_page_go_to_update_username_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_username.png"),
      path.join(__dirname, "/profile_page_back_from_update_username_diff.png"),
      path.join(__dirname, "/profile_page_back_from_updated_username.png"),
      path.join(__dirname, "/profile_page_back_from_updated_username_diff.png"),
    ),
  ],
});
