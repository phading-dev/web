import "../../../dev/env";
import coverImage = require("../common/test_data/cover_tall.jpg");
import coverImage2 = require("../common/test_data/cover_tall2.jpg");
import path from "path";
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { ListRecentPremieresPage } from "./body";
import {
  LIST_SEASONS_BY_RATING_REQUEST_BODY,
  LIST_SEASONS_BY_RECENT_PREMIERE_TIME_REQUEST_BODY,
  ListSeasonsByRecentPremiereTimeResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseClick } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "ListRecentPremieresPage",
  cases: [
    new (class implements TestCase {
      public name = "Render_Scroll_Click";
      private cut: ListRecentPremieresPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season2",
              name: "Attack on Titan",
              coverImageUrl: coverImage2,
              grade: 9,
              ratingsCount: 6789,
              averageRating: 4.5,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer",
              coverImageUrl: coverImage,
              grade: 19,
              ratingsCount: 5432,
              averageRating: 4.8,
            },
            {
              seasonId: "season4",
              name: "One Piece",
              coverImageUrl: coverImage2,
              grade: 29,
              ratingsCount: 12345,
              averageRating: 4.7,
            },
            {
              seasonId: "season5",
              name: "Naruto",
              coverImageUrl: coverImage,
              grade: 59,
              ratingsCount: 9876,
              averageRating: 4.6,
            },
            {
              seasonId: "season6",
              name: "Bleach",
              coverImageUrl: coverImage2,
              grade: 599,
              ratingsCount: 8765,
              averageRating: 4.4,
            },
            {
              seasonId: "season7",
              name: "My Hero Academia",
              coverImageUrl: coverImage,
              grade: 699,
              ratingsCount: 6543,
              averageRating: 4.5,
            },
            {
              seasonId: "season8",
              name: "Jujutsu Kaisen",
              coverImageUrl: coverImage2,
              grade: 999,
              ratingsCount: 4321,
              averageRating: 4.9,
            },
            {
              seasonId: "season9",
              name: "Fullmetal Alchemist",
              coverImageUrl: coverImage,
              grade: 1099,
              ratingsCount: 7654,
              averageRating: 4.8,
            },
            {
              seasonId: "season10",
              name: "Death Note",
              coverImageUrl: coverImage2,
              grade: 1299,
              ratingsCount: 9876,
              averageRating: 4.7,
            },
            {
              seasonId: "season11",
              name: "Hunter x Hunter",
              coverImageUrl: coverImage,
              grade: 1499,
              ratingsCount: 5432,
              averageRating: 4.6,
            },
            {
              seasonId: "season12",
              name: "Sword Art Online",
              coverImageUrl: coverImage2,
              grade: 5999,
              ratingsCount: 6789,
              averageRating: 4.3,
            },
          ],
          premiereTimeCursor: 2000,
          createdTimeCursor: 1000,
        } as ListSeasonsByRecentPremiereTimeResponse;
        this.cut = new ListRecentPremieresPage(
          serviceClientMock,
          () => new Date("2024-01-01"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
            },
            LIST_SEASONS_BY_RATING_REQUEST_BODY,
          ),
          "request 1",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_recent_premieres_page_render.png"),
          path.join(__dirname, "/golden/list_recent_premieres_page_render.png"),
          path.join(__dirname, "/list_recent_premieres_page_render_diff.png"),
        );

        // Prepare
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season13",
              name: "Black Clover",
              coverImageUrl: coverImage,
              grade: 9999,
              ratingsCount: 4321,
              averageRating: 4.2,
            },
            {
              seasonId: "season14",
              name: "Tokyo Ghoul",
              coverImageUrl: coverImage2,
              grade: 9999,
              ratingsCount: 8765,
              averageRating: 4.3,
            },
          ],
        } as ListSeasonsByRecentPremiereTimeResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
              premiereTimeCursor: 2000,
              createdTimeCursor: 1000,
            },
            LIST_SEASONS_BY_RECENT_PREMIERE_TIME_REQUEST_BODY,
          ),
          "request 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_recent_premieres_page_scrolled.png"),
          path.join(
            __dirname,
            "/golden/list_recent_premieres_page_scrolled.png",
          ),
          path.join(__dirname, "/list_recent_premieres_page_scrolled_diff.png"),
        );

        // Prepare
        let showDetailsId: string;
        this.cut.on("showDetails", (id) => {
          showDetailsId = id;
        });

        // Execute
        await mouseClick(100, 50);

        // Verify
        assertThat(showDetailsId, eq("season8"), "showDetailsId");
      }
      public async tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
