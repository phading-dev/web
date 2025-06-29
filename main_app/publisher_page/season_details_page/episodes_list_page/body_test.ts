import "../../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../../common/view_port";
import { EpisodesListPage } from "./body";
import {
  LIST_DRAFT_EPISODES,
  LIST_DRAFT_EPISODES_REQUEST_BODY,
  LIST_PUBLISHED_EPISODES,
  LIST_PUBLISHED_EPISODES_REQUEST_BODY,
  ListDraftEpisodesRequestBody,
  ListDraftEpisodesResponse,
  ListPublishedEpisodesRequestBody,
  ListPublishedEpisodesResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq, isArray } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

class EpisodesListPageServiceClientMock extends WebServiceClientMock {
  public listDraftEpisodesRequest: ListDraftEpisodesRequestBody;
  public listDraftEpisodesResponse: ListDraftEpisodesResponse;
  public listPublishedEpisodesRequests =
    new Array<ListPublishedEpisodesRequestBody>();
  public listPublishedEpisodesResponse: ListPublishedEpisodesResponse;

  public async send(request: ClientRequestInterface<any>): Promise<any> {
    switch (request.descriptor) {
      case LIST_DRAFT_EPISODES:
        this.listDraftEpisodesRequest = request.body;
        return this.listDraftEpisodesResponse;
      case LIST_PUBLISHED_EPISODES:
        this.listPublishedEpisodesRequests.push(request.body);
        return this.listPublishedEpisodesResponse;
      default:
        throw new Error(`Unknown request: ${request.descriptor.name}`);
    }
  }
}

TEST_RUNNER.run({
  name: "SeasonDetailsEpisodesListPageTest",
  cases: [
    new (class implements TestCase {
      public name = "ZeroEpisodes";
      private cut: EpisodesListPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new EpisodesListPageServiceClientMock();
        serviceClientMock.listDraftEpisodesResponse = {
          episodes: [],
        };
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [],
        };
        this.cut = new EpisodesListPage(
          serviceClientMock,
          () => new Date("2024-12-23T08:00:00Z"),
          "season1",
          {
            totalPublishedEpisodes: 0,
          },
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loadedDrafts", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.listDraftEpisodesRequest,
          eqMessage(
            {
              seasonId: "season1",
            },
            LIST_DRAFT_EPISODES_REQUEST_BODY,
          ),
          "ListDraftEpisodesRequestBody",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episodes_list_page_tablet_zero_episodes.png"),
          path.join(
            __dirname,
            "/golden/episodes_list_page_tablet_zero_episodes.png",
          ),
          path.join(
            __dirname,
            "/episodes_list_page_tablet_zero_episodes_diff.png",
          ),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "Back button clicked");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_DraftEpisodes_ScrolledToLoadMorePublishedEpisodes_DesktopView_PhoneView_ReloadPublishedEpisodesFromNewCursor_EditDraftEpisode_EditPublishedEpisode";
      private cut: EpisodesListPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new EpisodesListPageServiceClientMock();
        serviceClientMock.listDraftEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode1",
              name: "Episode 1",
            },
            {
              episodeId: "episode2",
              name: "Episode 2",
            },
          ],
        };
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode11",
              name: "Episode 11",
              index: 11,
              videoContainer: {
                durationSec: 3500,
              },
            },
            {
              episodeId: "episode10",
              name: "Episode 10",
              index: 10,
              videoContainer: {
                durationSec: 3600,
              },
            },
            {
              episodeId: "episode9",
              name: "Episode 9",
              index: 9,
              videoContainer: {
                durationSec: 3700,
              },
            },
            {
              episodeId: "episode8",
              name: "Episode 8",
              index: 8,
              videoContainer: {
                durationSec: 3800,
              },
            },
            {
              episodeId: "episode7",
              name: "Episode 7",
              index: 7,
              videoContainer: {
                durationSec: 3900,
              },
            },
            {
              episodeId: "episode6",
              name: "Episode 6",
              index: 6,
              videoContainer: {
                durationSec: 3600,
              },
            },
            {
              episodeId: "episode5",
              name: "Episode 5",
              index: 5,
              videoContainer: {
                durationSec: 4000,
              },
            },
            {
              episodeId: "episode4",
              name: "Episode 4",
              index: 4,
              videoContainer: {
                durationSec: 4100,
              },
            },
            {
              episodeId: "episode3",
              name: "Episode 3",
              index: 3,
              videoContainer: {
                durationSec: 4200,
              },
            },
          ],
          indexCursor: 3,
        };
        this.cut = new EpisodesListPage(
          serviceClientMock,
          () => new Date("2024-12-23T08:00:00Z"),
          "season1",
          {
            grade: 599,
            totalPublishedEpisodes: 10,
          },
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loadedPublishedEpisodes", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.listPublishedEpisodesRequests,
          isArray([
            eqMessage(
              {
                seasonId: "season1",
                limit: 10,
                next: false,
              },
              LIST_PUBLISHED_EPISODES_REQUEST_BODY,
            ),
          ]),
          "ListPublishedEpisodesRequestBody",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/episodes_list_page_tablet_published.png"),
          path.join(
            __dirname,
            "/golden/episodes_list_page_tablet_published.png",
          ),
          path.join(__dirname, "/episodes_list_page_tablet_published_diff.png"),
        );

        // Prepare
        serviceClientMock.listPublishedEpisodesRequests.length = 0;
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode2",
              name: "Episode 2",
              index: 2,
              videoContainer: {
                durationSec: 3900,
              },
            },
            {
              episodeId: "episode1",
              name: "Episode 1",
              index: 1,
              videoContainer: {
                durationSec: 3600,
              },
            },
          ],
        };

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) =>
          this.cut.once("loadedPublishedEpisodes", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episodes_list_page_tablet_published_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/episodes_list_page_tablet_published_scrolled.png",
          ),
          path.join(
            __dirname,
            "/episodes_list_page_tablet_published_scrolled_diff.png",
          ),
        );

        // Prepare
        await setDesktopView();
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episodes_list_page_desktop_published_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/episodes_list_page_desktop_published_scrolled.png",
          ),
          path.join(
            __dirname,
            "/episodes_list_page_desktop_published_scrolled_diff.png",
          ),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episodes_list_page_phone_published_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/episodes_list_page_phone_published_scrolled.png",
          ),
          path.join(
            __dirname,
            "/episodes_list_page_phone_published_scrolled_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.listPublishedEpisodesRequests.length = 0;
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode5",
              name: "Episode 5",
              index: 5,
              videoContainer: {
                durationSec: 4000,
              },
            },
          ],
        };

        // Execute
        this.cut.listPublishedEpisodeIndexCursorInput.val.value = "5";
        this.cut.listPublishedEpisodeIndexCursorInput.val.dispatchEvent(
          new Event("change"),
        );

        // Verify
        assertThat(
          serviceClientMock.listPublishedEpisodesRequests,
          isArray([
            eqMessage(
              {
                seasonId: "season1",
                indexCursor: 6,
                limit: 10,
                next: false,
              },
              LIST_PUBLISHED_EPISODES_REQUEST_BODY,
            ),
          ]),
          "ListPublishedEpisodesRequestBody 3",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/episodes_list_page_phone_published_reloaded.png",
          ),
          path.join(
            __dirname,
            "/golden/episodes_list_page_phone_published_reloaded.png",
          ),
          path.join(
            __dirname,
            "/episodes_list_page_phone_published_reloaded_diff.png",
          ),
        );

        // Prepare
        let episodeIdCaptured: string;
        this.cut.on("viewEpisode", (episodeId: string) => {
          episodeIdCaptured = episodeId;
        });

        // Execute
        this.cut.draftEpisodeElements[0].click();

        // Verify
        assertThat(episodeIdCaptured, eq("episode1"), "View draft episode id");

        // Prepare
        episodeIdCaptured = undefined;

        // Execute
        this.cut.publishedEpisodeElements[0].click();

        // Verify
        assertThat(
          episodeIdCaptured,
          eq("episode5"),
          "View published episode id",
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
