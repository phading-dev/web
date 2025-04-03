import "../common/normalize_body";
import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { AccountPageMock } from "./account_page/body_mock";
import { AuthPageMock } from "./auth_page/body_mock";
import { MainApp } from "./body";
import { ChooseAccountPageMock } from "./choose_account_page/body_mock";
import { ConsumerPageMock } from "./consumer_page/body_mock";
import { PublisherPageMock } from "./publisher_page/body_mock";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  CHECK_CAPABILITY,
  CHECK_CAPABILITY_REQUEST_BODY,
  CheckCapabilityResponse,
} from "@phading/user_session_service_interface/web/interface";
import {
  AccountPage as AccountPageUrl,
  Page as AccountSubPage,
} from "@phading/web_interface/main/account/page";
import {
  MAIN_APP,
  MainApp as MainAppUrl,
} from "@phading/web_interface/main/app";
import {
  ConsumerPage as ConsumerPageUrl,
  Page as ConsumerSubPage,
} from "@phading/web_interface/main/consumer/page";
import {
  Page as PublisherSubPage,
  PublisherPage as PublisherPageUrl,
} from "@phading/web_interface/main/publisher/page";
import { BlockingLoopMock } from "@selfage/blocking_loop/blocking_loop_mock";
import { newUnauthorizedError } from "@selfage/http_error";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "MainAppTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Auth_SignInAsConsumer_BubbleUpNewUrl_HearBeatCheck_GoToAccount";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let clientMock = new WebServiceClientMock();
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new MainApp(
          LOCAL_SESSION_STORAGE,
          clientMock,
          () => {
            blockingLoopMock = new BlockingLoopMock();
            return blockingLoopMock;
          },
          (appendBodies, signUpInitAccountType) =>
            new AuthPageMock(appendBodies, signUpInitAccountType),
          (appendBodies, preSelectedAccountId) =>
            new ChooseAccountPageMock(appendBodies, preSelectedAccountId),
          (appendBodies) => new AccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          (...bodies) => document.body.append(...bodies),
        );
        let newUrlCaptured: MainAppUrl;
        this.cut.on("newUrl", (newUrl) => (newUrlCaptured = newUrl));

        // Execute
        await this.cut.checkAuthAndApplyUrl({});

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_auth.png"),
          path.join(__dirname, "/golden/main_app_auth.png"),
          path.join(__dirname, "/main_app_auth_diff.png"),
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("session 1");
        clientMock.response = {
          capabilities: {
            canConsume: true,
            canPublish: false,
          },
        } as CheckCapabilityResponse;

        // Execute
        this.cut.authPage.emit("signedIn");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(clientMock.request.descriptor, eq(CHECK_CAPABILITY), "RC");
        assertThat(
          clientMock.request.body,
          eqMessage(
            {
              capabilitiesMask: {
                checkCanConsume: true,
                checkCanPublish: true,
              },
            },
            CHECK_CAPABILITY_REQUEST_BODY,
          ),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(__dirname, "/main_app_consumer_diff.png"),
        );

        // Execute
        this.cut.consumerPage.emit("newUrl", {
          page: ConsumerSubPage.RECOMMENDATION,
        } as ConsumerPageUrl);

        // Verify
        assertThat(
          newUrlCaptured,
          eqMessage(
            {
              consumer: {
                page: ConsumerSubPage.RECOMMENDATION,
              },
            },
            MAIN_APP,
          ),
          "new url",
        );

        // Execute
        await blockingLoopMock.execute();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_heart_consumer_heart_beat_check.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(
            __dirname,
            "/main_app_heart_consumer_heart_beat_check_diff.png",
          ),
        );

        // Execute
        this.cut.consumerPage.emit("goToAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer_to_account.png"),
          path.join(__dirname, "/golden/main_app_account.png"),
          path.join(__dirname, "/main_app_consumer_to_account_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "AuthWithPublisherType_SignInAsPublisher_BubbleUpNewUrl_HearBeatCheck_GoToAccount";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let clientMock = new WebServiceClientMock();
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new MainApp(
          LOCAL_SESSION_STORAGE,
          clientMock,
          () => {
            blockingLoopMock = new BlockingLoopMock();
            return blockingLoopMock;
          },
          (appendBodies, signUpInitAccountType) =>
            new AuthPageMock(appendBodies, signUpInitAccountType),
          (appendBodies, preSelectedAccountId) =>
            new ChooseAccountPageMock(appendBodies, preSelectedAccountId),
          (appendBodies) => new AccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          (...bodies) => document.body.append(...bodies),
        );
        let newUrlCaptured: MainAppUrl;
        this.cut.on("newUrl", (newUrl) => (newUrlCaptured = newUrl));

        // Execute
        await this.cut.checkAuthAndApplyUrl({
          auth: {
            initAccountType: AccountType.PUBLISHER,
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_auth_publisher.png"),
          path.join(__dirname, "/golden/main_app_auth_publisher.png"),
          path.join(__dirname, "/main_app_auth_publisher_diff.png"),
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("session 1");
        clientMock.response = {
          capabilities: {
            canConsume: false,
            canPublish: true,
          },
        } as CheckCapabilityResponse;

        // Execute
        this.cut.authPage.emit("signedIn");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher.png"),
          path.join(__dirname, "/golden/main_app_publisher.png"),
          path.join(__dirname, "/main_app_publisher_diff.png"),
        );

        // Execute
        this.cut.publisherPage.emit("newUrl", {
          page: PublisherSubPage.CATALOG,
        } as PublisherPageUrl);

        // Verify
        assertThat(
          newUrlCaptured,
          eqMessage(
            {
              publisher: {
                page: PublisherSubPage.CATALOG,
              },
            },
            MAIN_APP,
          ),
          "new url",
        );

        // Execute
        await blockingLoopMock.execute();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/main_app_heart_publisher_heart_beat_check.png",
          ),
          path.join(__dirname, "/golden/main_app_publisher.png"),
          path.join(
            __dirname,
            "/main_app_heart_publisher_heart_beat_check_diff.png",
          ),
        );

        // Execute
        this.cut.publisherPage.emit("goToAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher_to_account.png"),
          path.join(__dirname, "/golden/main_app_account.png"),
          path.join(__dirname, "/main_app_publisher_to_account_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Account_BubbleUpNewUrl_HearBeatCheck_GoToHomeAsConsumer";
      private cut: MainApp;
      public async execute() {
        await setViewport(600, 600);
        LOCAL_SESSION_STORAGE.save("session 1");
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          capabilities: {
            canConsume: true,
            canPublish: false,
          },
        } as CheckCapabilityResponse;
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new MainApp(
          LOCAL_SESSION_STORAGE,
          clientMock,
          () => {
            blockingLoopMock = new BlockingLoopMock();
            return blockingLoopMock;
          },
          (appendBodies, signUpInitAccountType) =>
            new AuthPageMock(appendBodies, signUpInitAccountType),
          (appendBodies, preSelectedAccountId) =>
            new ChooseAccountPageMock(appendBodies, preSelectedAccountId),
          (appendBodies) => new AccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          (...bodies) => document.body.append(...bodies),
        );
        let newUrlCaptured: MainAppUrl;
        this.cut.on("newUrl", (newUrl) => (newUrlCaptured = newUrl));

        // Execute
        await this.cut.checkAuthAndApplyUrl({
          account: {},
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account.png"),
          path.join(__dirname, "/golden/main_app_account.png"),
          path.join(__dirname, "/main_app_account_diff.png"),
        );

        // Execute
        this.cut.accountPage.emit("newUrl", {
          page: AccountSubPage.BILLING,
        } as AccountPageUrl);

        // Verify
        assertThat(
          newUrlCaptured,
          eqMessage(
            {
              account: {
                page: AccountSubPage.BILLING,
              },
            },
            MAIN_APP,
          ),
          "new url",
        );

        // Execute
        await blockingLoopMock.execute();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_heart_beat_check.png"),
          path.join(__dirname, "/golden/main_app_account.png"),
          path.join(__dirname, "/main_app_account_heart_beat_check_diff.png"),
        );

        // Execute
        this.cut.accountPage.emit("goToHome");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_to_consumer.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(__dirname, "/main_app_account_to_consumer_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Account_ChooseAccount_ChosenAndGoToHomeAsPublisher";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        LOCAL_SESSION_STORAGE.save("session 1");
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          capabilities: {
            canConsume: false,
            canPublish: true,
          },
        } as CheckCapabilityResponse;
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new MainApp(
          LOCAL_SESSION_STORAGE,
          clientMock,
          () => {
            blockingLoopMock = new BlockingLoopMock();
            return blockingLoopMock;
          },
          (appendBodies, signUpInitAccountType) =>
            new AuthPageMock(appendBodies, signUpInitAccountType),
          (appendBodies, preSelectedAccountId) =>
            new ChooseAccountPageMock(appendBodies, preSelectedAccountId),
          (appendBodies) => new AccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          (...bodies) => document.body.append(...bodies),
        );
        let newUrlCaptured: MainAppUrl;
        this.cut.on("newUrl", (newUrl) => (newUrlCaptured = newUrl));
        await this.cut.checkAuthAndApplyUrl({
          account: {},
        });

        // Execute
        this.cut.accountPage.emit("switchAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_switch_account.png"),
          path.join(__dirname, "/golden/main_app_choose_account.png"),
          path.join(__dirname, "/main_app_account_switch_account_diff.png"),
        );

        // Execute
        this.cut.chooseAccountPage.emit("chosen");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(newUrlCaptured, eqMessage({}, MAIN_APP), "new url");
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_choose_account_chosen.png"),
          path.join(__dirname, "/golden/main_app_publisher.png"),
          path.join(__dirname, "/main_app_choose_account_chosen_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Account_SignOut";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        LOCAL_SESSION_STORAGE.save("session 1");
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          capabilities: {
            canConsume: true,
            canPublish: false,
          },
        } as CheckCapabilityResponse;
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new MainApp(
          LOCAL_SESSION_STORAGE,
          clientMock,
          () => {
            blockingLoopMock = new BlockingLoopMock();
            return blockingLoopMock;
          },
          (appendBodies, signUpInitAccountType) =>
            new AuthPageMock(appendBodies, signUpInitAccountType),
          (appendBodies, preSelectedAccountId) =>
            new ChooseAccountPageMock(appendBodies, preSelectedAccountId),
          (appendBodies) => new AccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          (...bodies) => document.body.append(...bodies),
        );
        await this.cut.checkAuthAndApplyUrl({
          account: {},
        });

        // Execute
        this.cut.accountPage.emit("signOut");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_sign_out.png"),
          path.join(__dirname, "/golden/main_app_auth.png"),
          path.join(__dirname, "/main_app_account_sign_out_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ChooseAccountWithPreSelectedAccountId_SignOut_SignInToChooseAccountAgain_HeartBeatCheck_ChooseAndGoToAccount";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        LOCAL_SESSION_STORAGE.save("session 1");
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          capabilities: {
            canConsume: true,
            canPublish: false,
          },
        } as CheckCapabilityResponse;
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new MainApp(
          LOCAL_SESSION_STORAGE,
          clientMock,
          () => {
            blockingLoopMock = new BlockingLoopMock();
            return blockingLoopMock;
          },
          (appendBodies, signUpInitAccountType) =>
            new AuthPageMock(appendBodies, signUpInitAccountType),
          (appendBodies, preSelectedAccountId) =>
            new ChooseAccountPageMock(appendBodies, preSelectedAccountId),
          (appendBodies) => new AccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          (...bodies) => document.body.append(...bodies),
        );
        let newUrlCaptured: MainAppUrl;
        this.cut.on("newUrl", (newUrl) => (newUrlCaptured = newUrl));

        // Execute
        await this.cut.checkAuthAndApplyUrl({
          chooseAccount: {
            preSelectedAccountId: "consumer 1",
          },
          account: {},
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_choose_consumer.png"),
          path.join(__dirname, "/golden/main_app_choose_consumer.png"),
          path.join(__dirname, "/main_app_choose_consumer_diff.png"),
        );

        // Execute
        this.cut.chooseAccountPage.emit("signOut");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_choose_account_sign_out.png"),
          path.join(__dirname, "/golden/main_app_auth.png"),
          path.join(__dirname, "/main_app_choose_account_sign_out_diff.png"),
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("session 1");

        // Execute
        this.cut.authPage.emit("signedIn");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_choose_consumer_again.png"),
          path.join(__dirname, "/golden/main_app_choose_consumer.png"),
          path.join(__dirname, "/main_app_choose_consumer_again_diff.png"),
        );

        // Execute
        await blockingLoopMock.execute();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/main_app_choose_consumer_heart_beat_check.png",
          ),
          path.join(__dirname, "/golden/main_app_choose_consumer.png"),
          path.join(
            __dirname,
            "/main_app_choose_consumer_heart_beat_check_diff.png",
          ),
        );

        // Execute
        this.cut.chooseAccountPage.emit("chosen");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(
          newUrlCaptured,
          eqMessage(
            {
              account: {},
            },
            MAIN_APP,
          ),
          "new url",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_choose_account_to_account.png"),
          path.join(__dirname, "/golden/main_app_account.png"),
          path.join(__dirname, "/main_app_choose_account_to_account_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ChooseAccount_HeartBeatCheckFailedAndForceSignOut";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        LOCAL_SESSION_STORAGE.save("session 1");
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          capabilities: {
            canConsume: true,
            canPublish: false,
          },
        } as CheckCapabilityResponse;
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new MainApp(
          LOCAL_SESSION_STORAGE,
          clientMock,
          () => {
            blockingLoopMock = new BlockingLoopMock();
            return blockingLoopMock;
          },
          (appendBodies, signUpInitAccountType) =>
            new AuthPageMock(appendBodies, signUpInitAccountType),
          (appendBodies, preSelectedAccountId) =>
            new ChooseAccountPageMock(appendBodies, preSelectedAccountId),
          (appendBodies) => new AccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          (...bodies) => document.body.append(...bodies),
        );
        await this.cut.checkAuthAndApplyUrl({
          chooseAccount: {
            preSelectedAccountId: "consumer 1",
          },
          account: {},
        });
        clientMock.response = undefined;
        clientMock.error = newUnauthorizedError("Fake error");

        // Execute
        await blockingLoopMock.execute();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/main_app_choose_account_heart_beat_check_failed.png",
          ),
          path.join(__dirname, "/golden/main_app_auth.png"),
          path.join(
            __dirname,
            "/main_app_choose_account_heart_beat_check_failed_diff.png",
          ),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
  ],
});
