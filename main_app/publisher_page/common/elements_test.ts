import "../../../dev/env";
import coverImage = require("./test_data/cover_tall.jpg");
import path = require("path");
import { SCHEME } from "../../../common/color_scheme";
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import {
  eArchivedSeasonItem,
  eDraftSeasonItem,
  ePublishedSeasonItem,
} from "./elements";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "ElementsTest",
  cases: [
    new (class implements TestCase {
      public name = "PublishedSeasonItem";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = ePublishedSeasonItem(
          {
            name: "Re-Zero: Starting Life in Another World Season 1",
            coverImageUrl: coverImage,
            totalPublishedEpisodes: 25,
            averageRating: 4.52,
            ratingsCount: 12345,
            lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
            grade: 18,
          },
          new Date("2024-12-23T12:00:00Z"),
          "width: 35rem;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_season_item_small.png"),
          path.join(__dirname, "/golden/published_season_item_small.png"),
          path.join(__dirname, "/published_season_item_small_diff.png"),
        );

        // Execute
        cut.style.width = "60rem";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/published_season_item_large.png"),
          path.join(__dirname, "/golden/published_season_item_large.png"),
          path.join(__dirname, "/published_season_item_large_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DraftSeasonItem";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = eDraftSeasonItem(
          {
            name: "Re-Zero: Starting Life in Another World Season 1",
            coverImageUrl: coverImage,
            lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
            grade: 18,
          },
          new Date("2024-12-23T12:00:00Z"),
          "width: 35rem;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/drafted_season_item_small.png"),
          path.join(__dirname, "/golden/drafted_season_item_small.png"),
          path.join(__dirname, "/drafted_season_item_small_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DraftSeasonItemWithoutCoverImage";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = eDraftSeasonItem(
          {
            name: "Re-Zero: Starting Life in Another World Season 1",
            lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
            grade: 18,
          },
          new Date("2024-12-23T12:00:00Z"),
          "width: 60rem;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/drafted_season_item_large.png"),
          path.join(__dirname, "/golden/drafted_season_item_large.png"),
          path.join(__dirname, "/drafted_season_item_large_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ArchivedSeasonItem";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = eArchivedSeasonItem(
          {
            name: "Re-Zero: Starting Life in Another World Season 1",
            lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
            grade: 18,
          },
          new Date("2024-12-23T12:00:00Z"),
          "width: 35rem;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/archived_season_item_small.png"),
          path.join(__dirname, "/golden/archived_season_item_small.png"),
          path.join(__dirname, "/archived_season_item_small_diff.png"),
        );

        // Execute
        cut.style.width = "60rem";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/archived_season_item_large.png"),
          path.join(__dirname, "/golden/archived_season_item_large.png"),
          path.join(__dirname, "/archived_season_item_large_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
