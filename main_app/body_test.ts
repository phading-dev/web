import "../dev/env";
import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { normalizeBody } from "../common/normalize_body";
import { setTabletView } from "../common/view_port";
import { AccountPageMock } from "./account_page/body_mock";
import { AuthPageMock } from "./auth_page/body_mock";
import { MainApp } from "./body";
import { ChooseAccountPageMock } from "./choose_account_page/body_mock";
import { ConsumerPageMock } from "./consumer_page/body_mock";
import { PublisherPageMock } from "./publisher_page/body_mock";
import {
  CHECK_CAPABILITY,
  CHECK_CAPABILITY_REQUEST_BODY,
  CheckCapabilityResponse,
} from "@phading/user_session_service_interface/web/interface";
import { AccountPage as AccountPageUrl } from "@phading/web_interface/main/account/page";
import {
  MAIN_APP,
  MainApp as MainAppUrl,
} from "@phading/web_interface/main/app";
import { ConsumerPage as ConsumerPageUrl } from "@phading/web_interface/main/consumer/page";
import { PublisherPage as PublisherPageUrl } from "@phading/web_interface/main/publisher/page";
import { newUnauthorizedError } from "@selfage/http_error";
import { copyMessage } from "@selfage/message/copier";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

function createMainApp(
  serviceClientMock: WebServiceClientMock,
  window?: Window,
): MainApp {
  let nowDate = new Date("2023-10-10T00:00:00Z");
  return new MainApp(
    window ??
      ({
        setInterval: () => {},
        clearInterval: () => {},
      } as any),
    LOCAL_SESSION_STORAGE,
    serviceClientMock,
    (appendBodies) => new AccountPageMock(() => nowDate, appendBodies),
    (appendBodies, initAccountType) =>
      new AuthPageMock(appendBodies, initAccountType),
    (appendBodies, preSelectedAccountId) =>
      new ChooseAccountPageMock(appendBodies, preSelectedAccountId),
    (appendBodies) => new ConsumerPageMock(() => nowDate, appendBodies),
    (appendBodies) => new PublisherPageMock(() => nowDate, appendBodies),
    (...bodies) => document.body.append(...bodies),
  );
}

TEST_RUNNER.run({
  name: "MainAppTest",
  cases: [
    new (class implements TestCase {
      public name = "Navigation_SignInAsConsumer_ChooseAsPublisher_SignOut";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = createMainApp(serviceClientMock);
        let replaceUrl: MainAppUrl;
        this.cut.on(
          "replaceUrl",
          (url) => (replaceUrl = copyMessage(url, MAIN_APP)),
        );
        let newUrl: MainAppUrl;
        this.cut.on("newUrl", (url) => (newUrl = copyMessage(url, MAIN_APP)));

        // Execute
        await this.cut.applyUrl();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_auth.png"),
          path.join(__dirname, "/golden/main_app_auth.png"),
          path.join(__dirname, "/main_app_auth_diff.png"),
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("session 1");
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: true,
            canPublish: false,
            canEarn: false,
          },
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.authPage.emit("signedIn");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(CHECK_CAPABILITY),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              capabilitiesMask: {
                checkCanConsume: true,
                checkCanPublish: true,
                checkCanEarn: true,
              },
            },
            CHECK_CAPABILITY_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(newUrl, eq(undefined), "no newUrl");
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(__dirname, "/main_app_consumer_diff.png"),
        );

        // Execute
        this.cut.consumerPage.emit("newUrl", {
          history: {},
        } as ConsumerPageUrl);

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              consumer: {
                history: {},
              },
            },
            MAIN_APP,
          ),
          "new url consumer history",
        );

        // Execute
        this.cut.consumerPage.emit("goToAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              account: {},
            },
            MAIN_APP,
          ),
          "new url account profile",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_consumer.png"),
          path.join(__dirname, "/golden/main_app_account_consumer.png"),
          path.join(__dirname, "/main_app_account_consumer_diff.png"),
        );

        // Execute
        this.cut.accountPage.emit("replaceUrl", {
          payment: {},
        } as AccountPageUrl);

        // Verify
        assertThat(
          replaceUrl,
          eqMessage(
            {
              account: {
                payment: {},
              },
            },
            MAIN_APP,
          ),
          "replace url account payment",
        );

        // Execute
        this.cut.accountPage.emit("newUrl", {
          statements: {},
        } as AccountPageUrl);

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              account: {
                statements: {},
              },
            },
            MAIN_APP,
          ),
          "new url account statements",
        );

        // Execute
        this.cut.accountPage.emit("goToHome");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(newUrl, eqMessage({}, MAIN_APP), "new url home");
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(__dirname, "/main_app_consumer_diff.png"),
        );

        // Execute
        this.cut.consumerPage.emit("goToAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );
        this.cut.accountPage.emit("chooseAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              chooseAccount: {},
            },
            MAIN_APP,
          ),
          "new url chooseAccount",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_choose_account.png"),
          path.join(__dirname, "/golden/main_app_choose_account.png"),
          path.join(__dirname, "/main_app_choose_account_diff.png"),
        );

        // Prepare
        response = {
          capabilities: {
            canConsume: false,
            canPublish: true,
            canEarn: true,
          },
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.chooseAccountPage.emit("choose");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(
          newUrl,
          eqMessage({}, MAIN_APP),
          "new url home after choose",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher.png"),
          path.join(__dirname, "/golden/main_app_publisher.png"),
          path.join(__dirname, "/main_app_publisher_diff.png"),
        );

        // Execute
        this.cut.publisherPage.emit("newUrl", {
          usage: {},
        } as PublisherPageUrl);

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              publisher: {
                usage: {},
              },
            },
            MAIN_APP,
          ),
          "new url publisher usage",
        );

        // Execute
        this.cut.publisherPage.emit("goToAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              account: {},
            },
            MAIN_APP,
          ),
          "new url account after publisher",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_publisher.png"),
          path.join(__dirname, "/golden/main_app_account_publisher.png"),
          path.join(__dirname, "/main_app_account_publisher_diff.png"),
        );

        // Execute
        this.cut.accountPage.emit("signOut");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(newUrl, eqMessage({}, MAIN_APP), "new url after sign out");
        assertThat(LOCAL_SESSION_STORAGE.read(), eq(null), "session cleared");
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_auth.png"),
          path.join(__dirname, "/golden/main_app_auth.png"),
          path.join(__dirname, "/main_app_auth_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ApplyUrl_ChooseAccountPreselectedPublisher_ApplyWithPreselectedConsumer_ChooseAndContinueAsConsumer_ApplyUrl_ChooseAccountSignOut";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: true,
            canPublish: false,
            canEarn: false,
          },
        };
        serviceClientMock.response = response;
        LOCAL_SESSION_STORAGE.save("session 1");
        this.cut = createMainApp(serviceClientMock);
        let newUrl: MainAppUrl;
        this.cut.on("newUrl", (url) => (newUrl = copyMessage(url, MAIN_APP)));

        // Execute
        await this.cut.applyUrl({
          chooseAccount: {
            preSelectedAccountId: "publisher 1",
          },
          consumer: {
            home: {},
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/main_app_choose_account_preselected_publisher.png",
          ),
          path.join(
            __dirname,
            "/golden/main_app_choose_account_preselected_publisher.png",
          ),
          path.join(
            __dirname,
            "/main_app_choose_account_preselected_publisher_diff.png",
          ),
        );

        // Execute
        await this.cut.applyUrl({
          chooseAccount: {
            preSelectedAccountId: "consumer 1",
          },
          consumer: {
            home: {},
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/main_app_choose_account_preselected_consumer.png",
          ),
          path.join(
            __dirname,
            "/golden/main_app_choose_account_preselected_consumer.png",
          ),
          path.join(
            __dirname,
            "/main_app_choose_account_preselected_consumer_diff.png",
          ),
        );

        // Execute
        this.cut.chooseAccountPage.emit("choose");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              consumer: {
                home: {},
              },
            },
            MAIN_APP,
          ),
          "new url consumer home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(__dirname, "/main_app_consumer_diff.png"),
        );

        // Prepare
        await this.cut.applyUrl({
          chooseAccount: {
            preSelectedAccountId: "consumer 1",
          },
          consumer: {
            home: {},
          },
        });

        // Execute
        this.cut.chooseAccountPage.emit("signOut");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        assertThat(newUrl, eqMessage({}, MAIN_APP), "new url consumer home");
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_auth.png"),
          path.join(__dirname, "/golden/main_app_auth.png"),
          path.join(__dirname, "/main_app_auth_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_AccountPayoutPage_AsConsumer";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: true,
            canPublish: false,
            canEarn: false,
          },
        };
        serviceClientMock.response = response;
        LOCAL_SESSION_STORAGE.save("session 1");
        this.cut = createMainApp(serviceClientMock);
        let replaceUrl: MainAppUrl;
        this.cut.on(
          "replaceUrl",
          (url) => (replaceUrl = copyMessage(url, MAIN_APP)),
        );

        // Execute
        await this.cut.applyUrl({
          account: {
            payout: {},
          },
        });

        // Verify
        assertThat(
          replaceUrl,
          eqMessage(
            {
              account: {},
            },
            MAIN_APP,
          ),
          "replace url account",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_consumer.png"),
          path.join(__dirname, "/golden/main_app_account_consumer.png"),
          path.join(__dirname, "/main_app_account_consumer_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_EmptyNoCapabilities";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: false,
            canPublish: false,
            canEarn: false,
          },
        };
        serviceClientMock.response = response;
        LOCAL_SESSION_STORAGE.save("session 1");
        this.cut = createMainApp(serviceClientMock);

        // Execute
        await this.cut.applyUrl({});

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_payment.png"),
          path.join(__dirname, "/golden/main_app_account_payment.png"),
          path.join(__dirname, "/main_app_account_payment_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_PublisherUrlAsConsumer_ConsumerUrlUpdatePage";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: true,
            canPublish: false,
            canEarn: false,
          },
        };
        serviceClientMock.response = response;
        LOCAL_SESSION_STORAGE.save("session 1");
        this.cut = createMainApp(serviceClientMock);

        // Execute
        await this.cut.applyUrl({
          publisher: {},
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(__dirname, "/main_app_consumer_diff.png"),
        );

        // Prepare
        let page = this.cut.consumerPage;

        // Execute
        await this.cut.applyUrl({
          consumer: {
            listRecentPremieres: {},
          },
        });

        // Verify
        assertThat(
          this.cut.consumerPage,
          eq(page),
          "same consumer page after applyUrl",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer_list_recent_premieres.png"),
          path.join(
            __dirname,
            "/golden/main_app_consumer_list_recent_premieres.png",
          ),
          path.join(
            __dirname,
            "/main_app_consumer_list_recent_premieres_diff.png",
          ),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_ConsumerUrlAsPublisher_PublisherUrlUpdatePage";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: false,
            canPublish: true,
            canEarn: true,
          },
        };
        serviceClientMock.response = response;
        LOCAL_SESSION_STORAGE.save("session 1");
        this.cut = createMainApp(serviceClientMock);

        // Execute
        await this.cut.applyUrl({
          consumer: {},
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher.png"),
          path.join(__dirname, "/golden/main_app_publisher.png"),
          path.join(__dirname, "/main_app_publisher_diff.png"),
        );

        // Prepare
        let page = this.cut.publisherPage;

        // Execute
        await this.cut.applyUrl({
          publisher: {},
        });

        // Verify
        assertThat(this.cut.publisherPage, eq(page), "same publisher page");
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher_create_season.png"),
          path.join(__dirname, "/golden/main_app_publisher_create_season.png"),
          path.join(__dirname, "/main_app_publisher_create_season_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_AccountUrlProfilePage_AccountUrlPaymentPage";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: true,
            canPublish: false,
            canEarn: false,
          },
        };
        serviceClientMock.response = response;
        LOCAL_SESSION_STORAGE.save("session 1");
        this.cut = createMainApp(serviceClientMock);

        // Execute
        await this.cut.applyUrl({
          account: {
            profile: {},
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_consumer.png"),
          path.join(__dirname, "/golden/main_app_account_consumer.png"),
          path.join(__dirname, "/main_app_account_consumer_diff.png"),
        );

        // Prepare
        let page = this.cut.accountPage;

        // Execute
        await this.cut.applyUrl({
          account: {
            payment: {},
          },
        });

        // Verify
        assertThat(this.cut.accountPage, eq(page), "same account page");
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_payment.png"),
          path.join(__dirname, "/golden/main_app_account_payment.png"),
          path.join(__dirname, "/main_app_account_payment_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_AuthCheckFailed_UrlChanged_AuthedAndApplyNewUrl";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.error = newUnauthorizedError("Fake error");
        LOCAL_SESSION_STORAGE.save("session 1");
        this.cut = createMainApp(serviceClientMock);

        // Execute
        await this.cut.applyUrl({});

        // Verify
        assertThat(Boolean(this.cut.authPage), eq(true), "auth page created");

        // Execute
        await this.cut.applyUrl({
          account: {},
        });

        // Verify
        assertThat(Boolean(this.cut.authPage), eq(true), "auth page created");

        // Prepare
        serviceClientMock.error = undefined;
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: true,
            canPublish: false,
            canEarn: false,
          },
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.authPage.emit("signedIn");
        await new Promise<void>((resolve) =>
          this.cut.once("urlApplied", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_consumer.png"),
          path.join(__dirname, "/golden/main_app_account_consumer.png"),
          path.join(__dirname, "/main_app_account_consumer_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
  ],
});
