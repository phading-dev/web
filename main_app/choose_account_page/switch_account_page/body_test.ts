import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { SwitchAccountPage } from "./body";
import {
  SWITCH_ACCOUNT,
  SWITCH_ACCOUNT_REQUEST_BODY,
  SwitchAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, containStr, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "ListAccountsPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Success";
      private cut: SwitchAccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: SwitchAccountResponse = {
          signedSession: "session1",
        };
        serviceClientMock.response = response;

        // Execute
        this.cut = new SwitchAccountPage(serviceClientMock, "account1", false);
        document.body.append(this.cut.body);

        // Verify
        let signedSession = await new Promise<string>((resolve) =>
          this.cut.once("choose", (signedSession) => resolve(signedSession)),
        );
        assertThat(
          serviceClientMock.request.descriptor,
          eq(SWITCH_ACCOUNT),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage({ accountId: "account1" }, SWITCH_ACCOUNT_REQUEST_BODY),
          "RC body",
        );
        assertThat(signedSession, eq("session1"), "session");
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_default.png"),
          path.join(__dirname, "/golden/list_accounts_page_default.png"),
          path.join(__dirname, "/list_accounts_page_default_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NotFound";
      private cut: SwitchAccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: SwitchAccountResponse = {
          notFound: true,
        };
        serviceClientMock.response = response;

        // Execute
        this.cut = new SwitchAccountPage(serviceClientMock, "account1", false);

        // Verify
        let message = await new Promise<string>((resolve) =>
          this.cut.once("error", (message) => resolve(message)),
        );
        assertThat(message, containStr("profile not found"), "error message");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Error";
      private cut: SwitchAccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut = new SwitchAccountPage(serviceClientMock, "account1", false);

        // Verify
        let message = await new Promise<string>((resolve) =>
          this.cut.once("error", (message) => resolve(message)),
        );
        assertThat(
          message,
          containStr("Failed to switch profile"),
          "error message",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
