import path = require("path");
import { AppType } from "./app_type";
import { AuthPageMock } from "./auth_page/container_mock";
import { BodyContainer } from "./body_container";
import { BODY_STATE, BodyState } from "./body_state";
import { ChatPageMock } from "./chat_page/body_mock";
import { ChatPageState, Page as ChatSubPage } from "./chat_page/state";
import { ChooseAppPageMock } from "./choose_app_page/body_mock";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { RandomIntegerGeneratorMock } from "./common/random_integer_generator_mock";
import { ShowPageMock } from "./show_page/body_mock";
import { Page as ShowSubPage, ShowPageState } from "./show_page/state";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  deleteFile,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "./common/normalize_body";

TEST_RUNNER.run({
  name: "BodyContainerTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_SignIn_SignOut";
      private cut: BodyContainer;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let userServiceClient = new WebServiceClient(undefined, undefined);

        // Execute
        this.cut = new BodyContainer(
          (appendBodies) => new AuthPageMock(appendBodies),
          (currentApp, appendBodies) =>
            new ChooseAppPageMock(currentApp, appendBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ChatPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ShowPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          new RandomIntegerGeneratorMock(1),
          LOCAL_SESSION_STORAGE,
          userServiceClient,
          document.body
        );
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_default.png"),
          path.join(__dirname, "/golden/body_default.png"),
          path.join(__dirname, "/body_default_diff.png")
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("111");

        // Execute
        this.cut.authPage.emit("signedIn");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_in.png"),
          path.join(__dirname, "/golden/body_signed_in.png"),
          path.join(__dirname, "/body_signed_in_diff.png")
        );

        // Execute
        this.cut.signOutButton.click();

        // Verify
        assertThat(LOCAL_SESSION_STORAGE.read(), eq(null), "cleared session");
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_out.png"),
          path.join(__dirname, "/golden/body_default.png"),
          path.join(__dirname, "/body_signed_out_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "SignOutWithoutSigningIn";
      private cut: BodyContainer;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let userServiceClient = new WebServiceClient(undefined, undefined);
        this.cut = new BodyContainer(
          (appendBodies) => new AuthPageMock(appendBodies),
          (currentApp, appendBodies) =>
            new ChooseAppPageMock(currentApp, appendBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ChatPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ShowPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          new RandomIntegerGeneratorMock(1),
          LOCAL_SESSION_STORAGE,
          userServiceClient,
          document.body
        );
        this.cut.updateState();
        await screenshot(path.join(__dirname, "/body_before_signing_out.png"));

        // Execute
        this.cut.signOutButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_out_without_signing_in.png"),
          path.join(__dirname, "/body_before_signing_out.png"),
          path.join(__dirname, "/body_signed_out_without_signing_in_diff.png")
        );

        // Cleanup
        await deleteFile(path.join(__dirname, "/body_before_signing_out.png"));
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "ChooseApp_Back";
      private cut: BodyContainer;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let userServiceClient = new WebServiceClient(undefined, undefined);
        this.cut = new BodyContainer(
          (appendBodies) => new AuthPageMock(appendBodies),
          (currentApp, appendBodies) =>
            new ChooseAppPageMock(currentApp, appendBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ChatPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ShowPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          new RandomIntegerGeneratorMock(1),
          LOCAL_SESSION_STORAGE,
          userServiceClient,
          document.body
        );
        this.cut.updateState();
        await screenshot(path.join(__dirname, "/body_before_choose_app.png"));

        // Execute
        this.cut.chooseAppButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_choose_app.png"),
          path.join(__dirname, "/golden/body_choose_app.png"),
          path.join(__dirname, "/body_choose_app_diff.png")
        );

        // Execute
        this.cut.chooseAppPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_back_from_choose_app.png"),
          path.join(__dirname, "/body_before_choose_app.png"),
          path.join(__dirname, "/body_back_from_choose_app_diff.png")
        );

        // Cleanup
        await deleteFile(path.join(__dirname, "/body_before_choose_app.png"));
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "ChooseApp_SignIn";
      private cut: BodyContainer;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let userServiceClient = new WebServiceClient(undefined, undefined);
        this.cut = new BodyContainer(
          (appendBodies) => new AuthPageMock(appendBodies),
          (currentApp, appendBodies) =>
            new ChooseAppPageMock(currentApp, appendBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ChatPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ShowPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          new RandomIntegerGeneratorMock(1),
          LOCAL_SESSION_STORAGE,
          userServiceClient,
          document.body
        );
        this.cut.updateState();
        let newStateCaptured: BodyState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));
        await screenshot(path.join(__dirname, "/body_before_chosen_app.png"));
        // Choose app page
        this.cut.chooseAppButton.click();

        // Execute
        this.cut.chooseAppPage.emit("chosen", AppType.Show);

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              app: AppType.Show,
            },
            BODY_STATE
          ),
          "updated new state"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_chosen_app.png"),
          path.join(__dirname, "/body_before_chosen_app.png"),
          path.join(__dirname, "/body_chosen_app_diff.png")
        );

        // Cleanup
        await deleteFile(path.join(__dirname, "/body_before_chosen_app.png"));

        // Prepare
        LOCAL_SESSION_STORAGE.save("111");

        // Execute
        this.cut.authPage.emit("signedIn");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_in_after_chosen_app.png"),
          path.join(__dirname, "/golden/body_signed_in_after_chosen_app.png"),
          path.join(__dirname, "/body_signed_in_after_chosen_app_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name =
        "SignedOutWithChatApp_SignIn_BubbleNewChatPageState_UpdateWithShowApp_BubbleNewShowPageState";
      private cut: BodyContainer;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let userServiceClient = new WebServiceClient(undefined, undefined);

        // Execute
        this.cut = new BodyContainer(
          (appendBodies) => new AuthPageMock(appendBodies),
          (currentApp, appendBodies) =>
            new ChooseAppPageMock(currentApp, appendBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ChatPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new ShowPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
          new RandomIntegerGeneratorMock(1),
          LOCAL_SESSION_STORAGE,
          userServiceClient,
          document.body
        );
        this.cut.updateState({
          app: AppType.Chat,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_out_with_chat_app.png"),
          path.join(__dirname, "/golden/body_signed_out_with_chat_app.png"),
          path.join(__dirname, "/body_signed_out_with_chat_app_diff.png")
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("111");

        // Execute
        this.cut.authPage.emit("signedIn");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_in_with_chat_app.png"),
          path.join(__dirname, "/golden/body_signed_in_with_chat_app.png"),
          path.join(__dirname, "/body_signed_in_with_chat_app_diff.png")
        );

        // Prepare
        let newStateCaptured: BodyState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));

        // Execute
        this.cut.chatPage.emit("newState", {
          page: ChatSubPage.Consumer,
        } as ChatPageState);

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              app: AppType.Chat,
              chat: {
                page: ChatSubPage.Consumer,
              },
            },
            BODY_STATE
          ),
          "updated chat page state"
        );

        // Execute
        this.cut.updateState({
          app: AppType.Show,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_update_state_with_show_app.png"),
          path.join(__dirname, "/golden/body_update_state_with_show_app.png"),
          path.join(__dirname, "/body_update_state_with_show_app_diff.png")
        );

        // Execute
        this.cut.showPage.emit("newState", {
          page: ShowSubPage.Consumer,
        } as ShowPageState);

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              app: AppType.Show,
              show: {
                page: ShowSubPage.Consumer,
              },
            },
            BODY_STATE
          ),
          "updated show page state"
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
  ],
});
