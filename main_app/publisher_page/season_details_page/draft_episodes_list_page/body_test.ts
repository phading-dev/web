import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { DraftEpisodesListPage } from "./body";
import { ListDraftEpisodesResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "SeasonDetailsDraftEpisodesListPageTest",
  cases: [
    new (class implements TestCase {
      public name = "ZeroEpisodes";
      private cut: DraftEpisodesListPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episodes: [],
        } as ListDraftEpisodesResponse;
        this.cut = new DraftEpisodesListPage(serviceClientMock, "season1");

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/draft_episodes_list_page_tablet_zero_episodes.png",
          ),
          path.join(
            __dirname,
            "/golden/draft_episodes_list_page_tablet_zero_episodes.png",
          ),
          path.join(
            __dirname,
            "/draft_episodes_list_page_tablet_zero_episodes_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "MultipleEpisodes_ViewEpisode_Back";
      private cut: DraftEpisodesListPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
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
        } as ListDraftEpisodesResponse;
        this.cut = new DraftEpisodesListPage(serviceClientMock, "season1");

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/draft_episodes_list_page_tablet_multiple_episodes.png",
          ),
          path.join(
            __dirname,
            "/golden/draft_episodes_list_page_tablet_multiple_episodes.png",
          ),
          path.join(
            __dirname,
            "/draft_episodes_list_page_tablet_multiple_episodes_diff.png",
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
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "Back button clicked");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
