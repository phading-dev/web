import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { BasicInfoPage } from "./body";
import {
  ACCOUNT_AND_USER,
  AccountAndUser,
} from "@phading/user_service_interface/self/frontend/account";
import {
  GET_ACCOUNT_AND_USER,
  GET_ACCOUNT_AND_USER_REQUEST_BODY,
  GetAccountAndUserResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  mouseMove,
  mouseWheel,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import {
  eqRequestMessageBody,
  eqService,
} from "@selfage/web_service_client/request_test_matcher";
import "../../../../common/normalize_body";

function createAccountAndUserResponse(): GetAccountAndUserResponse {
  return {
    account: {
      avatarLargePath: userImage,
      naturalName: "Some name",
      username: "user1",
      recoveryEmail: "some@gmail.com",
    },
  };
}

TEST_RUNNER.run({
  name: "BasicInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_HoverAvatar_LeaveAvatar_UpdateAvatar";
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new BasicInfoPage(webServiceClientMock);

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          webServiceClientMock.request,
          eqService(GET_ACCOUNT_AND_USER),
          "service",
        );
        assertThat(
          webServiceClientMock.request,
          eqRequestMessageBody({}, GET_ACCOUNT_AND_USER_REQUEST_BODY),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_default.png"),
          path.join(__dirname, "/golden/basic_info_page_default.png"),
          path.join(__dirname, "/basic_info_page_default_diff.png"),
        );

        // Execute
        await mouseMove(400, 70, 1);
        await new Promise<void>((resolve) =>
          this.cut.once("avatarUpdateHintTransitionEnded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_hover_avatar.png"),
          path.join(__dirname, "/golden/basic_info_page_hover_avatar.png"),
          path.join(__dirname, "/basic_info_page_hover_avatar_diff.png"),
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
          path.join(__dirname, "/basic_info_page_leave_avatar.png"),
          path.join(__dirname, "/golden/basic_info_page_default.png"),
          path.join(__dirname, "/basic_info_page_leave_avatar_diff.png"),
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
      public name = "Full";
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = {
          account: {
            avatarLargePath: userImage,
            naturalName: "Some name",
            contactEmail: "aaa@email.com",
            description:
              "long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long",
            username: "user1",
            recoveryEmail: "some@gmail.com",
          },
        } as GetAccountAndUserResponse;
        this.cut = new BasicInfoPage(webServiceClientMock);

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_full.png"),
          path.join(__dirname, "/golden/basic_info_page_full.png"),
          path.join(__dirname, "/basic_info_page_full_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Narrow_ScrollToBottom";
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        await setViewport(350, 600);
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new BasicInfoPage(webServiceClientMock);

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_narrow.png"),
          path.join(__dirname, "/golden/basic_info_page_narrow.png"),
          path.join(__dirname, "/basic_info_page_narrow_diff.png"),
        );

        // Execute
        await mouseMove(1, 1, 1);
        await mouseWheel(10, 400);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_scroll_to_bottom.png"),
          path.join(__dirname, "/golden/basic_info_page_scroll_to_bottom.png"),
          path.join(__dirname, "/basic_info_page_scroll_to_bottom_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateAccountInfo";
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new BasicInfoPage(webServiceClientMock);
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
              avatarLargePath: userImage,
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
      public name = "UpdateUsername";
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new BasicInfoPage(webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateUsername = false;
        this.cut.on("updateUsername", () => (updateUsername = true));

        // Execute
        this.cut.username.val.click();

        // Verify
        assertThat(updateUsername, eq(true), "update username");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdatePassword";
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new BasicInfoPage(webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updatePassword = false;
        this.cut.on("updatePassword", () => (updatePassword = true));

        // Execute
        this.cut.password.val.click();

        // Verify
        assertThat(updatePassword, eq(true), "update password");
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateRecoveryEmail";
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new BasicInfoPage(webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateRecoveryEmail = false;
        this.cut.on("updateRecoveryEmail", () => (updateRecoveryEmail = true));

        // Execute
        this.cut.recoveryEmail.val.click();

        // Verify
        assertThat(updateRecoveryEmail, eq(true), "update recovery email");
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SwitchAccount";
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new BasicInfoPage(webServiceClientMock);
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
      private cut: BasicInfoPage;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = createAccountAndUserResponse();
        this.cut = new BasicInfoPage(webServiceClientMock);
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
