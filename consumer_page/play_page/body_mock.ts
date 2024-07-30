import coverImage = require("./test_data/cover.jpg");
import mov1 = require("./test_data/mov1.mp4");
import mov2 = require("./test_data/mov2.webm");
import userImage = require("./test_data/user_image.jpg");
import { PlayPage } from "./body";
import { CommentsCardMock } from "./comments_card/body_mock";
import { CommentsPoolMock } from "./comments_pool_mock";
import { InfoCardMock } from "./info_card/body_mock";
import { MeterMock } from "./meter_mock";
import { PlayerMock } from "./player/body_mock";
import { SettingsCardMock } from "./settings_card/body_mock";
import { ViewSessionTrackerMock } from "./view_session_tracker_mock";
import {
  GET_EPISODE_TO_PLAY,
  GET_PLAYER_SETTINGS,
  GetEpisodeToPlayResponse,
} from "@phading/product_service_interface/consumer/frontend/show/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class PlayPageMock extends PlayPage {
  public constructor(episodeId: string, videoIndex: number) {
    super(
      undefined,
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          if (request.descriptor === GET_EPISODE_TO_PLAY) {
            return {
              episode: {
                season: {
                  seasonId: "season1",
                  name: "This is a title",
                  description: "Some kind of description",
                  coverImagePath: coverImage,
                  grade: 1,
                },
                publisher: {
                  accountId: "accountId1",
                  naturalName: "Publisher name",
                  avatarSmallPath: userImage,
                },
                episode: {
                  episodeId: episodeId,
                  videoPath: videoIndex === 1 ? mov1 : mov2,
                },
                episodes: [
                  {
                    episodeId: episodeId,
                    length: 120,
                    name: `Episode 1`,
                    publishedTime: 1719033940,
                  },
                ],
              },
            } as GetEpisodeToPlayResponse;
          }
          if (request.descriptor === GET_PLAYER_SETTINGS) {
            return {};
          }
        }
      })(),
      (seasonId) => new MeterMock(seasonId),
      (episodeId) => new ViewSessionTrackerMock(episodeId),
      (playerSettings, espisode) => new PlayerMock(playerSettings, espisode),
      (seasonId) => new CommentsCardMock(seasonId),
      (episode) => new InfoCardMock(episode),
      (playerSettings) => new SettingsCardMock(playerSettings),
      (episodeId) => new CommentsPoolMock(episodeId, []),
      episodeId,
    );
  }
}
