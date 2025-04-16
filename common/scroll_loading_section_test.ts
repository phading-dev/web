import "../dev/env";
import "./normalize_body";
import path from "path";
import { SCHEME } from "./color_scheme";
import { ScrollLoadingSection } from "./scroll_loading_section";
import { FONT_M } from "./sizes";
import { setTabletView } from "./view_port";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref, assign } from "@selfage/ref";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

let index = 0;

function item(): HTMLDivElement {
  return E.div(
    {
      style: `width: 100%; height: 10rem; background-color: ${SCHEME.neutral2}; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem;`,
    },
    E.text(`Item ${index++}`),
  );
}

TEST_RUNNER.run({
  name: "ScrollLoadingSectionTest",
  cases: [
    new (class implements TestCase {
      public name = "Scrolling";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        let cut = new Ref<ScrollLoadingSection>();
        this.container = E.div(
          {
            style: `width: 100%; min-height: 100%; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: column nowrap; gap: 2rem;`,
          },
          assign(cut, new ScrollLoadingSection()).body,
        );
        document.body.append(this.container);
        let hasMore = true;
        let itemLength = 2;

        // Execute
        cut.val.startLoading(async () => {
          await new Promise((resolve) => setTimeout(resolve));
          Array.from({ length: itemLength }).forEach(() => {
            this.container.insertBefore(item(), cut.val.body);
          });
          return hasMore;
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/scroll_loading_section_init.png"),
          path.join(__dirname, "/golden/scroll_loading_section_init.png"),
          path.join(__dirname, "/scroll_loading_section_init_diff.png"),
        );

        // Prepare
        itemLength = 5;
        hasMore = false;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => cut.val.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/scroll_loading_section_scrolled.png"),
          path.join(__dirname, "/golden/scroll_loading_section_scrolled.png"),
          path.join(__dirname, "/scroll_loading_section_scrolled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/scroll_loading_section_scrolled_no_more.png"),
          path.join(
            __dirname,
            "/golden/scroll_loading_section_scrolled_no_more.png",
          ),
          path.join(
            __dirname,
            "/scroll_loading_section_scrolled_no_more_diff.png",
          ),
        );

        // Prepare
        itemLength = 2;
        hasMore = false;

        // Execute
        cut.val.tryReloadButton.val.click();
        await new Promise<void>((resolve) => cut.val.once("loaded", resolve));
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/scroll_loading_section_reloaded.png"),
          path.join(__dirname, "/golden/scroll_loading_section_reloaded.png"),
          path.join(__dirname, "/scroll_loading_section_reloaded_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
