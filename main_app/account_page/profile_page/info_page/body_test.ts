import "../../../../common/normalize_body";
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../../common/view_port";
import { InfoPage } from "./body";
import {
  ACCOUNT_AND_USER,
  AccountAndUser,
} from "@phading/user_service_interface/web/self/account";
import {
  GET_ACCOUNT_AND_USER,
  GET_ACCOUNT_AND_USER_REQUEST_BODY,
  GetAccountAndUserResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseMove, mouseWheel } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

function createAccountAndUserResponse(): GetAccountAndUserResponse {
  return {
    account: {
      avatarLargeUrl: userImage,
      naturalName: "Some name",
      username: "user1",
      recoveryEmail: "some@gmail.com",
    },
  };
}

TEST_RUNNER.run({
  name: "InfoPageTest",
  cases: [
    new (class implements TestCase {
      public name = "HoverAvatar_LeaveAvatar_UpdateAvatar";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new InfoPage(webServiceClientMock);

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          webServiceClientMock.request.descriptor,
          eq(GET_ACCOUNT_AND_USER),
          "RC",
        );
        assertThat(
          webServiceClientMock.request.body,
          eqMessage({}, GET_ACCOUNT_AND_USER_REQUEST_BODY),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_default.png"),
          path.join(__dirname, "/golden/info_page_default.png"),
          path.join(__dirname, "/info_page_default_diff.png"),
        );

        // Execute
        await mouseMove(600, 70, 1);
        await new Promise<void>((resolve) =>
          this.cut.once("avatarUpdateHintTransitionEnded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_hover_avatar.png"),
          path.join(__dirname, "/golden/info_page_hover_avatar.png"),
          path.join(__dirname, "/info_page_hover_avatar_diff.png"),
        );

        // Execute
        this.cut.avatarContainer.val.dispatchEvent(
          new MouseEvent("mouseleave"),
        );
        await new Promise<void>((resolve) =>
          this.cut.once("avatarUpdateHintTransitionEnded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_leave_avatar.png"),
          path.join(__dirname, "/golden/info_page_default.png"),
          path.join(__dirname, "/info_page_leave_avatar_diff.png"),
        );

        // Prepare
        let updateAvatar = false;
        this.cut.on("updateAvatar", () => (updateAvatar = true));

        // Execute
        this.cut.avatarContainer.val.click();

        // Verify
        assertThat(updateAvatar, eq(true), "update avatar");
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "FullAndLong";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = {
          account: {
            avatarLargeUrl: userImage,
            naturalName: "Some name",
            contactEmail: "aaa@email.com",
            description:
              "long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long",
            username: "user1",
            recoveryEmail: "some@gmail.com",
          },
        } as GetAccountAndUserResponse;
        this.cut = new InfoPage(webServiceClientMock);

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_full_and_long.png"),
          path.join(__dirname, "/golden/info_page_full_and_long.png"),
          path.join(__dirname, "/info_page_full_and_long_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Narrow_ScrollToBottom";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new InfoPage(webServiceClientMock);

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone.png"),
          path.join(__dirname, "/golden/info_page_phone.png"),
          path.join(__dirname, "/info_page_phone_diff.png"),
        );

        // Execute
        await mouseMove(1, 1, 1);
        await mouseWheel(10, 400);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_scroll_to_bottom.png"),
          path.join(__dirname, "/golden/info_page_phone_scroll_to_bottom.png"),
          path.join(__dirname, "/info_page_phone_scroll_to_bottom_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateAccountInfo";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new InfoPage(webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let accountCaptured: AccountAndUser;
        this.cut.on(
          "updateAccountInfo",
          (account) => (accountCaptured = account),
        );

        // Execute
        this.cut.accountInfo.val.click();

        // Verify
        assertThat(
          accountCaptured,
          eqMessage(
            {
              avatarLargeUrl: userImage,
              naturalName: "Some name",
              username: "user1",
              recoveryEmail: "some@gmail.com",
            },
            ACCOUNT_AND_USER,
          ),
          "account info",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdatePassword";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new InfoPage(webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let accountCaptured: AccountAndUser;
        this.cut.on("updatePassword", (account) => (accountCaptured = account));

        // Execute
        this.cut.password.val.click();

        // Verify
        assertThat(
          accountCaptured,
          eqMessage(
            {
              avatarLargeUrl: userImage,
              naturalName: "Some name",
              username: "user1",
              recoveryEmail: "some@gmail.com",
            },
            ACCOUNT_AND_USER,
          ),
          "account info",
        );
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateRecoveryEmail";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new InfoPage(webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let accountCaptured: AccountAndUser;
        this.cut.on(
          "updateRecoveryEmail",
          (account) => (accountCaptured = account),
        );

        // Execute
        this.cut.recoveryEmail.val.click();

        // Verify
        assertThat(
          accountCaptured,
          eqMessage(
            {
              avatarLargeUrl: userImage,
              naturalName: "Some name",
              username: "user1",
              recoveryEmail: "some@gmail.com",
            },
            ACCOUNT_AND_USER,
          ),
          "account info",
        );
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SwitchAccount";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new InfoPage(webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let switchAccount = false;
        this.cut.on("switchAccount", () => (switchAccount = true));

        // Execute
        this.cut.switchAccountButton.val.click();

        // Verify
        assertThat(switchAccount, eq(true), "switch account");
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SignOut";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new InfoPage(webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let signOut = false;
        this.cut.on("signOut", () => (signOut = true));

        // Execute
        this.cut.signOutButton.val.click();

        // Verify
        assertThat(signOut, eq(true), "sign out");
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
  ],
});
