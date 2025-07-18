import coverImage = require("../common/test_data/cover_tall.jpg");
import userImage = require("../common/test_data/user_image.jpg");
import userImage2 = require("../common/test_data/user_image2.png");
import videoUrl = require("./common/test_data/two_audios_two_subs.m3u8");
import { PlayPage } from "./body";
import { CommentsPanel } from "./comments_panel/body";
import { DanmakuOverlayMock } from "./danmaku_overlay/body_mock";
import { InfoPanel } from "./info_panel/body";
import { Player } from "./player/body";
import { SettingsPanel } from "./settings_panel/body";
import { SideCommentOverlay } from "./side_comment_overlay/body";
import { WatchSessionTracker } from "./watch_session_tracker";
import { WatchTimeMeter } from "./watch_time_meter";
import {
  LIST_COMMENTS,
  ListCommentsResponse,
} from "@phading/comment_service_interface/show/web/reader/interface";
import {
  RECORD_WATCH_TIME,
  RecordWatchTimeResponse,
} from "@phading/meter_service_interface/show/web/consumer/interface";
import {
  GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE,
  GetLatestWatchedVideoTimeOfEpisodeResponse,
  WATCH_EPISODE,
  WatchEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  AUTHORIZE_EPISODE_PLAYBACK,
  AuthorizeEpisodePlaybackResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import {
  GET_EPISODE_WITH_SEASON_SUMMARY,
  GetEpisodeWithSeasonSummaryResponse,
  LIST_EPISODES,
  ListEpisodesResponse,
} from "@phading/product_service_interface/show/web/public/interface";
import {
  GET_VIDEO_PLAYER_SETTINGS,
  GetVideoPlayerSettingsResponse,
} from "@phading/user_service_interface/web/self/interface";
import {
  GET_ACCOUNT_SUMMARY,
  GetAccountSummaryResponse,
} from "@phading/user_service_interface/web/third_person/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

let EPISODE_WITH_SEASON_SUMMARY_RESPONSE: GetEpisodeWithSeasonSummaryResponse =
  {
    summary: {
      season: {
        seasonId: "season1",
        name: "Re-Zero -Starting Life in Another World Season 1",
        coverImageUrl: coverImage,
        grade: 899,
        totalEpisodes: 25,
      },
      episode: {
        episodeId: "episode1",
        name: "Episode 1",
        index: 1,
        premiereTimeMs: new Date("2024-01-01T08:00:00Z").getTime(),
        canPlay: true,
      },
    },
  };

class PlayPageServiceClientMock extends WebServiceClientMock {
  public async send(request: ClientRequestInterface<any>): Promise<any> {
    switch (request.descriptor) {
      case GET_EPISODE_WITH_SEASON_SUMMARY: {
        return EPISODE_WITH_SEASON_SUMMARY_RESPONSE;
      }
      case LIST_EPISODES: {
        let response: ListEpisodesResponse = {
          episodes: [],
        };
        return response;
      }
      case GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE: {
        let response: GetLatestWatchedVideoTimeOfEpisodeResponse = {};
        return response;
      }
      case AUTHORIZE_EPISODE_PLAYBACK: {
        let response: AuthorizeEpisodePlaybackResponse = {
          videoUrl,
        };
        return response;
      }
      case GET_VIDEO_PLAYER_SETTINGS: {
        let response: GetVideoPlayerSettingsResponse = {
          settings: {},
        };
        return response;
      }
      case RECORD_WATCH_TIME: {
        let response: RecordWatchTimeResponse = {};
        return response;
      }
      case WATCH_EPISODE: {
        let response: WatchEpisodeResponse = {
          watchSessionId: "watchSession1",
        };
        return response;
      }
      case LIST_COMMENTS: {
        let response: ListCommentsResponse = {
          comments: [],
        };
        return response;
      }
      case GET_ACCOUNT_SUMMARY: {
        let response: GetAccountSummaryResponse;
        switch (request.body.accountId) {
          case "author1":
            response = {
              account: {
                accountId: "author1",
                naturalName: "Author 1",
                avatarSmallUrl: userImage,
              },
            };
            break;
          case "author2":
            response = {
              account: {
                accountId: "author2",
                naturalName: "Author 2",
                avatarSmallUrl: userImage2,
              },
            };
            break;
          case "author3":
            response = {
              account: {
                accountId: "author3",
                naturalName: "Author 3",
                avatarSmallUrl: userImage,
              },
            };
            break;
        }
        return response;
      }
      default:
        throw new Error(`Unknown request ${request.descriptor.name}`);
    }
  }
}

export class PlayPageMock extends PlayPage {
  public constructor(
    getNowDate: () => Date,
    seasonId: string,
    episodeId: string,
  ) {
    super(
      window,
      new PlayPageServiceClientMock(),
      (settings, videoUrl, continueTimestampMs, nextEpisodeId) =>
        new Player(
          window,
          settings,
          videoUrl,
          continueTimestampMs,
          nextEpisodeId,
          false,
        ),
      (
        customeStyle,
        episode,
        seasonSummary,
        nextEpisode,
        nextEpisodeWatchedTimeMs,
      ) =>
        new InfoPanel(
          getNowDate,
          customeStyle,
          episode,
          seasonSummary,
          nextEpisode,
          nextEpisodeWatchedTimeMs,
        ),
      (customeStyle, seasonId, episodeId) =>
        new CommentsPanel(
          new PlayPageServiceClientMock(),
          customeStyle,
          seasonId,
          episodeId,
        ),
      (customeStyle, settings) => new SettingsPanel(customeStyle, settings),
      (settings) => new SideCommentOverlay(settings),
      (settings) => new DanmakuOverlayMock(0, settings),
      (seasonId, episodeId) =>
        new WatchSessionTracker(
          new PlayPageServiceClientMock(),
          () => getNowDate().valueOf(),
          seasonId,
          episodeId,
        ),
      (seasonId, episodeId) =>
        new WatchTimeMeter(
          window,
          new PlayPageServiceClientMock(),
          () => getNowDate().valueOf(),
          seasonId,
          episodeId,
        ),
      seasonId,
      episodeId,
    );
  }
}
