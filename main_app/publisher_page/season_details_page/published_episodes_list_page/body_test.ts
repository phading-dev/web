import "../../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setPhoneView, setTabletView } from "../../../../common/view_port";
import { PublishedEpisodesListPage } from "./body";
import {
  LIST_PUBLISHED_EPISODES_REQUEST_BODY,
  ListPublishedEpisodesResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

class InvalidCursorInputTest implements TestCase {
  private cut: PublishedEpisodesListPage;
  public constructor(
    public name: string,
    private inputValue: string,
  ) {}
  public async execute() {
    // Prepare
    let serviceClientMock = new WebServiceClientMock();
    serviceClientMock.response = {
      episodes: [],
    } as ListPublishedEpisodesResponse;
    this.cut = new PublishedEpisodesListPage(
      serviceClientMock,
      () => new Date("2024-12-23T08:00:00Z"),
      "season1",
      {
        grade: 599,
        totalPublishedEpisodes: 10,
      },
    );
    await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

    // Execute
    this.cut.listPublishedEpisodeIndexCursorInput.val.value = this.inputValue;
    this.cut.listPublishedEpisodeIndexCursorInput.val.dispatchEvent(
      new Event("change"),
    );
    await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

    // Verify
    assertThat(
      serviceClientMock.request.body,
      eqMessage(
        {
          seasonId: "season1",
          limit: 10,
          next: false,
        },
        LIST_PUBLISHED_EPISODES_REQUEST_BODY,
      ),
      "ListPublishedEpisodesRequestBody",
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "SeasonDetailsPublishedEpisodesListPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "PhoneView_TabletView_ScrolledToLoadMore_ReloadFromNewCursor_ReloadFromNewOrder_ViewEpisode_Back";
      private cut: PublishedEpisodesListPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
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
        } as ListPublishedEpisodesResponse;
        this.cut = new PublishedEpisodesListPage(
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
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              limit: 10,
              next: false,
            },
            LIST_PUBLISHED_EPISODES_REQUEST_BODY,
          ),
          "ListPublishedEpisodesRequestBody",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/published_episodes_list_page_phone_default.png",
          ),
          path.join(
            __dirname,
            "/golden/published_episodes_list_page_phone_default.png",
          ),
          path.join(
            __dirname,
            "/published_episodes_list_page_phone_default_diff.png",
          ),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/published_episodes_list_page_tablet_default.png",
          ),
          path.join(
            __dirname,
            "/golden/published_episodes_list_page_tablet_default.png",
          ),
          path.join(
            __dirname,
            "/published_episodes_list_page_tablet_default_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.response = {
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
        } as ListPublishedEpisodesResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              limit: 10,
              next: false,
              indexCursor: 3,
            },
            LIST_PUBLISHED_EPISODES_REQUEST_BODY,
          ),
          "ListPublishedEpisodesRequestBody",
        );
        assertThat(
          this.cut.listPublishedEpisodeIndexCursorInput.val.value,
          eq(""),
          "input value",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/published_episodes_list_page_tablet_default_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/published_episodes_list_page_tablet_default_scrolled.png",
          ),
          path.join(
            __dirname,
            "/published_episodes_list_page_tablet_default_scrolled_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.response = {
          episodes: [
            {
              episodeId: "episode5",
              name: "Episode 5",
              index: 5,
              videoContainer: {
                durationSec: 3900,
              },
            },
            {
              episodeId: "episode4",
              name: "Episode 4",
              index: 4,
              videoContainer: {
                durationSec: 3600,
              },
            },
          ],
        } as ListPublishedEpisodesResponse;

        // Execute
        this.cut.listPublishedEpisodeIndexCursorInput.val.value = "5";
        this.cut.listPublishedEpisodeIndexCursorInput.val.dispatchEvent(
          new Event("change"),
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              limit: 10,
              next: false,
              indexCursor: 6,
            },
            LIST_PUBLISHED_EPISODES_REQUEST_BODY,
          ),
          "ListPublishedEpisodesRequestBody",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/published_episodes_list_page_tablet_newest_from_cursor.png",
          ),
          path.join(
            __dirname,
            "/golden/published_episodes_list_page_tablet_newest_from_cursor.png",
          ),
          path.join(
            __dirname,
            "/published_episodes_list_page_tablet_newest_from_cursor_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.response = {
          episodes: [
            {
              episodeId: "episode5",
              name: "Episode 5",
              index: 5,
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
          ],
        } as ListPublishedEpisodesResponse;

        // Execute
        this.cut.sortByOptionOldest.val.click();
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              limit: 10,
              next: true,
              indexCursor: 4,
            },
            LIST_PUBLISHED_EPISODES_REQUEST_BODY,
          ),
          "ListPublishedEpisodesRequestBody",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/published_episodes_list_page_tablet_oldest_from_cursor.png",
          ),
          path.join(
            __dirname,
            "/golden/published_episodes_list_page_tablet_oldest_from_cursor.png",
          ),
          path.join(
            __dirname,
            "/published_episodes_list_page_tablet_oldest_from_cursor_diff.png",
          ),
        );

        // Prepare
        let episodeIdCaptured: string;
        this.cut.on("viewEpisode", (episodeId: string) => {
          episodeIdCaptured = episodeId;
        });

        // Execute
        this.cut.publishedEpisodeElements[0].click();

        // Verify
        assertThat(
          episodeIdCaptured,
          eq("episode5"),
          "View published episode id",
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
    new InvalidCursorInputTest("CursorTooSmall", "0"),
    new InvalidCursorInputTest("CursorTooLarge", "11"),
    new InvalidCursorInputTest("CursorNan", "MM"),
  ],
});
