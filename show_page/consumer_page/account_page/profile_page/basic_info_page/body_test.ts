import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { BasicInfoPag } from "./body";
import {
  ACCOUNT,
  Account,
} from "@phading/user_service_interface/self/frontend/account";
import {
  GET_ACCOUNT,
  GET_ACCOUNT_REQUEST_BODY,
  GetAccountResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import {
  eqRequestMessageBody,
  eqService,
} from "@selfage/web_service_client/request_test_matcher";
import "../../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "BasicInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name = "NameOnly_HoverAvatar_LeaveAvatar_UpdateAvatar";
      private cut: BasicInfoPag;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = {
          account: {
            avatarLargePath: userImage,
            naturalName: "Some name",
          },
        } as GetAccountResponse;
        this.cut = new BasicInfoPag(webServiceClientMock);

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          webServiceClientMock.request,
          eqService(GET_ACCOUNT),
          "service",
        );
        assertThat(
          webServiceClientMock.request,
          eqRequestMessageBody({}, GET_ACCOUNT_REQUEST_BODY),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_name_only.png"),
          path.join(__dirname, "/golden/basic_info_page_name_only.png"),
          path.join(__dirname, "/basic_info_page_name_only_diff.png"),
        );

        // Execute
        this.cut.avatarContainer.dispatchEvent(new MouseEvent("mouseenter"));
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
        this.cut.avatarContainer.dispatchEvent(new MouseEvent("mouseleave"));
        await new Promise<void>((resolve) =>
          this.cut.once("avatarUpdateHintTransitionEnded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_leave_avatar.png"),
          path.join(__dirname, "/golden/basic_info_page_name_only.png"),
          path.join(__dirname, "/basic_info_page_leave_avatar_diff.png"),
        );

        // Prepare
        let updateAvatar = false;
        this.cut.on("updateAvatar", () => (updateAvatar = true));

        // Execute
        this.cut.avatarContainer.click();

        // Verify
        assertThat(updateAvatar, eq(true), "update avatar");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Full";
      private cut: BasicInfoPag;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = {
          account: {
            avatarLargePath: userImage,
            naturalName: "Some name",
            contactEmail: "aaa@email.com",
            description:
              "long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long",
          },
        } as GetAccountResponse;
        this.cut = new BasicInfoPag(webServiceClientMock);

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
      public name = "UpdateAccountInfo";
      private cut: BasicInfoPag;
      public async execute() {
        // Prepare
        let webServiceClientMock = new WebServiceClientMock();
        webServiceClientMock.response = {
          account: {
            avatarLargePath: userImage,
            naturalName: "Some name",
          },
        } as GetAccountResponse;
        this.cut = new BasicInfoPag(webServiceClientMock);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let accountCaptured: Account;
        this.cut.on(
          "updateAccountInfo",
          (account) => (accountCaptured = account),
        );

        // Execute
        this.cut.infoValuesGroup.click();

        // Verify
        assertThat(
          accountCaptured,
          eqMessage(
            {
              avatarLargePath: userImage,
              naturalName: "Some name",
            },
            ACCOUNT,
          ),
          "account info",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
