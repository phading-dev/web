import path = require("path");
import { AccountPageMock } from "./account_page/body_mock";
import { AccountPageState, Page as AccountPage } from "./account_page/state";
import { ConsumerPage } from "./body";
import { PlayPageMock } from "./play_page/body_mock";
import { RecommendationPageMock } from "./recommendation_page/body_mock";
import { CONSUMER_PAGE_STATE, ConsumerPageState, Page } from "./state";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../common/normalize_body";

TEST_RUNNER.run({
  name: "ConsumerPageTest",
  cases: [
    new (class implements TestCase {
      // Default shows 4 videos. Query string shows 5 videos. Focus account shows 6 videos.
      public name =
        "Default_Query_UpdateDefaultStateCached_FocusAccount_Play_PlayAnother_FocusAccountCached_UpdateInvalidStateToPlay_GoToAccount_UpdateStateWithPaymentMethods_BubbleAccountPageState_SwitchAccount_SignOut_GoHome";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let videoIndex = 1;
        let numOfSeasons = 4;
        this.cut = new ConsumerPage(
          () => new AccountPageMock(),
          (episodeId) => new PlayPageMock(episodeId, videoIndex),
          (state) => new RecommendationPageMock(state, numOfSeasons),
          (...bodies) => document.body.append(...bodies),
        );
        let state: ConsumerPageState;
        this.cut.on("newState", (newState) => (state = newState));

        // Execute
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_default.png"),
          path.join(__dirname, "/golden/consumer_page_default.png"),
          path.join(__dirname, "/consumer_page_default_diff.png"),
        );

        // Prepare
        numOfSeasons = 5;

        // Execute
        this.cut.recommendationPage.emit("search", "some some thing");

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.RECOMMENDATION,
              recommendation: {
                query: "some some thing",
              },
            },
            CONSUMER_PAGE_STATE,
          ),
          "query",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_query.png"),
          path.join(__dirname, "/golden/consumer_page_query.png"),
          path.join(__dirname, "/consumer_page_query_diff.png"),
        );

        // Prepare
        numOfSeasons = 6;

        // Execute
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_back_to_default.png"),
          path.join(__dirname, "/golden/consumer_page_default.png"),
          path.join(__dirname, "/consumer_page_back_to_default_diff.png"),
        );

        // Execute
        this.cut.recommendationPage.emit("focusAccount", "account id 1");

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.RECOMMENDATION,
              recommendation: {
                accountId: "account id 1",
              },
            },
            CONSUMER_PAGE_STATE,
          ),
          "focus account",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_focus_account.png"),
          path.join(__dirname, "/golden/consumer_page_focus_account.png"),
          path.join(__dirname, "/consumer_page_focus_account_diff.png"),
        );

        // Execute
        this.cut.recommendationPage.emit("play", "episode 1");

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.PLAY,
              episodeId: "episode 1",
            },
            CONSUMER_PAGE_STATE,
          ),
          "play",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_play_episode.png"),
          path.join(__dirname, "/golden/consumer_page_play_episode.png"),
          path.join(__dirname, "/consumer_page_play_episode_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 790,
                width: 800,
                height: 10,
              },
            ],
          },
        );

        // Prepare
        videoIndex = 2;

        // Execute
        this.cut.playPage.emit("play", "episode 2");

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.PLAY,
              episodeId: "episode 2",
            },
            CONSUMER_PAGE_STATE,
          ),
          "play 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_play_episode_2.png"),
          path.join(__dirname, "/golden/consumer_page_play_episode_2.png"),
          path.join(__dirname, "/consumer_page_play_episode_2_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 790,
                width: 800,
                height: 10,
              },
            ],
          },
        );

        // Prepare
        numOfSeasons = 4;

        // Execute
        this.cut.playPage.emit("focusAccount", "account id 1");

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.RECOMMENDATION,
              recommendation: {
                accountId: "account id 1",
              },
            },
            CONSUMER_PAGE_STATE,
          ),
          "back to focus account",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_back_to_focus_account.png"),
          path.join(__dirname, "/golden/consumer_page_focus_account.png"),
          path.join(__dirname, "/consumer_page_back_to_focus_account_diff.png"),
        );

        // Execute
        this.cut.updateState({
          page: Page.PLAY,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_invalid_state_to_play.png"),
          path.join(__dirname, "/golden/consumer_page_default.png"),
          path.join(__dirname, "/consumer_page_invalid_state_to_play_diff.png"),
        );

        // Execute
        this.cut.recommendationPage.emit("goToAccount");

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.ACCOUNT,
            },
            CONSUMER_PAGE_STATE,
          ),
          "go to account",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_go_to_account.png"),
          path.join(__dirname, "/golden/consumer_page_go_to_account.png"),
          path.join(__dirname, "/consumer_page_go_to_account_diff.png"),
        );

        // Execute
        this.cut.updateState({
          page: Page.ACCOUNT,
          account: {
            page: AccountPage.PAYMENT_METHODS,
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/consumer_page_update_state_with_payment_methods.png",
          ),
          path.join(
            __dirname,
            "/golden/consumer_page_update_state_with_payment_methods.png",
          ),
          path.join(
            __dirname,
            "/consumer_page_update_state_with_payment_methods_diff.png",
          ),
        );

        // Execute
        this.cut.accountPage.emit("newState", {
          page: AccountPage.PAYMENT_METHODS,
        } as AccountPageState);

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.ACCOUNT,
              account: {
                page: AccountPage.PAYMENT_METHODS,
              },
            },
            CONSUMER_PAGE_STATE,
          ),
          "query",
        );

        // Prepare
        let switchAccount = false;
        this.cut.on("switchAccount", () => (switchAccount = true));

        // Execute
        this.cut.accountPage.emit("switchAccount");

        // Verify
        assertThat(switchAccount, eq(true), "switch account");

        // Prepare
        let signOut = false;
        this.cut.on("signOut", () => (signOut = true));

        // Execute
        this.cut.accountPage.emit("signOut");

        // Verify
        assertThat(signOut, eq(true), "sign out");

        // Execute
        this.cut.accountPage.emit("home");

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.RECOMMENDATION,
              recommendation: {},
            },
            CONSUMER_PAGE_STATE,
          ),
          "back to home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_back_to_home.png"),
          path.join(__dirname, "/golden/consumer_page_default.png"),
          path.join(__dirname, "/consumer_page_back_to_home_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DedupRecommendationPageUpdate";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let counter = 1;
        this.cut = new ConsumerPage(
          () => new AccountPageMock(),
          (episodeId) => new PlayPageMock(episodeId, 1),
          (state) => new RecommendationPageMock(state, counter++),
          (...bodies) => document.body.append(...bodies),
        );

        // Execute
        this.cut.updateState();
        this.cut.updateState({
          page: Page.RECOMMENDATION,
        });

        // Verify
        assertThat(counter, eq(2), "only created recommendation page once");

        // Execute
        this.cut.updateState({
          page: Page.RECOMMENDATION,
          recommendation: {
            accountId: "ac1",
          },
        });
        this.cut.updateState({
          page: Page.RECOMMENDATION,
          recommendation: {
            accountId: "ac1",
          },
        });

        // Verify
        assertThat(
          counter,
          eq(3),
          "only created recommendation page focusing account once",
        );

        // Execute
        this.cut.updateState({
          page: Page.RECOMMENDATION,
          recommendation: {
            query: "a==1",
          },
        });
        this.cut.updateState({
          page: Page.RECOMMENDATION,
          recommendation: {
            query: "a==1",
          },
        });

        // Verify
        assertThat(
          counter,
          eq(4),
          "only created recommendation page with query once",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DedupPlayPageUpdate";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let counter = 1;
        this.cut = new ConsumerPage(
          () => new AccountPageMock(),
          (episodeId) => new PlayPageMock(episodeId, counter++),
          (state) => new RecommendationPageMock(state, 4),
          (...bodies) => document.body.append(...bodies),
        );
        this.cut.updateState({
          page: Page.PLAY,
          episodeId: "ep1",
        });

        // Execute
        this.cut.updateState({
          page: Page.PLAY,
          episodeId: "ep1",
        });

        // Verify
        assertThat(counter, eq(2), "only created play page once");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "InvalidPlayPage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let counter = 1;
        this.cut = new ConsumerPage(
          () => new AccountPageMock(),
          (episodeId) => new PlayPageMock(episodeId, 1),
          (state) => new RecommendationPageMock(state, counter++),
          (...bodies) => document.body.append(...bodies),
        );

        // Execute
        this.cut.updateState({
          page: Page.PLAY,
        });

        // Verify
        assertThat(counter, eq(2), "created recommendation page instead");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
