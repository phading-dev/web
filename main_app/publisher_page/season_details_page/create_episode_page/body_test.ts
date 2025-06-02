import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { CreateEpisodePage } from "./body";
import {
  CREATE_EPISODE,
  CREATE_EPISODE_REQUEST_BODY,
  CreateEpisodeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "CreateEpisodePageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_NameTooLong_NameValid_CreateError_CreateSuccess_BackAfterClick";
      private cut: CreateEpisodePage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new CreateEpisodePage(serviceClientMock, "season1");

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_episode_page_default.png"),
          path.join(__dirname, "/golden/create_episode_page_default.png"),
          path.join(__dirname, "/create_episode_page_default_diff.png"),
        );

        // Execute
        this.cut.nameInput.val.value = Array(200).fill("a").join("");
        this.cut.nameInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_episode_page_name_too_long.png"),
          path.join(__dirname, "/golden/create_episode_page_name_too_long.png"),
          path.join(__dirname, "/create_episode_page_name_too_long_diff.png"),
        );

        // Execute
        this.cut.nameInput.val.value = " Episode 1 ";
        this.cut.nameInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_episode_page_name_valid.png"),
          path.join(__dirname, "/golden/create_episode_page_name_valid.png"),
          path.join(__dirname, "/create_episode_page_name_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.nameInput.val.dispatchEnter();
        await new Promise<void>((resolve) => this.cut.once("created", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(CREATE_EPISODE),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeName: "Episode 1",
            },
            CREATE_EPISODE_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_episode_page_create_error.png"),
          path.join(__dirname, "/golden/create_episode_page_create_error.png"),
          path.join(__dirname, "/create_episode_page_create_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let response: CreateEpisodeResponse = {
          episodeId: "episode1",
        };
        serviceClientMock.response = response;
        let seasonId: string;
        let episodeId: string;
        this.cut.on("editEpisode", (seasonId_, episodeId_) => {
          seasonId = seasonId_;
          episodeId = episodeId_;
        });

        // Execute
        this.cut.inputFormPage.primaryButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("created", resolve));

        // Verify
        assertThat(seasonId, eq("season1"), "edit episode season");
        assertThat(episodeId, eq("episode1"), "edit episode");
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_episode_page_create_success.png"),
          path.join(__dirname, "/golden/create_episode_page_name_valid.png"),
          path.join(__dirname, "/create_episode_page_create_success_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.inputFormPage.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back after click");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
