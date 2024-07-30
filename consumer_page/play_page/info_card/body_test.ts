import coverImage = require("./test_data/cover.jpg");
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { InfoCard } from "./body";
import {
  GET_PRICING,
  GET_PRICING_REQUEST_BODY,
  GetPricingResponse,
} from "@phading/commerce_service_interface/consumer/frontend/show/interface";
import { EpisodeSummary } from "@phading/product_service_interface/consumer/frontend/show/episode_to_play";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  mouseClick,
  mouseMove,
  mouseWheel,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import "../../../common/normalize_body";

function createString(base: string, times: number) {
  let arr = new Array<string>();
  for (let i = 0; i < times; i++) {
    arr.push(base);
  }
  return arr.join(" ");
}

function createEpisode(times: number) {
  let episodes = new Array<EpisodeSummary>();
  for (let i = 0; i < times; i++) {
    episodes.push({
      episodeId: `ep${i}`,
      length: 120,
      name: `Episode ${i}`,
      publishedTime: 1719033940,
    });
  }
  return episodes;
}

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "InfoCardTest",
  environment: {
    setUp: () => {
      container = E.div({
        style: `width: 100vm; height: 100vh; display: flex;`,
      });
      document.body.append(container);
    },
    tearDown: () => {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_ShowPricing_FocusAccount";
      private cut: InfoCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let requestCaptured: any;
        this.cut = new InfoCard(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCaptured = request;
              return {
                money: {
                  integer: 0,
                  nano: 100000000,
                },
              } as GetPricingResponse;
            }
          })(),
          {
            season: {
              name: "Season 1",
              grade: 1,
              description: "Something something",
              coverImagePath: coverImage,
            },
            publisher: {
              accountId: "account1",
              naturalName: "User name",
              avatarSmallPath: userImage,
            },
            episode: {
              episodeId: "ep0",
            },
            episodes: createEpisode(1),
          },
        );

        // Execute
        container.append(this.cut.body);
        this.cut.show();
        await new Promise<void>((resolve) =>
          this.cut.once("pricingLoaded", resolve),
        );

        // Verify
        assertThat(requestCaptured.descriptor, eq(GET_PRICING), "service");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              grade: 1,
            },
            GET_PRICING_REQUEST_BODY,
          ),
          "request",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_default.png"),
          path.join(__dirname, "/golden/info_card_default.png"),
          path.join(__dirname, "/info_card_default_diff.png"),
        );

        // Execute
        this.cut.pricingQuestionMark.val.click();
        await new Promise<void>((resolve) =>
          this.cut.pricingQuestionMark.val.once("tooltipShowed", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_show_pricing.png"),
          path.join(__dirname, "/golden/info_card_show_pricing.png"),
          path.join(__dirname, "/info_card_show_pricing_diff.png"),
        );

        // Prepare
        let focusAccount = false;
        this.cut.on("focusAccount", () => (focusAccount = true));

        // Execute
        this.cut.publisher.val.click();

        // Verify
        assertThat(focusAccount, eq(true), "Focus account");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "FailedToLoadPricing";
      private cut: InfoCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        this.cut = new InfoCard(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              throw new Error("Fake error");
            }
          })(),
          {
            season: {
              name: "Season 1",
              grade: 40,
              description: "Something something",
              coverImagePath: coverImage,
            },
            publisher: {
              accountId: "account1",
              naturalName: "User name",
              avatarSmallPath: userImage,
            },
            episode: {
              episodeId: "ep0",
            },
            episodes: createEpisode(1),
          },
        );

        // Execute
        container.append(this.cut.body);
        this.cut.show();
        await new Promise<void>((resolve) =>
          this.cut.once("pricingLoaded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_no_pricing.png"),
          path.join(__dirname, "/golden/info_card_no_pricing.png"),
          path.join(__dirname, "/info_card_no_pricing_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "LongListAndLongDescription_Hover_ClickEpisode_ScrollList_ScrollInfo";
      private cut: InfoCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        this.cut = new InfoCard(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              return {
                money: {
                  integer: 4,
                  nano: 0,
                },
              } as GetPricingResponse;
            }
          })(),
          {
            season: {
              name: createString("This is a title.", 10),
              grade: 8,
              description: createString("Something something.", 30),
              coverImagePath: coverImage,
            },
            publisher: {
              accountId: "account1",
              naturalName: createString("User name", 20),
              avatarSmallPath: userImage,
            },
            episode: {
              episodeId: "ep5",
            },
            episodes: createEpisode(10),
          },
        );

        // Execute
        container.append(this.cut.body);
        this.cut.show();
        await new Promise<void>((resolve) =>
          this.cut.once("pricingLoaded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_long.png"),
          path.join(__dirname, "/golden/info_card_long.png"),
          path.join(__dirname, "/info_card_long_diff.png"),
        );

        // Prepare
        let toPlayEpisodeId: string;
        this.cut.on("play", (episodeId) => (toPlayEpisodeId = episodeId));

        // Execute
        await mouseClick(100, 190);

        // Verify
        assertThat(toPlayEpisodeId, eq(undefined), "nothing to play");

        // Execute
        await mouseClick(100, 280);

        // Verify
        assertThat(toPlayEpisodeId, eq("ep7"), "play episode");
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_hover_episode.png"),
          path.join(__dirname, "/golden/info_card_hover_episode.png"),
          path.join(__dirname, "/info_card_hover_episode_diff.png"),
        );

        // Verify
        await mouseWheel(100, -100);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_episode_list_scroll.png"),
          path.join(__dirname, "/golden/info_card_episode_list_scroll.png"),
          path.join(__dirname, "/info_card_episode_list_scroll_diff.png"),
        );

        // Execute
        await mouseMove(100, 500, 1);
        await mouseWheel(100, 200);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_info_scroll.png"),
          path.join(__dirname, "/golden/info_card_info_scroll.png"),
          path.join(__dirname, "/info_card_info_scroll_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
  ],
});
