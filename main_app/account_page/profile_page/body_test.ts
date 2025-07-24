import userImage = require("./common/test_data/user_image.jpg");
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setDesktopView } from "../../../common/view_port";
import { ProfilePage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";
import { UpdateAccountInfoPage } from "./update_account_info_page/body";
import { UpdateAvatarPage } from "./update_avatar_page/body";
import { UpdatePasswordPage } from "./update_password_page/body";
import { UpdateUserEmailPage } from "./update_user_email_page/body";
import { MAX_AVATAR_SIZE } from "@phading/constants/account";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "ProfilePageTest",
  cases: [
    new (class implements TestCase {
      public name = "Navigation";
      private cut: ProfilePage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let account: AccountAndUser = {
          avatarLargeUrl: userImage,
          userEmail: "my@gmail.com",
          name: "First Second",
        };

        // Execute
        this.cut = new ProfilePage(
          () => new InfoPageMock(),
          (account) =>
            new UpdateAvatarPage(undefined, MAX_AVATAR_SIZE, account),
          (account) => new UpdateAccountInfoPage(undefined, account),
          (userEmail) => new UpdatePasswordPage(undefined, userEmail),
          (account) => new UpdateUserEmailPage(undefined, account),
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
        this.cut.infoPage.emit("updatePassword", account);

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
        this.cut.infoPage.emit("updateUserEmail", account);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_go_to_update_user_email.png"),
          path.join(
            __dirname,
            "/golden/profile_page_go_to_update_user_email.png",
          ),
          path.join(
            __dirname,
            "/profile_page_go_to_update_user_email_diff.png",
          ),
        );

        // Prepare
        let signOut = false;
        this.cut.on("signOut", () => {
          signOut = true;
        });

        // Execute
        this.cut.updateUserEmailPage.emit("signOut");

        // Verify
        assertThat(signOut, eq(true), "sign out from update user email page");

        // Execute
        this.cut.updateUserEmailPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_back_from_update_user_email.png"),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(
            __dirname,
            "/profile_page_back_from_update_user_email_diff.png",
          ),
        );

        // Prepare
        let chooseAccount = false;
        this.cut.on("chooseAccount", () => {
          chooseAccount = true;
        });

        // Execute
        this.cut.infoPage.emit("chooseAccount");

        // Verify
        assertThat(chooseAccount, eq(true), "choose account");

        // Prepare
        signOut = false;

        // Execute
        this.cut.infoPage.emit("signOut");

        // Verify
        assertThat(signOut, eq(true), "sign out from info page");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
