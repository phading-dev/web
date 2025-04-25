import "../../../dev/env";
import "../../../common/normalize_body";
import coverImage = require("../common/test_data/cover_tall.jpg");
import userImage = require("../common/test_data/user_image.jpg");
import path = require("path");
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { SeasonDetailsPage } from "./body";
import {
  ADD_TO_WATCH_LATER_LIST,
  ADD_TO_WATCH_LATER_LIST_REQUEST_BODY,
  CHECK_IN_WATCH_LATER_LIST,
  CHECK_IN_WATCH_LATER_LIST_REQUEST_BODY,
  CheckInWatchLaterListResponse,
  DELETE_FROM_WATCH_LATER_LIST,
  DELETE_FROM_WATCH_LATER_LIST_REQUEST_BODY,
  GET_LATEST_WATCHED_TIME_OF_EPISODE,
  GET_LATEST_WATCHED_TIME_OF_EPISODE_REQUEST_BODY,
  GetLatestWatchedTimeOfEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  GET_CONTINUE_EPISODE,
  GET_CONTINUE_EPISODE_REQUEST_BODY,
  GET_INDIVIDUAL_SEASON_RATING,
  GET_INDIVIDUAL_SEASON_RATING_REQUEST_BODY,
  GET_SEASON_DETAILS,
  GET_SEASON_DETAILS_REQUEST_BODY,
  GetContinueEpisodeResponse,
  GetIndividualSeasonRatingResponse,
  GetSeasonDetailsResponse,
  LIST_EPISODES,
  LIST_EPISODES_REQUEST_BODY,
  ListEpisodesResponse,
  RATE_SEASON,
  RATE_SEASON_REQUEST_BODY,
  UNRATE_SEASON,
  UNRATE_SEASON_REQUEST_BODY,
} from "@phading/product_service_interface/show/web/consumer/interface";
import {
  GET_ACCOUNT_SUMMARY,
  GET_ACCOUNT_SUMMARY_REQUEST_BODY,
  GetAccountSummaryResponse,
} from "@phading/user_service_interface/web/third_person/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

function waitToGetContinueTime(
  cut: SeasonDetailsPage,
  times: number,
): Promise<void> {
  let count = 0;
  return new Promise<void>((resolve) => {
    cut.on("gotContinueTime", () => {
      count++;
      if (count === times) {
        resolve();
        cut.removeAllListeners("gotContinueTime");
      }
    });
  });
}

TEST_RUNNER.run({
  name: "WatchLaterPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "FirstTimeWatchingASeasonWithTwoEpisodes_Desktop_Tablet_Phone_PlayContinueEpisode_RateAndUnratingAllStars_WaterLaterAndUndo_CopyShareLink_PublisherShowroom_PlayEpisode1_PlayEpisode2";
      private cut: SeasonDetailsPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case GET_SEASON_DETAILS: {
                assertThat(
                  request.body,
                  eqMessage(
                    {
                      seasonId: "season1",
                    },
                    GET_SEASON_DETAILS_REQUEST_BODY,
                  ),
                  "GetSeasonDetailsRequest",
                );
                let response: GetSeasonDetailsResponse = {
                  seasonDetails: {
                    seasonId: "season1",
                    publisherId: "publisher1",
                    name: "Re-Zero Starting Life in Another World",
                    description:
                      "Re-Zero Starting Life in Another World is a Japanese light novel series written by Tappei Nagatsuki and illustrated by Shinichirou Otsuka. The story centers around Subaru Natsuki, a young man who is suddenly transported to another world on his way home from the convenience store. Without any sign of the person who summoned him, he soon discovers he has gained the ability to return to a specific point in time upon his death, a power he dubs 'Return by Death.' Subaru uses this ability to protect his newfound friends and unravel the mysteries of this new world, all while facing the emotional and physical toll of repeatedly experiencing his own death. The series is known for its intricate plot, deep character development, and exploration of themes such as perseverance, sacrifice, and the consequences of one's actions.",
                    coverImageUrl: coverImage,
                    averageRating: 4.5,
                    ratingsCount: 1234,
                    grade: 90,
                    totalEpisodes: 2,
                  },
                };
                return response;
              }
              case GET_ACCOUNT_SUMMARY: {
                assertThat(
                  request.body,
                  eqMessage(
                    {
                      accountId: "publisher1",
                    },
                    GET_ACCOUNT_SUMMARY_REQUEST_BODY,
                  ),
                  "GetAccountSummaryRequest",
                );
                let response: GetAccountSummaryResponse = {
                  account: {
                    accountId: "550e8400-e29b-41d4-a716-446655440000",
                    naturalName: "Animplex",
                    avatarSmallUrl: userImage,
                  },
                };
                return response;
              }
              case GET_CONTINUE_EPISODE: {
                assertThat(
                  request.body,
                  eqMessage(
                    {
                      seasonId: "season1",
                    },
                    GET_CONTINUE_EPISODE_REQUEST_BODY,
                  ),
                  "GetContinueEpisodeRequest",
                );
                let response: GetContinueEpisodeResponse = {
                  episode: {
                    episodeId: "episode1",
                    name: "Episode 1: The End of the Beginning and the Beginning of the End",
                    index: 1,
                    resolution: "1920x1080",
                    videoDurationSec: 24 * 60,
                    premiereTimeMs: new Date("2024-01-01T00:00:00Z").getTime(),
                  },
                  rewatching: false,
                };
                return response;
              }
              case LIST_EPISODES: {
                let response: ListEpisodesResponse;
                if (request.body.next) {
                  assertThat(
                    request.body,
                    eqMessage(
                      {
                        seasonId: "season1",
                        indexCursor: 0,
                        next: true,
                        limit: 3,
                      },
                      LIST_EPISODES_REQUEST_BODY,
                    ),
                    "ListEpisodesRequest next",
                  );
                  response = {
                    episodes: [
                      {
                        episodeId: "episode1",
                        name: "Episode 1: The End of the Beginning and the Beginning of the End",
                        index: 1,
                        resolution: "1920x1080",
                        videoDurationSec: 24 * 60,
                        premiereTimeMs: new Date(
                          "2024-01-01T00:00:00Z",
                        ).getTime(),
                      },
                      {
                        episodeId: "episode2",
                        name: "Episode 2: The Next Step",
                        index: 2,
                        resolution: "1920x1080",
                        videoDurationSec: 24 * 60,
                        premiereTimeMs: new Date(
                          "2024-01-08T08:00:00Z",
                        ).getTime(),
                      },
                    ],
                  };
                } else {
                  assertThat(
                    request.body,
                    eqMessage(
                      {
                        seasonId: "season1",
                        indexCursor: 1,
                        next: false,
                        limit: 1,
                      },
                      LIST_EPISODES_REQUEST_BODY,
                    ),
                    "ListEpisodesRequest previous",
                  );
                  response = {
                    episodes: [],
                  };
                }
                return response;
              }
              case GET_LATEST_WATCHED_TIME_OF_EPISODE: {
                if (request.body.episodeId === "episode1") {
                  assertThat(
                    request.body,
                    eqMessage(
                      {
                        seasonId: "season1",
                        episodeId: "episode1",
                      },
                      GET_LATEST_WATCHED_TIME_OF_EPISODE_REQUEST_BODY,
                    ),
                    "GetLatestWatchedTimeOfEpisodeRequest 1",
                  );
                } else if (request.body.episodeId === "episode2") {
                  assertThat(
                    request.body,
                    eqMessage(
                      {
                        seasonId: "season1",
                        episodeId: "episode2",
                      },
                      GET_LATEST_WATCHED_TIME_OF_EPISODE_REQUEST_BODY,
                    ),
                    "GetLatestWatchedTimeOfEpisodeRequest 2",
                  );
                } else {
                  throw new Error(
                    `Unexpected episodeId: ${request.body.episodeId}`,
                  );
                }
                let response: GetLatestWatchedTimeOfEpisodeResponse = {};
                return response;
              }
              case CHECK_IN_WATCH_LATER_LIST: {
                assertThat(
                  request.body,
                  eqMessage(
                    {
                      seasonId: "season1",
                    },
                    CHECK_IN_WATCH_LATER_LIST_REQUEST_BODY,
                  ),
                  "CheckInWatchLaterListRequest",
                );
                let response: CheckInWatchLaterListResponse = {
                  isIn: false,
                };
                return response;
              }
              case GET_INDIVIDUAL_SEASON_RATING: {
                assertThat(
                  request.body,
                  eqMessage(
                    {
                      seasonId: "season1",
                    },
                    GET_INDIVIDUAL_SEASON_RATING_REQUEST_BODY,
                  ),
                  "GetIndividualSeasonRatingRequest",
                );
                let response: GetIndividualSeasonRatingResponse = {};
                return response;
              }
              default:
                throw new Error(`Unexpected request.`);
            }
          }
        })();
        this.cut = new SeasonDetailsPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
          "season1",
        );
        let playSeasonId: string;
        let playEpisodeId: string;
        this.cut.on("play", (seasonId, episodeId) => {
          playSeasonId = seasonId;
          playEpisodeId = episodeId;
        });
        let publisherId: string;
        this.cut.on("publisherShowroom", (id) => {
          publisherId = id;
        });

        // Execute
        document.body.append(this.cut.body);
        await Promise.all([
          new Promise<void>((resolve) =>
            this.cut.once("loaded", () => resolve()),
          ),
          waitToGetContinueTime(this.cut, 2),
        ]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./watch_later_page_desktop_1st_time.png"),
          path.join(
            __dirname,
            "./golden/watch_later_page_desktop_1st_time.png",
          ),
          path.join(__dirname, "./watch_later_page_desktop_1st_time_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_desktop_1st_time_scrolled.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_desktop_1st_time_scrolled.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_desktop_1st_time_scrolled_diff.png",
          ),
        );

        // Execute
        await setTabletView();
        window.scrollTo(0, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./watch_later_page_tablet_1st_time.png"),
          path.join(__dirname, "./golden/watch_later_page_tablet_1st_time.png"),
          path.join(__dirname, "./watch_later_page_tablet_1st_time_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_tablet_1st_time_scrolled.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_tablet_1st_time_scrolled.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_tablet_1st_time_scrolled_diff.png",
          ),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./watch_later_page_phone_1st_time.png"),
          path.join(__dirname, "./golden/watch_later_page_phone_1st_time.png"),
          path.join(__dirname, "./watch_later_page_phone_1st_time_diff.png"),
        );

        // Execute
        window.scrollTo(0, 100);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_scrolled.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_scrolled.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_scrolled_diff.png",
          ),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_scrolled_to_bottom.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_scrolled_to_bottom.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_scrolled_to_bottom_diff.png",
          ),
        );

        // Execute
        this.cut.continueEpisodeButton.val.click();

        // Verify
        assertThat(playSeasonId, eq("season1"), "Play continue seasonId");
        assertThat(playEpisodeId, eq("episode1"), "Play continue episodeId");

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(RATE_SEASON), "RateSeason 1");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
                rating: 1,
              },
              RATE_SEASON_REQUEST_BODY,
            ),
            "RateSeasonRequest 1",
          );
          return {};
        };

        // Execute
        this.cut.ratingOneStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_one.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_rating_one.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_one_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(UNRATE_SEASON), "UnrateSeason 1");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
              },
              UNRATE_SEASON_REQUEST_BODY,
            ),
            "UnrateSeasonRequest 1",
          );
          return {};
        };

        // Execute
        this.cut.ratingOneStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_one.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_scrolled_to_bottom.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_one_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(RATE_SEASON), "RateSeason 2");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
                rating: 2,
              },
              RATE_SEASON_REQUEST_BODY,
            ),
            "RateSeasonRequest 2",
          );
          return {};
        };

        // Execute
        this.cut.ratingTwoStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_two.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_rating_two.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_two_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(UNRATE_SEASON), "UnrateSeason 2");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
              },
              UNRATE_SEASON_REQUEST_BODY,
            ),
            "UnrateSeasonRequest 2",
          );
          return {};
        };

        // Execute
        this.cut.ratingTwoStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_two.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_scrolled_to_bottom.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_two_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(RATE_SEASON), "RateSeason 3");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
                rating: 3,
              },
              RATE_SEASON_REQUEST_BODY,
            ),
            "RateSeasonRequest 3",
          );
          return {};
        };

        // Execute
        this.cut.ratingThreeStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_three.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_rating_three.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_three_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(UNRATE_SEASON), "UnrateSeason 3");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
              },
              UNRATE_SEASON_REQUEST_BODY,
            ),
            "UnrateSeasonRequest 3",
          );
          return {};
        };

        // Execute
        this.cut.ratingThreeStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_three.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_scrolled_to_bottom.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_three_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(RATE_SEASON), "RateSeason 4");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
                rating: 4,
              },
              RATE_SEASON_REQUEST_BODY,
            ),
            "RateSeasonRequest 4",
          );
          return {};
        };

        // Execute
        this.cut.ratingFourStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_four.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_rating_four.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_four_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(UNRATE_SEASON), "UnrateSeason 4");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
              },
              UNRATE_SEASON_REQUEST_BODY,
            ),
            "UnrateSeasonRequest 4",
          );
          return {};
        };

        // Execute
        this.cut.ratingFourStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_four.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_scrolled_to_bottom.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_four_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(RATE_SEASON), "RateSeason 5");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
                rating: 5,
              },
              RATE_SEASON_REQUEST_BODY,
            ),
            "RateSeasonRequest 5",
          );
          return {};
        };

        // Execute
        this.cut.ratingFiveStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_five.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_rating_five.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_rating_five_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(UNRATE_SEASON), "UnrateSeason 5");
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
              },
              UNRATE_SEASON_REQUEST_BODY,
            ),
            "UnrateSeasonRequest 5",
          );
          return {};
        };

        // Execute
        this.cut.ratingFiveStarButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("rated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_five.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_scrolled_to_bottom.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_unrating_five_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(
            request.descriptor,
            eq(ADD_TO_WATCH_LATER_LIST),
            "AddToWatchLaterList",
          );
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
              },
              ADD_TO_WATCH_LATER_LIST_REQUEST_BODY,
            ),
            "AddToWatchLaterListRequest",
          );
          return {};
        };

        // Execute
        this.cut.watchLaterButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("watchedLater", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_watch_later.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_watch_later.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_watch_later_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          assertThat(
            request.descriptor,
            eq(DELETE_FROM_WATCH_LATER_LIST),
            "DeleteFromWatchLaterList",
          );
          assertThat(
            request.body,
            eqMessage(
              {
                seasonId: "season1",
              },
              DELETE_FROM_WATCH_LATER_LIST_REQUEST_BODY,
            ),
            "DeleteFromWatchLaterListRequest",
          );
          return {};
        };

        // Execute
        this.cut.removeWatchLaterButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("watchedLater", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_remove_watch_later.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_scrolled_to_bottom.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_remove_watch_later_diff.png",
          ),
        );

        // Execute
        this.cut.shareButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("shareLinkCopied", resolve),
        );

        // Verify
        // TODO: verify link: assertThat(await navigator.clipboard.readText(), eq(), "share link");
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_share_link_copied.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_share_link_copied.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_share_link_copied_diff.png",
          ),
        );

        // Execute
        this.cut.publisherButton.val.click();

        // Verify
        assertThat(
          publisherId,
          eq("550e8400-e29b-41d4-a716-446655440000"),
          "PublisherShowroom",
        );

        // Prepare
        playSeasonId = undefined;
        playEpisodeId = undefined;

        // Execute
        this.cut.showMoreDescriptionButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_show_more_description.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_show_more_description.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_show_more_description_diff.png",
          ),
        );

        // Execute
        this.cut.showLessDescriptionButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_show_less_description.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_phone_1st_time_share_link_copied.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_phone_1st_time_show_less_description_diff.png",
          ),
        );

        // Execute
        this.cut.episodeItems[0].click();

        // Verify
        assertThat(playSeasonId, eq("season1"), "Play seasonId 1");
        assertThat(playEpisodeId, eq("episode1"), "Play episodeId 1");

        // Prepare
        playSeasonId = undefined;
        playEpisodeId = undefined;

        // Execute
        this.cut.episodeItems[1].click();

        // Verify
        assertThat(playSeasonId, eq("season1"), "Play seasonId 2");
        assertThat(playEpisodeId, eq("episode2"), "Play episodeId 2");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "Desktop_Watched3rdEpisodeAndPriceIncreasingIn1Day_LoadPrevEpisodes_LoadNextEpisodes";
      private cut: SeasonDetailsPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case GET_SEASON_DETAILS: {
                let response: GetSeasonDetailsResponse = {
                  seasonDetails: {
                    seasonId: "season1",
                    publisherId: "publisher1",
                    name: "Re-Zero Starting Life in Another World",
                    description:
                      "A thrilling journey through a fantasy world filled with challenges and mysteries.",
                    coverImageUrl: coverImage,
                    averageRating: 0,
                    ratingsCount: 0,
                    grade: 1,
                    nextGrade: {
                      effectiveDate: "2024-02-02",
                      grade: 10,
                    },
                    totalEpisodes: 6,
                  },
                };
                return response;
              }
              case GET_ACCOUNT_SUMMARY: {
                let response: GetAccountSummaryResponse = {
                  account: {
                    accountId: "550e8400-e29b-41d4-a716-446655440000",
                    naturalName: "Crunchyroll",
                    avatarSmallUrl: userImage,
                  },
                };
                return response;
              }
              case GET_CONTINUE_EPISODE: {
                let response: GetContinueEpisodeResponse = {
                  episode: {
                    episodeId: "episode3",
                    name: "Episode 3: A New Challenge Awaits",
                    index: 3,
                    resolution: "1920x1080",
                    videoDurationSec: 2 * 60 * 60 + 20 * 60 + 34,
                    premiereTimeMs: new Date("2024-01-01T00:00:00Z").getTime(),
                  },
                  rewatching: false,
                };
                return response;
              }
              case LIST_EPISODES: {
                let response: ListEpisodesResponse;
                if (request.body.next) {
                  assertThat(
                    request.body,
                    eqMessage(
                      {
                        seasonId: "season1",
                        indexCursor: 2,
                        next: true,
                        limit: 3,
                      },
                      LIST_EPISODES_REQUEST_BODY,
                    ),
                    "ListEpisodesRequest next",
                  );
                  response = {
                    episodes: [
                      {
                        episodeId: "episode3",
                        name: "Episode 3: A New Challenge Awaits",
                        index: 3,
                        resolution: "1920x1080",
                        videoDurationSec: 2 * 60 * 60 + 20 * 60 + 34,
                        premiereTimeMs: new Date(
                          "2024-01-01T00:00:00Z",
                        ).getTime(),
                      },
                      {
                        episodeId: "episode4",
                        name: "Episode 4: The Next Step",
                        index: 4,
                        resolution: "1920x1080",
                        videoDurationSec: 2 * 60 * 60 + 20 * 60 + 24,
                        premiereTimeMs: new Date(
                          "2024-01-08T08:00:00Z",
                        ).getTime(),
                      },
                      {
                        episodeId: "episode5",
                        name: "Episode 5: The Journey Continues",
                        index: 5,
                        resolution: "1920x1080",
                        videoDurationSec: 2 * 60 * 60 + 18 * 60 + 45,
                        premiereTimeMs: new Date(
                          "2024-01-15T08:00:00Z",
                        ).getTime(),
                      },
                    ],
                    indexCursor: 5,
                  };
                } else {
                  assertThat(
                    request.body,
                    eqMessage(
                      {
                        seasonId: "season1",
                        indexCursor: 3,
                        next: false,
                        limit: 1,
                      },
                      LIST_EPISODES_REQUEST_BODY,
                    ),
                    "ListEpisodesRequest previous",
                  );
                  response = {
                    episodes: [
                      {
                        episodeId: "episode2",
                        name: "Episode 2: A New Beginning",
                        index: 2,
                        resolution: "1920x1080",
                        videoDurationSec: 24 * 60,
                        premiereTimeMs: new Date(
                          "2024-01-08T08:00:00Z",
                        ).getTime(),
                      },
                    ],
                    indexCursor: 2,
                  };
                }
                return response;
              }
              case GET_LATEST_WATCHED_TIME_OF_EPISODE: {
                let response: GetLatestWatchedTimeOfEpisodeResponse;
                if (request.body.episodeId === "episode2") {
                  response = {
                    watchedTimeMs: 23 * 60 * 1000,
                  };
                } else if (request.body.episodeId === "episode3") {
                  response = {
                    watchedTimeMs: 2 * 60 * 60 * 1000,
                  };
                } else if (
                  request.body.episodeId === "episode4" ||
                  request.body.episodeId === "episode5"
                ) {
                  response = {};
                } else {
                  throw new Error(
                    `Unexpected episodeId: ${request.body.episodeId}`,
                  );
                }
                return response;
              }
              case CHECK_IN_WATCH_LATER_LIST: {
                let response: CheckInWatchLaterListResponse = {
                  isIn: true,
                };
                return response;
              }
              case GET_INDIVIDUAL_SEASON_RATING: {
                let response: GetIndividualSeasonRatingResponse = {
                  rating: 3,
                };
                return response;
              }
              default:
                throw new Error(`Unexpected request.`);
            }
          }
        })();
        this.cut = new SeasonDetailsPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
          "season1",
        );

        // Execute
        document.body.append(this.cut.body);
        await Promise.all([
          new Promise<void>((resolve) =>
            this.cut.once("loaded", () => resolve()),
          ),
          waitToGetContinueTime(this.cut, 4),
        ]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./watch_later_page_desktop_watched_3rd.png"),
          path.join(
            __dirname,
            "./golden/watch_later_page_desktop_watched_3rd.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_3rd_diff.png",
          ),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_3rd_scrolled.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_desktop_watched_3rd_scrolled.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_3rd_scrolled_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          switch (request.descriptor) {
            case LIST_EPISODES: {
              assertThat(
                request.body,
                eqMessage(
                  {
                    seasonId: "season1",
                    next: false,
                    indexCursor: 2,
                    limit: 10,
                  },
                  LIST_EPISODES_REQUEST_BODY,
                ),
                "list prev episodes",
              );
              let response: ListEpisodesResponse = {
                episodes: [
                  {
                    episodeId: "episode1",
                    name: "Episode 1: The Beginning",
                    index: 1,
                    resolution: "1920x1080",
                    videoDurationSec: 2 * 60 * 60 + 34,
                    premiereTimeMs: new Date("2024-01-01T00:00:00Z").getTime(),
                  },
                ],
              };
              return response;
            }
            case GET_LATEST_WATCHED_TIME_OF_EPISODE: {
              let response: GetLatestWatchedTimeOfEpisodeResponse;
              if (request.body.episodeId === "episode1") {
                response = {
                  watchedTimeMs: 2 * 60 * 60 * 1000,
                };
              } else {
                throw new Error(
                  `Unexpected episodeId: ${request.body.episodeId}`,
                );
              }
              return response;
            }
            default:
              throw new Error(`Unexpected request.`);
          }
        };

        // Execute
        this.cut.loadMorePrevEpisodesButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.on("prevEpisodesLoaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_3rd_prev_loaded.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_desktop_watched_3rd_prev_loaded.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_3rd_prev_loaded_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.send = async (request) => {
          switch (request.descriptor) {
            case LIST_EPISODES: {
              assertThat(
                request.body,
                eqMessage(
                  {
                    seasonId: "season1",
                    next: true,
                    indexCursor: 5,
                    limit: 10,
                  },
                  LIST_EPISODES_REQUEST_BODY,
                ),
                "list next episodes",
              );
              let response: ListEpisodesResponse = {
                episodes: [
                  {
                    episodeId: "episode6",
                    name: "Episode 6: The Final Countdown",
                    index: 6,
                    resolution: "1920x1080",
                    videoDurationSec: 2 * 60 * 60 + 15 * 60 + 10,
                    premiereTimeMs: new Date("2024-02-10T10:00:00Z").getTime(),
                  },
                ],
              };
              return response;
            }
            default:
              throw new Error(`Unexpected request.`);
          }
        };

        // Execute
        this.cut.loadMoreNextEpisodesButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.on("nextEpisodesLoaded", () => resolve()),
        );
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_3rd_next_loaded.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_desktop_watched_3rd_next_loaded.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_3rd_next_loaded_diff.png",
          ),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Desktop_WatchedTheLastEpisodeAndPriceIncreasingIn10Days";
      private cut: SeasonDetailsPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case GET_SEASON_DETAILS: {
                let response: GetSeasonDetailsResponse = {
                  seasonDetails: {
                    seasonId: "season1",
                    publisherId: "publisher1",
                    name: "Re-Zero Starting Life in Another World The Movie",
                    description:
                      "A thrilling journey through a fantasy world filled with challenges and mysteries.",
                    coverImageUrl: coverImage,
                    averageRating: 4.88,
                    ratingsCount: 8,
                    grade: 600,
                    nextGrade: {
                      effectiveDate: "2024-02-11",
                      grade: 770,
                    },
                    totalEpisodes: 10,
                  },
                };
                return response;
              }
              case GET_ACCOUNT_SUMMARY: {
                let response: GetAccountSummaryResponse = {
                  account: {
                    accountId: "550e8400-e29b-41d4-a716-446655440000",
                    naturalName: "Crunchyroll",
                    avatarSmallUrl: userImage,
                  },
                };
                return response;
              }
              case GET_CONTINUE_EPISODE: {
                let response: GetContinueEpisodeResponse = {
                  episode: {
                    episodeId: "episode1",
                    name: "Episode 1: The Beginning of the Journey",
                    index: 1,
                    resolution: "1920x1080",
                    videoDurationSec: 2 * 60 * 60 + 20 * 60 + 34,
                    premiereTimeMs: new Date("2024-01-01T00:00:00Z").getTime(),
                  },
                  rewatching: true,
                };
                return response;
              }
              case LIST_EPISODES: {
                let response: ListEpisodesResponse;
                if (request.body.next) {
                  response = {
                    episodes: [
                      {
                        episodeId: "episode1",
                        name: "Episode 1: The Beginning of the Journey",
                        index: 1,
                        resolution: "1920x1080",
                        videoDurationSec: 2 * 60 * 60 + 20 * 60 + 34,
                        premiereTimeMs: new Date(
                          "2024-01-01T00:00:00Z",
                        ).getTime(),
                      },
                    ],
                  };
                } else {
                  response = {
                    episodes: [],
                  };
                }
                return response;
              }
              case GET_LATEST_WATCHED_TIME_OF_EPISODE: {
                let response: GetLatestWatchedTimeOfEpisodeResponse;
                if (request.body.episodeId === "episode1") {
                  response = {
                    watchedTimeMs: 2 * 60 * 60 * 1000,
                  };
                } else {
                  throw new Error(
                    `Unexpected episodeId: ${request.body.episodeId}`,
                  );
                }
                return response;
              }
              case CHECK_IN_WATCH_LATER_LIST: {
                let response: CheckInWatchLaterListResponse = {
                  isIn: false,
                };
                return response;
              }
              case GET_INDIVIDUAL_SEASON_RATING: {
                let response: GetIndividualSeasonRatingResponse = {};
                return response;
              }
              default:
                throw new Error(`Unexpected request.`);
            }
          }
        })();
        this.cut = new SeasonDetailsPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
          "season1",
        );

        // Execute
        document.body.append(this.cut.body);
        await Promise.all([
          new Promise<void>((resolve) =>
            this.cut.once("loaded", () => resolve()),
          ),
          waitToGetContinueTime(this.cut, 1),
        ]);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_last_episode.png",
          ),
          path.join(
            __dirname,
            "./golden/watch_later_page_desktop_watched_last_episode.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_desktop_watched_last_episode_diff.png",
          ),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Desktop_WaitingForTheOnlyEpisodeToPremiere";
      private cut: SeasonDetailsPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case GET_SEASON_DETAILS: {
                let response: GetSeasonDetailsResponse = {
                  seasonDetails: {
                    seasonId: "season1",
                    publisherId: "publisher1",
                    name: "Re-Zero Starting Life in Another World The Movie",
                    description:
                      "A thrilling journey through a fantasy world filled with challenges and mysteries.",
                    coverImageUrl: coverImage,
                    averageRating: 4.88,
                    ratingsCount: 8,
                    grade: 100,
                    totalEpisodes: 10,
                  },
                };
                return response;
              }
              case GET_ACCOUNT_SUMMARY: {
                let response: GetAccountSummaryResponse = {
                  account: {
                    accountId: "550e8400-e29b-41d4-a716-446655440000",
                    naturalName: "Crunchyroll",
                    avatarSmallUrl: userImage,
                  },
                };
                return response;
              }
              case GET_CONTINUE_EPISODE: {
                let response: GetContinueEpisodeResponse = {
                  episode: {
                    episodeId: "episode1",
                    name: "Episode 1: The Beginning of the Journey",
                    index: 1,
                    resolution: "1920x1080",
                    videoDurationSec: 2 * 60 * 60 + 20 * 60 + 34,
                    premiereTimeMs: new Date("2024-02-10T00:00:00Z").getTime(),
                  },
                  rewatching: true,
                };
                return response;
              }
              case LIST_EPISODES: {
                let response: ListEpisodesResponse;
                if (request.body.next) {
                  response = {
                    episodes: [
                      {
                        episodeId: "episode1",
                        name: "Episode 1: The Beginning of the Journey",
                        index: 1,
                        resolution: "1920x1080",
                        videoDurationSec: 2 * 60 * 60 + 20 * 60 + 34,
                        premiereTimeMs: new Date(
                          "2024-02-10T00:00:00Z",
                        ).getTime(),
                      },
                    ],
                  };
                } else {
                  response = {
                    episodes: [],
                  };
                }
                return response;
              }
              case GET_LATEST_WATCHED_TIME_OF_EPISODE: {
                let response: GetLatestWatchedTimeOfEpisodeResponse;
                if (request.body.episodeId === "episode1") {
                  response = {};
                } else {
                  throw new Error(
                    `Unexpected episodeId: ${request.body.episodeId}`,
                  );
                }
                return response;
              }
              case CHECK_IN_WATCH_LATER_LIST: {
                let response: CheckInWatchLaterListResponse = {
                  isIn: false,
                };
                return response;
              }
              case GET_INDIVIDUAL_SEASON_RATING: {
                let response: GetIndividualSeasonRatingResponse = {};
                return response;
              }
              default:
                throw new Error(`Unexpected request.`);
            }
          }
        })();
        this.cut = new SeasonDetailsPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
          "season1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./watch_later_page_desktop_not_premiered.png"),
          path.join(
            __dirname,
            "./golden/watch_later_page_desktop_not_premiered.png",
          ),
          path.join(
            __dirname,
            "./watch_later_page_desktop_not_premiered_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
