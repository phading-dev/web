import userImage = require("./common/test_data/user_image.jpg");
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setDesktopView } from "../../../common/view_port";
import { ProfilePage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";
import { UpdateAccountInfoPage } from "./update_account_info/body";
import { UpdateAvatarPage } from "./update_avatar_page/body";
import { UpdatePasswordPage } from "./update_password_page/body";
import { UpdateRecoveryEmailPage } from "./update_recovery_email_page/body";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "ProfilePageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: ProfilePage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let account: AccountAndUser = {
          avatarLargeUrl: userImage,
          contactEmail: "my@gmail.com",
          naturalName: "First Second",
          username: "user1",
          recoveryEmail: "some@gmail.com",
        };

        // Execute
        this.cut = new ProfilePage(
          () => new InfoPageMock(account),
          (account) => new UpdateAvatarPage(undefined, account),
          (account) => new UpdateAccountInfoPage(undefined, account),
          (username) => new UpdatePasswordPage(undefined, username),
          (username) => new UpdateRecoveryEmailPage(undefined, username),
          (...bodies) => document.body.append(...bodies),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_default.png"),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(__dirname, "/profile_page_default_diff.png"),
        );

        // Execute
        this.cut.infoPage.emit("updateAvatar", account);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_go_to_update_avatar.png"),
          path.join(__dirname, "/golden/profile_page_go_to_update_avatar.png"),
          path.join(__dirname, "/profile_page_go_to_update_avatar_diff.png"),
        );

        // Execute
        this.cut.updateAvatarPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_back_from_update_avatar.png"),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(
            __dirname,
            "/profile_page_back_from_update_avatar_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("updateAccountInfo", account);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_go_to_update_account_info.png"),
          path.join(
            __dirname,
            "/golden/profile_page_go_to_update_account_info.png",
          ),
          path.join(
            __dirname,
            "/profile_page_go_to_update_account_info_diff.png",
          ),
        );

        // Execute
        this.cut.updateAccountInfoPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/profile_page_back_from_update_account_info.png",
          ),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(
            __dirname,
            "/profile_page_back_from_update_account_info_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("updatePassword", account.username);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_go_to_update_password.png"),
          path.join(
            __dirname,
            "/golden/profile_page_go_to_update_password.png",
          ),
          path.join(__dirname, "/profile_page_go_to_update_password_diff.png"),
        );

        // Execute
        this.cut.updatePasswordPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_back_from_update_password.png"),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(
            __dirname,
            "/profile_page_back_from_update_password_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("updateRecoveryEmail", account);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_go_to_update_recovery_email.png"),
          path.join(
            __dirname,
            "/golden/profile_page_go_to_update_recovery_email.png",
          ),
          path.join(
            __dirname,
            "/profile_page_go_to_update_recovery_email_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
