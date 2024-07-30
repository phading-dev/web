import path = require("path");
import { AuthPageMock } from "./auth_page/body_mock";
import { ChooseAccountPageMock } from "./choose_account_page/body_mock";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { ConsumerPageMock } from "./consumer_page/body_mock";
import { ConsumerPageState, Page } from "./consumer_page/state";
import { PublisherPageMock } from "./publisher_page/body_mock";
import { RootPage } from "./root_page";
import { ROOT_PAGE_STATE, RootPageState } from "./root_page_state";
import {
  CHECK_CAPABILITY,
  CHECK_CAPABILITY_REQUEST_BODY,
  CheckCapabilityResponse,
} from "@phading/user_session_service_interface/frontend/interface";
import { BlockingLoopMock } from "@selfage/blocking_loop/blocking_loop_mock";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import {
  eqRequestMessageBody,
  eqService,
} from "@selfage/web_service_client/request_test_matcher";
import "./common/normalize_body";
import { newUnauthorizedError } from "@selfage/http_error";

TEST_RUNNER.run({
  name: "RootPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "DefaultSignedOut_SignedIn_ChosenAccount_BubbleUpNewState_HeartBeatCheck_SwitchAccount_SignOut";
      private cut: RootPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let clientMock = new WebServiceClientMock();
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new RootPage(
          LOCAL_SESSION_STORAGE,
          clientMock,
          (style) => {
            blockingLoopMock = new BlockingLoopMock(style);
            return blockingLoopMock;
          },
          (appendBodies) => new AuthPageMock(appendBodies),
          (appendBodies) => new ChooseAccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          document.body,
        );
        let newStateCaptured: RootPageState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));

        // Execute
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/root_page_default.png"),
          path.join(__dirname, "/golden/root_page_auth.png"),
          path.join(__dirname, "/root_page_default_diff.png"),
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("session 1");
        clientMock.response = {
          canConsumeShows: false,
          canPublishShows: false,
        } as CheckCapabilityResponse;

        // Execute
        this.cut.authPage.emit("signedIn");
        await new Promise<void>((resolve) =>
          this.cut.once("stateUpdated", resolve),
        );

        // Verify
        assertThat(clientMock.request, eqService(CHECK_CAPABILITY), "service");
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              checkCanConsumeShows: true,
              checkCanPublishShows: true,
            },
            CHECK_CAPABILITY_REQUEST_BODY,
          ),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/root_page_first_signed_in.png"),
          path.join(__dirname, "/golden/root_page_choose_account.png"),
          path.join(__dirname, "/root_page_first_signed_in_diff.png"),
        );

        // Prepare
        clientMock.response = {
          canConsumeShows: true,
          canPublishShows: false,
        } as CheckCapabilityResponse;

        // Execute
        this.cut.chooseAccountPage.emit("chosen");
        await new Promise<void>((resolve) =>
          this.cut.once("stateUpdated", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/root_page_chosen_consumer.png"),
          path.join(__dirname, "/golden/root_page_chosen_consumer.png"),
          path.join(__dirname, "/root_page_chosen_consumer_diff.png"),
        );

        // Execute
        this.cut.consumerPage.emit("newState", {
          page: Page.RECOMMENDATION,
        } as ConsumerPageState);

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              consumer: {
                page: Page.RECOMMENDATION,
              },
            },
            ROOT_PAGE_STATE,
          ),
          "consumer page state bubbled up",
        );

        // Execute
        await blockingLoopMock.execute();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/root_page_heart_beat_check.png"),
          path.join(__dirname, "/golden/root_page_chosen_consumer.png"),
          path.join(__dirname, "/root_page_heart_beat_check_diff.png"),
        );

        // Execute
        this.cut.consumerPage.emit("switchAccount");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/root_page_switch_account.png"),
          path.join(__dirname, "/golden/root_page_choose_account.png"),
          path.join(__dirname, "/root_page_switch_account_diff.png"),
        );

        // Prepare
        this.cut.chooseAccountPage.emit("chosen");
        await new Promise<void>((resolve) =>
          this.cut.once("stateUpdated", resolve),
        );

        // Execute
        this.cut.consumerPage.emit("signOut");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/root_page_sign_out.png"),
          path.join(__dirname, "/golden/root_page_auth.png"),
          path.join(__dirname, "/root_page_sign_out_diff.png"),
        );
      }
      public tearDown() {
        LOCAL_SESSION_STORAGE.clear();
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ConsumerPageStateWithCapabilityToPublish_HeartBeatForcedSignOut";
      private cut: RootPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let clientMock = new WebServiceClientMock();
        let blockingLoopMock: BlockingLoopMock;
        this.cut = new RootPage(
          LOCAL_SESSION_STORAGE,
          clientMock,
          (style) => {
            blockingLoopMock = new BlockingLoopMock(style);
            return blockingLoopMock;
          },
          (appendBodies) => new AuthPageMock(appendBodies),
          (appendBodies) => new ChooseAccountPageMock(appendBodies),
          (appendBodies) => new ConsumerPageMock(appendBodies),
          (appendBodies) => new PublisherPageMock(appendBodies),
          document.body,
        );
        LOCAL_SESSION_STORAGE.save("session 1");
        clientMock.response = {
          canConsumeShows: false,
          canPublishShows: true,
        } as CheckCapabilityResponse;

        // Execute
        this.cut.updateState({
          consumer: {
            page: Page.ACCOUNT,
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/root_page_consumer_state_with_capabilit_to_publish.png"),
          path.join(__dirname, "/golden/root_page_consumer_state_with_capabilit_to_publish.png"),
          path.join(__dirname, "/root_page_consumer_state_with_capabilit_to_publish_diff.png"),
        );

        // Prepare
        clientMock.error = newUnauthorizedError("Fake error");

        // Execute
        await blockingLoopMock.execute();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/root_page_forced_sign_out.png"),
          path.join(__dirname, "/golden/root_page_forced_sign_out.png"),
          path.join(__dirname, "/root_page_forced_sign_out_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
