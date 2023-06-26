import LRU = require("lru-cache");
import path = require("path");
import { QuickTalesPage } from "./container";
import { ImagesViewerPage } from "./image_viewer_page/container";
import { QuickTalesListPage } from "./quick_tales_list_page/container";
import { QuickTalesListPageMock } from "./quick_tales_list_page/container_mock";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../common/normalize_body";

let menuContainer: HTMLDivElement;
let controllerContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "QuickTalesPage",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; left: 0; top: 0;`,
      });
      controllerContainer = E.div({
        style: `position: fixed; right: 0; top: 0`,
      });
      document.body.append(menuContainer, controllerContainer);
    },
    tearDown: () => {
      menuContainer.remove();
      controllerContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Render_ViewImage_Back";
      private cut: QuickTalesPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let cache = new LRU<string, QuickTalesListPage>({
          max: 10,
        });

        // Execute
        this.cut = new QuickTalesPage(
          cache,
          (context) =>
            new QuickTalesListPageMock(context, {
              startingTaleId: 0,
            }),
          (
            appendBodiesFn,
            prependMenuBodiesFn,
            appendControllerBodiesFn,
            imagePaths,
            initialIndex
          ) =>
            new ImagesViewerPage(
              appendBodiesFn,
              prependMenuBodiesFn,
              appendControllerBodiesFn,
              imagePaths,
              initialIndex
            ),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.prepend(...bodies),
          (...bodies) => menuContainer.append(...bodies),
          (...bodies) => controllerContainer.append(...bodies),
          {}
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_page_render.png"),
          path.join(__dirname, "/golden/quick_tales_page_render.png"),
          path.join(__dirname, "/quick_tales_page_render_diff.png")
        );

        // Execute
        for (let card of this.cut.listPage.quickTaleCards) {
          card.previewImages[0].click();
          break;
        }

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_page_view_image.png"),
          path.join(__dirname, "/golden/quick_tales_page_view_image.png"),
          path.join(__dirname, "/quick_tales_page_view_image_diff.png")
        );

        // Execute
        this.cut.imageViewerPage.backMenuItem.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_page_back_to_list.png"),
          path.join(__dirname, "/golden/quick_tales_page_render.png"),
          path.join(__dirname, "/quick_tales_page_back_to_list_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
