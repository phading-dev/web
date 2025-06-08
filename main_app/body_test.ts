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
import { AccountPageRl } from "@phading/web_interface/main/account/page";
import { MAIN_APP_RL, MainAppRl } from "@phading/web_interface/main/app";
import { ConsumerPageRl } from "@phading/web_interface/main/consumer/page";
import { PublisherPageRl } from "@phading/web_interface/main/publisher/page";
import { newUnauthorizedError } from "@selfage/http_error";
import { copyMessage } from "@selfage/message/copier";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, isArray } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

function createMainApp(
  serviceClientMock: WebServiceClientMock,
  window?: Window,
): [MainApp, Array<MainAppRl>] {
  let nowDate = new Date("2023-10-10T00:00:00Z");
  let rls = new Array<MainAppRl>();
  let app = new MainApp(
    window ??
      ({
        setInterval: () => {},
        clearInterval: () => {},
      } as any),
    LOCAL_SESSION_STORAGE,
    serviceClientMock,
    (appendBodies, canEarn) =>
      new AccountPageMock(() => nowDate, appendBodies, canEarn),
    (appendBodies, initAccountType) =>
      new AuthPageMock(appendBodies, initAccountType),
    (appendBodies, accountId) =>
      new ChooseAccountPageMock(appendBodies, accountId),
    (appendBodies) => new ConsumerPageMock(() => nowDate, appendBodies),
    (appendBodies) => new PublisherPageMock(() => nowDate, appendBodies),
    (...bodies) => document.body.append(...bodies),
  )
    .on("pushRl", (rl) => rls.push(copyMessage(rl, MAIN_APP_RL)))
    .on(
      "replaceRl",
      (rl) => (rls[rls.length - 1] = copyMessage(rl, MAIN_APP_RL)),
    );
  return [app, rls];
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
        let [cut, rls] = createMainApp(serviceClientMock);
        this.cut = cut;

        // Execute
        await this.cut.applyRl();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_auth.png"),
          path.join(__dirname, "/golden/main_app_auth.png"),
          path.join(__dirname, "/main_app_auth_diff.png"),
        );

        // Prepare
        let response: CheckCapabilityResponse = {
          capabilities: {
            canConsume: true,
            canPublish: false,
            canEarn: false,
          },
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.authPage.emit("auth", "session 1");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session 1"),
          "session after auth",
        );
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
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(__dirname, "/main_app_consumer_diff.png"),
        );

        // Execute
        this.cut.consumerPage.emit("pushRl", {
          history: {},
        } as ConsumerPageRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                consumer: {
                  history: {},
                },
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl consumer history",
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.consumerPage.emit("goToAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                account: {},
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl account profile",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_consumer.png"),
          path.join(__dirname, "/golden/main_app_account_consumer.png"),
          path.join(__dirname, "/main_app_account_consumer_diff.png"),
        );

        // Execute
        this.cut.accountPage.emit("replaceRl", {
          payment: {},
        } as AccountPageRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                account: {
                  payment: {},
                },
              },
              MAIN_APP_RL,
            ),
          ]),
          "replace rl account payment",
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.accountPage.emit("pushRl", {
          statements: {},
        } as AccountPageRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                account: {
                  statements: {},
                },
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl account statements",
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.accountPage.emit("chooseAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                chooseAccount: {},
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl chooseAccount",
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
        this.cut.chooseAccountPage.emit("choose", "session 2");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session 2"),
          "session after choose",
        );
        assertThat(
          rls,
          isArray([eqMessage({}, MAIN_APP_RL)]),
          "new rl home after choose",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher.png"),
          path.join(__dirname, "/golden/main_app_publisher.png"),
          path.join(__dirname, "/main_app_publisher_diff.png"),
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.publisherPage.emit("pushRl", {
          usage: {},
        } as PublisherPageRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                publisher: {
                  usage: {},
                },
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl publisher usage",
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.publisherPage.emit("goToAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                account: {},
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl account as publisher",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_publisher.png"),
          path.join(__dirname, "/golden/main_app_account_publisher.png"),
          path.join(__dirname, "/main_app_account_publisher_diff.png"),
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.accountPage.emit("goToHome");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          rls,
          isArray([eqMessage({}, MAIN_APP_RL)]),
          "new rl publisher home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher.png"),
          path.join(__dirname, "/golden/main_app_publisher.png"),
          path.join(__dirname, "/main_app_publisher_diff.png"),
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.publisherPage.emit("goToAccount");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );
        this.cut.accountPage.emit("signOut");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                account: {},
              },
              MAIN_APP_RL,
            ),
            eqMessage({}, MAIN_APP_RL),
          ]),
          "new rl after sign out",
        );
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
      public name = "ApplyRl_SelectedConsumer_ApplyRl_ChooseAccountSignOut";
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
        let [cut, rls] = createMainApp(serviceClientMock);
        this.cut = cut;
        rls.push({
          chooseAccount: {
            accountId: "consumer 1",
          },
          consumer: {
            home: {},
          },
        });
        let chosenAccountId: string;
        this.cut.on("chosen", (accountId) => {
          chosenAccountId = accountId;
        });

        // Execute
        await this.cut.applyRl(rls[0]);

        // Verify
        assertThat(chosenAccountId, eq("consumer 1"), "chosen account id");
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                consumer: {
                  home: {},
                },
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl choose account selected consumer",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/main_app_choose_account_selected_consumer.png",
          ),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(
            __dirname,
            "/main_app_choose_account_selected_consumer_diff.png",
          ),
        );

        // Prepare
        rls.length = 0;
        await this.cut.applyRl({
          chooseAccount: {},
        });

        // Execute
        this.cut.chooseAccountPage.emit("signOut");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          rls,
          isArray([eqMessage({}, MAIN_APP_RL)]),
          "new rl sign out",
        );
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
      public name = "ApplyRl_AccountPayoutPageAsConsumer_PushRl";
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
        let [cut, rls] = createMainApp(serviceClientMock);
        this.cut = cut;
        rls.push({
          account: {
            payout: {},
          },
        });

        // Execute
        await this.cut.applyRl(rls[0]);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                account: {},
              },
              MAIN_APP_RL,
            ),
          ]),
          "replace rl account",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_account_consumer.png"),
          path.join(__dirname, "/golden/main_app_account_consumer.png"),
          path.join(__dirname, "/main_app_account_consumer_diff.png"),
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.accountPage.emit("pushRl", {
          payment: {},
        } as AccountPageRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                account: {
                  payment: {},
                },
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl account payment",
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_EmptyNoCapabilities";
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
        [this.cut] = createMainApp(serviceClientMock);

        // Execute
        await this.cut.applyRl({});

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
      public name = "ApplyRl_PublisherRlAsConsumer_ConsumerRlUpdatePage_PushRl";
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
        let [cut, rls] = createMainApp(serviceClientMock);
        this.cut = cut;
        rls.push({
          publisher: {},
        });

        // Execute
        await this.cut.applyRl(rls[0]);

        // Verify
        assertThat(
          rls,
          isArray([eqMessage({}, MAIN_APP_RL)]),
          "replace rl home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_consumer.png"),
          path.join(__dirname, "/golden/main_app_consumer.png"),
          path.join(__dirname, "/main_app_consumer_diff.png"),
        );

        // Prepare
        let page = this.cut.consumerPage;

        // Execute
        await this.cut.applyRl({
          consumer: {
            listRecentPremieres: {},
          },
        });

        // Verify
        assertThat(
          this.cut.consumerPage,
          eq(page),
          "same consumer page after applyRl",
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

        // Prepare
        rls.length = 0;

        // Excute
        this.cut.consumerPage.emit("pushRl", {
          history: {},
        } as ConsumerPageRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                consumer: {
                  history: {},
                },
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl consumer history",
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ApplyRl_ConsumerRlAsPublisher_PublisherRlUpdatePage_PushRl";
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
        let [cut, rls] = createMainApp(serviceClientMock);
        this.cut = cut;
        rls.push({
          consumer: {},
        });

        // Execute
        await this.cut.applyRl({
          consumer: {},
        });

        // Verify
        assertThat(
          rls,
          isArray([eqMessage({}, MAIN_APP_RL)]),
          "replace rl home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher.png"),
          path.join(__dirname, "/golden/main_app_publisher.png"),
          path.join(__dirname, "/main_app_publisher_diff.png"),
        );

        // Prepare
        let page = this.cut.publisherPage;

        // Execute
        await this.cut.applyRl({
          publisher: {},
        });

        // Verify
        assertThat(this.cut.publisherPage, eq(page), "same publisher page");
        await asyncAssertScreenshot(
          path.join(__dirname, "/main_app_publisher_create_season.png"),
          path.join(__dirname, "/golden/main_app_publisher_create_season.png"),
          path.join(__dirname, "/main_app_publisher_create_season_diff.png"),
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.publisherPage.emit("pushRl", {
          usage: {},
        } as PublisherPageRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                publisher: {
                  usage: {},
                },
              },
              MAIN_APP_RL,
            ),
          ]),
          "new rl publisher usage",
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_AccountRlProfilePage_AccountRlPaymentPage";
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
        [this.cut] = createMainApp(serviceClientMock);

        // Execute
        await this.cut.applyRl({
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
        await this.cut.applyRl({
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
      public name = "ApplyRl_AuthCheckFailed_RlChanged_AuthedAndApplyNewRl";
      private cut: MainApp;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.error = newUnauthorizedError("Fake error");
        LOCAL_SESSION_STORAGE.save("session 1");
        [this.cut] = createMainApp(serviceClientMock);

        // Execute
        await this.cut.applyRl({});

        // Verify
        assertThat(Boolean(this.cut.authPage), eq(true), "auth page created");

        // Execute
        await this.cut.applyRl({
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
        this.cut.authPage.emit("auth", "session 2");
        await new Promise<void>((resolve) =>
          this.cut.once("rlApplied", resolve),
        );

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session 2"),
          "session after auth",
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
  ],
});
