import path = require("path");
import { SelectPersonaPage } from "./container";
import { CreatePersonaPageMock } from "./create_persona_page/container_mock";
import { ListPersonaPageMock } from "./list_persona_page/container_mock";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../common/normalize_body";

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "SelectPersonaPageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; top: 0; left: 0;`,
      });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private cut: SelectPersonaPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);

        // Execute
        this.cut = new SelectPersonaPage(
          () => new ListPersonaPageMock(),
          () => new CreatePersonaPageMock(),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.append(...bodies)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/select_persona_page_render.png"),
          path.join(__dirname, "/golden/select_persona_page_render.png"),
          path.join(__dirname, "/select_persona_page_render_diff.png")
        );

        // Execute
        this.cut.listPersonaPage.addPersonaCard.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/select_persona_page_navigate_to_create.png"),
          path.join(
            __dirname,
            "/golden/select_persona_page_navigate_to_create.png"
          ),
          path.join(
            __dirname,
            "/select_persona_page_navigate_to_create_diff.png"
          )
        );

        // Execute
        this.cut.createPersonaPage.backMenuItem.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/select_persona_page_navigate_back_to_list.png"
          ),
          path.join(__dirname, "/golden/select_persona_page_render.png"),
          path.join(
            __dirname,
            "/select_persona_page_navigate_back_to_list_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
