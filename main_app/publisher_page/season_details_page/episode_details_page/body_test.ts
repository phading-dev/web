import "../../../../dev/env";
import video = require("./common/test_data/two_audios_two_subs.m3u8");
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { EpisodeDetailsPage } from "./body";
import { InfoPage } from "./info_page/body";
import { PublishPage } from "./publish_page/body";
import { PublishedPage } from "./published_page/body";
import { UpdateIndexPage } from "./update_index_page/body";
import { UpdateInfoPage } from "./update_info_page/body";
import { UpdateTracksPage } from "./update_tracks_page/body";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { GetEpisodeResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

function createEpisodeDetailsPage(
  nowDate: Date,
  serviceClientMock: WebServiceClientMock,
): EpisodeDetailsPage {
  return new EpisodeDetailsPage(
    (seasonId, episodeId) =>
      new InfoPage(serviceClientMock, () => nowDate, seasonId, episodeId),
    (seasonId, episodeId) =>
      new PublishPage(
        serviceClientMock,
        () => nowDate.getTime(),
        seasonId,
        episodeId,
      ),
    (seasonId, episodeId, episode) =>
      new PublishedPage(
        serviceClientMock,
        () => nowDate.getTime(),
        seasonId,
        episodeId,
        episode,
      ),
    (seasonId, episodeId, episode) =>
      new UpdateIndexPage(serviceClientMock, seasonId, episodeId, episode),
    (seasonId, episodeId, episode) =>
      new UpdateInfoPage(serviceClientMock, seasonId, episodeId, episode),
    (seasonId, episodeId, videoContainer) =>
      new UpdateTracksPage(
        serviceClientMock,
        seasonId,
        episodeId,
        videoContainer,
      ),
    (body) => document.body.append(body),
    "season1",
    "episode1",
  );
}

TEST_RUNNER.run({
  name: "EpisodeDetailsPageTest",
  cases: [
    new (class implements TestCase {
      public name = "DraftEpisode";
      private cut: EpisodeDetailsPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainerCached: {
              version: 1,
            },
            videoUrl: video,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 1,
                },
              },
              videos: [
                {
                  durationSec: 3600,
                  resolution: "1920x1080",
                  totalBytes: 1234500,
                  committed: true,
                },
              ],
              audios: [
                {
                  totalBytes: 2234500,
                  committed: {
                    name: "English",
                    isDefault: true,
                  },
                },
              ],
              subtitles: [
                {
                  totalBytes: 3234500,
                  committed: {
                    name: "English",
                  },
                },
              ],
            },
          },
        };
        serviceClientMock.response = response;

        // Execute
        let nowDate = new Date("2023-01-10");
        this.cut = createEpisodeDetailsPage(nowDate, serviceClientMock);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_tablet_draft.png"),
          path.join(__dirname, "/golden/episode_details_page_tablet_draft.png"),
          path.join(__dirname, "/episode_details_page_tablet_draft_diff.png"),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 300,
                y: 640,
                width: 90,
                height: 90,
              },
            ],
          },
        );

        // Execute
        this.cut.infoPage.episodeNameButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_tablet_update_name.png"),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_update_name.png",
          ),
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_name_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.updateInfoPage.inputFormPage.backButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_name_back.png",
          ),
          path.join(__dirname, "/golden/episode_details_page_tablet_draft.png"),
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_name_back_diff.png",
          ),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 300,
                y: 640,
                width: 90,
                height: 90,
              },
            ],
          },
        );

        // Execute
        this.cut.infoPage.episodeDraftStateButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_tablet_publish_page.png"),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_publish_page.png",
          ),
          path.join(
            __dirname,
            "/episode_details_page_tablet_publish_page_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.publishPage.inputFormPage.backButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episode_details_page_tablet_publish_page_back.png",
          ),
          path.join(__dirname, "/golden/episode_details_page_tablet_draft.png"),
          path.join(
            __dirname,
            "/episode_details_page_tablet_publish_page_back_diff.png",
          ),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 300,
                y: 640,
                width: 90,
                height: 90,
              },
            ],
          },
        );

        // Execute
        this.cut.infoPage.episodeUploadButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_tablet_upload.png"),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_upload.png",
          ),
          path.join(__dirname, "/episode_details_page_tablet_upload_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.uploadPage.newUploadPage.backButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_tablet_upload_back.png"),
          path.join(__dirname, "/golden/episode_details_page_tablet_draft.png"),
          path.join(
            __dirname,
            "/episode_details_page_tablet_upload_back_diff.png",
          ),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 300,
                y: 640,
                width: 90,
                height: 90,
              },
            ],
          },
        );

        // Execute
        this.cut.infoPage.editTracksButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_tracks.png",
          ),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_update_tracks.png",
          ),
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_tracks_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.updateTracksPage.backButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_tracks_back.png",
          ),
          path.join(__dirname, "/golden/episode_details_page_tablet_draft.png"),
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_tracks_back_diff.png",
          ),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 300,
                y: 640,
                width: 90,
                height: 90,
              },
            ],
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PublishedEpisode";
      private cut: EpisodeDetailsPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.PUBLISHED,
            premiereTimeMs: new Date("2023-10-02T00:00:00Z").getTime(),
            episodeIndex: 1,
            totalPublishedEpisodes: 12,
            videoContainerCached: {
              version: 1,
            },
            videoUrl: video,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 1,
                },
              },
              videos: [
                {
                  durationSec: 3600,
                  resolution: "1920x1080",
                  totalBytes: 12345,
                  committed: true,
                },
              ],
              audios: [
                {
                  totalBytes: 22345,
                  committed: {
                    name: "English",
                    isDefault: true,
                  },
                },
              ],
              subtitles: [
                {
                  totalBytes: 32345,
                  committed: {
                    name: "English",
                  },
                },
              ],
            },
          },
        };
        serviceClientMock.response = response;

        // Execute
        let nowDate = new Date("2023-10-01");
        this.cut = createEpisodeDetailsPage(nowDate, serviceClientMock);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_tablet_published.png"),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_published.png",
          ),
          path.join(
            __dirname,
            "/episode_details_page_tablet_published_diff.png",
          ),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 310,
                y: 750,
                width: 90,
                height: 90,
              },
            ],
          },
        );

        // Execute
        this.cut.infoPage.episodeIndexButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_tablet_update_index.png"),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_update_index.png",
          ),
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_index_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.updateIndexPage.inputFormPage.backButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_index_back.png",
          ),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_published.png",
          ),
          path.join(
            __dirname,
            "/episode_details_page_tablet_update_index_back_diff.png",
          ),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 310,
                y: 750,
                width: 90,
                height: 90,
              },
            ],
          },
        );

        // Execute
        this.cut.infoPage.episodePublishedStateButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episode_details_page_tablet_published_page.png",
          ),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_published_page.png",
          ),
          path.join(
            __dirname,
            "/episode_details_page_tablet_published_page_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.publishedPage.inputFormPage.backButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episode_details_page_tablet_published_page_back.png",
          ),
          path.join(
            __dirname,
            "/golden/episode_details_page_tablet_published.png",
          ),
          path.join(
            __dirname,
            "/episode_details_page_tablet_published_page_back_diff.png",
          ),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 310,
                y: 750,
                width: 90,
                height: 90,
              },
            ],
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
