import "../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { EpisodeDetailsPage } from "./body";
import { DraftPage } from "./draft_page/body";
import { InfoPageMock } from "./info_page/body_mock";
import { PublishedPage } from "./published_page/body";
import { UpdateIndexPage } from "./update_index_page/body";
import { UpdateInfoPage } from "./update_info_page/body";
import { UpdateTracksPage } from "./update_tracks_page/body";
import { UploadPageMock } from "./upload_page/body_mock";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

function createEpisodeDetailsPage(nowDate: Date): EpisodeDetailsPage {
  return new EpisodeDetailsPage(
    (seasonId, episodeId, episode) =>
      new DraftPage(
        undefined,
        () => nowDate.getTime(),
        seasonId,
        episodeId,
        episode,
      ),
    (seasonId, episodeId) =>
      new InfoPageMock(() => nowDate, seasonId, episodeId),
    (seasonId, episodeId, episode) =>
      new PublishedPage(
        undefined,
        () => nowDate.getTime(),
        seasonId,
        episodeId,
        episode,
      ),
    (seasonId, episodeId, episode) =>
      new UpdateIndexPage(undefined, seasonId, episodeId, episode),
    (seasonId, episodeId, episode) =>
      new UpdateInfoPage(undefined, seasonId, episodeId, episode),
    (seasonId, episodeId, videoContainer) =>
      new UpdateTracksPage(undefined, seasonId, episodeId, videoContainer),
    (appendBody, seasonId, episodeId, uploadingState) =>
      new UploadPageMock(
        () => nowDate,
        appendBody,
        seasonId,
        episodeId,
        uploadingState,
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
      public name = "NavigationDraftEpisode";
      private cut: EpisodeDetailsPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let episode: EpisodeDetails = {
          seasonName: "Re-Zero: Starting Life in Another World",
          episodeName: "The End of the Beginning and the Beginning of the End",
          state: EpisodeState.DRAFT,
          videoContainer: {
            masterPlaylist: {
              synced: {
                version: 1,
              },
            },
            processing: {
              uploading: {
                fileExt: "mp4",
              },
            },
            videos: [],
            audios: [],
            subtitles: [],
          },
        };
        let nowDate = new Date("2023-10-10");

        // Execute
        this.cut = createEpisodeDetailsPage(nowDate);

        // Verify
        assertThat(
          this.cut.infoPage.seasonId,
          eq("season1"),
          "infoPage.seasonId",
        );
        assertThat(
          this.cut.infoPage.episodeId,
          eq("episode1"),
          "infoPage.episodeId",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page.png"),
          path.join(__dirname, "/golden/episode_details_page.png"),
          path.join(__dirname, "/episode_details_page_diff.png"),
        );

        // Execute
        this.cut.infoPage.emit("editName", episode);

        // Verify
        assertThat(
          this.cut.updateInfoPage.seasonId,
          eq("season1"),
          "updateInfoPage.seasonId",
        );
        assertThat(
          this.cut.updateInfoPage.episodeId,
          eq("episode1"),
          "updateInfoPage.episodeId",
        );
        assertThat(
          this.cut.updateInfoPage.episode.episodeName,
          eq(episode.episodeName),
          "updateInfoPage.episode.episodeName",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_update_name.png"),
          path.join(__dirname, "/golden/episode_details_page_update_name.png"),
          path.join(__dirname, "/episode_details_page_update_name_diff.png"),
        );

        // Execute
        this.cut.updateInfoPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_update_name_back.png"),
          path.join(__dirname, "/golden/episode_details_page.png"),
          path.join(
            __dirname,
            "/episode_details_page_update_name_back_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("editDraftState", episode);

        // Verify
        assertThat(
          this.cut.draftPage.seasonId,
          eq("season1"),
          "draftPage.seasonId",
        );
        assertThat(
          this.cut.draftPage.episodeId,
          eq("episode1"),
          "draftPage.episodeId",
        );
        assertThat(
          this.cut.draftPage.episode.episodeName,
          eq(episode.episodeName),
          "draftPage.episode.episodeName",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_draft.png"),
          path.join(__dirname, "/golden/episode_details_page_draft.png"),
          path.join(__dirname, "/episode_details_page_draft_diff.png"),
        );

        // Prepare
        let viewSeasonId: string;
        this.cut.on("viewSeason", (seasonId) => (viewSeasonId = seasonId));

        // Execute
        this.cut.draftPage.emit("delete");

        // Verify
        assertThat(viewSeasonId, eq("season1"), "viewSeasonId after delete");

        // Execute
        this.cut.draftPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_draft_back.png"),
          path.join(__dirname, "/golden/episode_details_page.png"),
          path.join(__dirname, "/episode_details_page_draft_back_diff.png"),
        );

        // Execute
        this.cut.infoPage.emit("upload", episode);

        // Verify
        assertThat(
          this.cut.uploadPage.seasonId,
          eq("season1"),
          "uploadPage.seasonId",
        );
        assertThat(
          this.cut.uploadPage.episodeId,
          eq("episode1"),
          "uploadPage.episodeId",
        );
        assertThat(
          this.cut.uploadPage.uploadingState.fileExt,
          eq("mp4"),
          "uploadPage.uploadingState.fileExt",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_upload.png"),
          path.join(__dirname, "/golden/episode_details_page_upload.png"),
          path.join(__dirname, "/episode_details_page_upload_diff.png"),
        );

        // Execute
        this.cut.uploadPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_upload_back.png"),
          path.join(__dirname, "/golden/episode_details_page.png"),
          path.join(__dirname, "/episode_details_page_upload_back_diff.png"),
        );

        // Execute
        this.cut.infoPage.emit("editTracks", episode);

        // Verify
        assertThat(
          this.cut.updateTracksPage.seasonId,
          eq("season1"),
          "updateTracksPage.seasonId",
        );
        assertThat(
          this.cut.updateTracksPage.episodeId,
          eq("episode1"),
          "updateTracksPage.episodeId",
        );
        assertThat(
          this.cut.updateTracksPage.videoContainer.masterPlaylist.synced
            .version,
          eq(1),
          "updateTracksPage.videoContainer.masterPlaylist.synced.version",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_update_tracks.png"),
          path.join(
            __dirname,
            "/golden/episode_details_page_update_tracks.png",
          ),
          path.join(__dirname, "/episode_details_page_update_tracks_diff.png"),
        );

        // Execute
        this.cut.updateTracksPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_update_tracks_back.png"),
          path.join(__dirname, "/golden/episode_details_page.png"),
          path.join(
            __dirname,
            "/episode_details_page_update_tracks_back_diff.png",
          ),
        );

        // Prepare
        viewSeasonId = undefined;

        // Execute
        this.cut.infoPage.emit("back");

        // Verify
        assertThat(viewSeasonId, eq("season1"), "viewSeasonId after back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NavigationPublishedEpisode";
      private cut: EpisodeDetailsPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let episode: EpisodeDetails = {
          seasonName: "Re-Zero: Starting Life in Another World",
          episodeName: "The End of the Beginning and the Beginning of the End",
          state: EpisodeState.PUBLISHED,
          premiereTimeMs: new Date("2023-10-02T00:00:00Z").getTime(),
          episodeIndex: 1,
          totalPublishedEpisodes: 12,
          videoContainerCached: {
            version: 1,
          },
          videoContainer: {
            masterPlaylist: {
              synced: {
                version: 1,
              },
            },
            videos: [],
            audios: [],
            subtitles: [],
          },
        };
        let nowDate = new Date("2023-10-10");
        this.cut = createEpisodeDetailsPage(nowDate);

        // Execute
        this.cut.infoPage.emit("editIndex", episode);

        // Verify
        assertThat(
          this.cut.updateIndexPage.seasonId,
          eq("season1"),
          "updateIndexPage.seasonId",
        );
        assertThat(
          this.cut.updateIndexPage.episodeId,
          eq("episode1"),
          "updateIndexPage.episodeId",
        );
        assertThat(
          this.cut.updateIndexPage.episode.episodeName,
          eq(episode.episodeName),
          "updateIndexPage.episode.episodeName",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_update_index.png"),
          path.join(__dirname, "/golden/episode_details_page_update_index.png"),
          path.join(__dirname, "/episode_details_page_update_index_diff.png"),
        );

        // Execute
        this.cut.updateIndexPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_update_index_back.png"),
          path.join(__dirname, "/golden/episode_details_page.png"),
          path.join(
            __dirname,
            "/episode_details_page_update_index_back_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("editPublishedState", episode);

        // Verify
        assertThat(
          this.cut.publishedPage.seasonId,
          eq("season1"),
          "publishedPage.seasonId",
        );
        assertThat(
          this.cut.publishedPage.episodeId,
          eq("episode1"),
          "publishedPage.episodeId",
        );
        assertThat(
          this.cut.publishedPage.episode.episodeName,
          eq(episode.episodeName),
          "publishedPage.episode.episodeName",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_published_page.png"),
          path.join(
            __dirname,
            "/golden/episode_details_page_published_page.png",
          ),
          path.join(__dirname, "/episode_details_page_published_page_diff.png"),
        );

        // Execute
        this.cut.publishedPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/episode_details_page_published_page_back.png"),
          path.join(__dirname, "/golden/episode_details_page.png"),
          path.join(
            __dirname,
            "/episode_details_page_published_page_back_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
