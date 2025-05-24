import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { CommitPage } from "./body";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import {
  COMMIT_EPISODE_STAGING_DATA,
  COMMIT_EPISODE_STAGING_DATA_REQUEST_BODY,
  CommitEpisodeStagingDataResponse,
  ValidationError,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

class PublishedCommitTestCase implements TestCase {
  private cut: CommitPage;
  public constructor(
    public name: string,
    private error: ValidationError | undefined,
    private screenshotPath: string,
    private goldenPath: string,
    private diffPath: string,
  ) {}
  public async execute() {
    // Prepare
    await setTabletView();
    let serviceClientMock = new WebServiceClientMock();
    this.cut = new CommitPage(serviceClientMock, "season1", "episode1", {
      state: EpisodeState.PUBLISHED,
      videoContainer: {
        masterPlaylist: {
          syncing: { version: 1 },
        },
      },
    });
    let response: CommitEpisodeStagingDataResponse = {
      success: !this.error,
      error: this.error,
    };
    serviceClientMock.response = response;

    // Execute
    document.body.append(this.cut.body);
    this.cut.inputFormPage.clickPrimaryButton();
    await new Promise<void>((resolve) =>
      this.cut.inputFormPage.once("primaryDone", resolve),
    );

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.goldenPath,
      this.diffPath,
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "EpisodeDetailsCommitPageTest",
  cases: [
    new (class implements TestCase {
      public name = "TabletView_Published_CommitSuccess";
      private cut: CommitPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new CommitPage(serviceClientMock, "season1", "episode1", {
          state: EpisodeState.PUBLISHED,
          videoContainer: {
            masterPlaylist: {
              synced: { version: 1 },
            },
          },
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/commit_page_tablet_published.png"),
          path.join(__dirname, "/golden/commit_page_tablet_published.png"),
          path.join(__dirname, "/commit_page_tablet_published_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(COMMIT_EPISODE_STAGING_DATA),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
            },
            COMMIT_EPISODE_STAGING_DATA_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/commit_page_tablet_published_error.png"),
          path.join(
            __dirname,
            "/golden/commit_page_tablet_published_error.png",
          ),
          path.join(__dirname, "/commit_page_tablet_published_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let response: CommitEpisodeStagingDataResponse = {
          success: true,
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/commit_page_tablet_published_done.png"),
          path.join(__dirname, "/golden/commit_page_tablet_published.png"),
          path.join(__dirname, "/commit_page_tablet_published_done_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_Draft";
      private cut: CommitPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new CommitPage(serviceClientMock, "season1", "episode1", {
          state: EpisodeState.DRAFT,
          videoContainer: {
            masterPlaylist: {
              synced: { version: 2 },
            },
          },
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/commit_page_tablet_draft.png"),
          path.join(__dirname, "/golden/commit_page_tablet_draft.png"),
          path.join(__dirname, "/commit_page_tablet_draft_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new PublishedCommitTestCase(
      "TabletView_Published_NoVideoError",
      ValidationError.NO_VIDEO_TRACK,
      path.join(__dirname, "/commit_page_tablet_published_no_video_error.png"),
      path.join(
        __dirname,
        "/golden/commit_page_tablet_published_no_video_error.png",
      ),
      path.join(
        __dirname,
        "/commit_page_tablet_published_no_video_error_diff.png",
      ),
    ),
    new PublishedCommitTestCase(
      "TabletView_Published_MoreThanOneVideoError",
      ValidationError.MORE_THAN_ONE_VIDEO_TRACKS,
      path.join(
        __dirname,
        "/commit_page_tablet_published_more_than_one_video_error.png",
      ),
      path.join(
        __dirname,
        "/golden/commit_page_tablet_published_more_than_one_video_error.png",
      ),
      path.join(
        __dirname,
        "/commit_page_tablet_published_more_than_one_video_error_diff.png",
      ),
    ),
    new PublishedCommitTestCase(
      "TabletView_Published_NoDefaultAudioError",
      ValidationError.NO_DEFAULT_AUDIO_TRACK,
      path.join(
        __dirname,
        "/commit_page_tablet_published_no_default_audio_error.png",
      ),
      path.join(
        __dirname,
        "/golden/commit_page_tablet_published_no_default_audio_error.png",
      ),
      path.join(
        __dirname,
        "/commit_page_tablet_published_no_default_audio_error_diff.png",
      ),
    ),
    new PublishedCommitTestCase(
      "TabletView_Published_MoreThanOneDefaultAudioError",
      ValidationError.MORE_THAN_ONE_DEFAULT_AUDIO_TRACKS,
      path.join(
        __dirname,
        "/commit_page_tablet_published_more_than_one_default_audio_error.png",
      ),
      path.join(
        __dirname,
        "/golden/commit_page_tablet_published_more_than_one_default_audio_error.png",
      ),
      path.join(
        __dirname,
        "/commit_page_tablet_published_more_than_one_default_audio_error_diff.png",
      ),
    ),
    new PublishedCommitTestCase(
      "TabletView_Published_TooManyAudioError",
      ValidationError.TOO_MANY_AUDIO_TRACKS,
      path.join(
        __dirname,
        "/commit_page_tablet_published_too_many_audio_error.png",
      ),
      path.join(
        __dirname,
        "/golden/commit_page_tablet_published_too_many_audio_error.png",
      ),
      path.join(
        __dirname,
        "/commit_page_tablet_published_too_many_audio_error_diff.png",
      ),
    ),
    new PublishedCommitTestCase(
      "TabletView_Published_TooManySubtitleError",
      ValidationError.TOO_MANY_SUBTITLE_TRACKS,
      path.join(
        __dirname,
        "/commit_page_tablet_published_too_many_subtitle_error.png",
      ),
      path.join(
        __dirname,
        "/golden/commit_page_tablet_published_too_many_subtitle_error.png",
      ),
      path.join(
        __dirname,
        "/commit_page_tablet_published_too_many_subtitle_error_diff.png",
      ),
    ),
  ],
});
