import "../../../dev/env";
import "../../../common/normalize_body";
import coverImage = require("./test_data/cover_tall.jpg");
import path = require("path");
import { SCHEME } from "../../../common/color_scheme";
import { setPhoneView, setTabletView } from "../../../common/view_port";
import { SeasonItem } from "./season_item";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "SeasonItemTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = new SeasonItem(
          {
            seasonId: "season1",
            name: "Re:Zero -Starting Life in Another World-",
            coverImageUrl: coverImage,
            grade: 18,
            ratingsCount: 12345,
            averageRating: 4.09,
          },
          "width: 300px;",
        );

        // Execute
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_large.png"),
          path.join(__dirname, "/golden/season_item_large.png"),
          path.join(__dirname, "/season_item_large_diff.png"),
        );

        // Execute
        await setPhoneView();
        cut.body.style.width = "165px";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_small.png"),
          path.join(__dirname, "/golden/season_item_small.png"),
          path.join(__dirname, "/season_item_small_diff.png"),
        );

        // Prepare
        let detailsSeason: string;
        cut.on("showDetails", (seasonId) => {
          detailsSeason = seasonId;
        });

        // Execute
        cut.body.click();

        // Verify
        assertThat(detailsSeason, eq("season1"), "details with seasonId");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LongName";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = new SeasonItem(
          {
            seasonId: "season1",
            name: "Re:Zero -Starting Life in Another World- Re:Zero -Starting Life in Another World-",
            coverImageUrl: coverImage,
            grade: 1000,
            ratingsCount: 0,
            averageRating: 0,
          },
          "width: 165px;",
        );

        // Execute
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_long.png"),
          path.join(__dirname, "/golden/season_item_long.png"),
          path.join(__dirname, "/season_item_long_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
