import "../../../dev/env";
import userImage = require("../common/test_data/user_image.jpg");
import userImage2 = require("../common/test_data/user_image2.png");
import path from "path";
import { normalizeBody } from "../../../common/normalize_body";
import { setDesktopView, setTabletView } from "../../../common/view_port";
import { SearchPublishersPage } from "./body";
import {
  SEARCH_PUBLISHERS_REQUEST_BODY,
  SearchPublishersResponse,
} from "@phading/user_service_interface/web/third_person/interface";
import { SearchTarget } from "@phading/web_interface/main/consumer/page";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseClick, mouseMove } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "SearchPublishersPage",
  cases: [
    new (class implements TestCase {
      public name = "Render_Scroll_Click_Search";
      private cut: SearchPublishersPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          accounts: [
            {
              accountId: "account1",
              name: "Jackson Chen",
              avatarLargeUrl: userImage,
              description: "A passionate writer and publisher.",
            },
            {
              accountId: "account2",
              name: "Emily Davis",
              avatarLargeUrl: userImage2,
              description:
                "An experienced editor with a love for storytelling.",
            },
            {
              accountId: "account3",
              name: "Sophia Brown",
              avatarLargeUrl: userImage,
              description: "A creative publisher with a knack for design.",
            },
            {
              accountId: "account4",
              name: "Liam Johnson",
              avatarLargeUrl: userImage2,
              description: "A dedicated author and literary enthusiast.",
            },
            {
              accountId: "account5",
              name: "Olivia Wilson",
              avatarLargeUrl: userImage,
              description: "An innovative thinker and content creator.",
            },
            {
              accountId: "account6",
              name: "Ethan Martinez",
              avatarLargeUrl: userImage,
              description: "A skilled publisher with a passion for innovation.",
            },
            {
              accountId: "account7",
              name: "Ava Garcia",
              avatarLargeUrl: userImage2,
              description: "A creative editor with a love for storytelling.",
            },
            {
              accountId: "account8",
              name: "Mason Rodriguez",
              avatarLargeUrl: userImage,
              description: "An enthusiastic writer and content strategist.",
            },
          ],
          scoreCursor: 0.58,
          createdTimeCursor: 1000,
        } as SearchPublishersResponse;
        this.cut = new SearchPublishersPage(serviceClientMock, "some query");

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
              query: "some query",
            },
            SEARCH_PUBLISHERS_REQUEST_BODY,
          ),
          "request 1",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_publishers_page_tablet_render.png"),
          path.join(
            __dirname,
            "/golden/search_publishers_page_tablet_render.png",
          ),
          path.join(
            __dirname,
            "/search_publishers_page_tablet_render_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.response = {
          accounts: [
            {
              accountId: "account9",
              name: "Isabella Lee",
              avatarLargeUrl: userImage2,
              description: "A talented editor with a passion for creativity.",
            },
            {
              accountId: "account10",
              name: "James White",
              avatarLargeUrl: userImage,
              description:
                "An innovative publisher with a love for storytelling.",
            },
            {
              accountId: "account11",
              name: "Amelia Harris",
              avatarLargeUrl: userImage2,
              description:
                "A skilled writer with a knack for engaging content.",
            },
          ],
        } as SearchPublishersResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
              query: "some query",
              scoreCursor: 0.58,
              createdTimeCursor: 1000,
            },
            SEARCH_PUBLISHERS_REQUEST_BODY,
          ),
          "request 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_publishers_page_tablet_scrolled.png"),
          path.join(
            __dirname,
            "/golden/search_publishers_page_tablet_scrolled.png",
          ),
          path.join(
            __dirname,
            "/search_publishers_page_tablet_scrolled_diff.png",
          ),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_publishers_page_desktop_scrolled.png"),
          path.join(
            __dirname,
            "/golden/search_publishers_page_desktop_scrolled.png",
          ),
          path.join(
            __dirname,
            "/search_publishers_page_desktop_scrolled_diff.png",
          ),
        );

        // Prepare
        let showroomId: string;
        this.cut.on("showroom", (id) => {
          showroomId = id;
        });

        // Execute
        await mouseClick(100, 180);

        // Verify
        assertThat(showroomId, eq("account1"), "showroom id");

        // Prepare
        let searchTarget: SearchTarget;
        let query: string;
        this.cut.searchInput.val.on("search", (searchTarget_, query_) => {
          searchTarget = searchTarget_;
          query = query_;
        });

        // Execute
        this.cut.searchInput.val.emit(
          "search",
          SearchTarget.SEASON,
          "new query",
        );

        // Verify
        assertThat(searchTarget, eq(SearchTarget.SEASON), "search target");
        assertThat(query, eq("new query"), "search query");
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
