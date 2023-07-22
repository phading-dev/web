import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { AccountInfoPageMock } from "./account_info_page_mock";
import { AccountPage } from "./container";
import { ACCOUNT_PAGE_STATE, AccountPageState, Page } from "./state";
import { UpdateAvatarPageMock } from "./update_avartar_page_mock";
import { UpdatePasswordPageMock } from "./update_password_page_mock";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import "../../common/normalize_body";

let container: HTMLDivElement;
let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "AccountPageTest",
  environment: {
    setUp() {
      container = E.div({});
      menuContainer = E.div({
        style: `position: fixed; left: 0; top: 0;`,
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
      public name = "RenderAndSwitch";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let state: AccountPageState;
        let accountInfoPageMock = new AccountInfoPageMock({
          username: "some user name",
          naturalName: "Mr. Your Name",
          email: "xxxxx@gmail.com",
          avatarLargePath: userImage,
        });
        let updateAvatarPageMock = new UpdateAvatarPageMock();
        let updatePasswordPageMock = new UpdatePasswordPageMock();
        this.cut = new AccountPage(
          () => accountInfoPageMock,
          () => updateAvatarPageMock,
          () => updatePasswordPageMock,
          (...bodies) => container.append(...bodies),
          (...bodies) => menuContainer.append(...bodies)
        );
        this.cut.on("newState", (newState) => (state = newState));

        // Execute
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_account_info.png"),
          path.join(__dirname, "/golden/account_page_account_info.png"),
          path.join(__dirname, "/account_page_account_info_diff.png")
        );

        // Execute
        accountInfoPageMock.avatarContainer.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.UpdateAvatar,
            },
            ACCOUNT_PAGE_STATE
          ),
          "go to update avatar page"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_update_avatar.png"),
          path.join(__dirname, "/golden/account_page_update_avatar.png"),
          path.join(__dirname, "/account_page_update_avatar_diff.png")
        );

        // Execute
        updateAvatarPageMock.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.AccountInfo,
            },
            ACCOUNT_PAGE_STATE
          ),
          "back to account info page"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_back_to_account_info.png"),
          path.join(__dirname, "/golden/account_page_account_info.png"),
          path.join(__dirname, "/account_page_back_to_account_info.png")
        );

        // Execute
        accountInfoPageMock.passwordEditable.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.UpdatePassword,
            },
            ACCOUNT_PAGE_STATE
          ),
          "back to update password page"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_update_password.png"),
          path.join(__dirname, "/golden/account_page_update_password.png"),
          path.join(__dirname, "/account_page_update_password_diff.png")
        );

        // Execute
        updatePasswordPageMock.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.AccountInfo,
            },
            ACCOUNT_PAGE_STATE
          ),
          "back to account info page again"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_back_to_account_info_again.png"),
          path.join(__dirname, "/golden/account_page_account_info.png"),
          path.join(
            __dirname,
            "/account_page_back_to_account_info_again_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
