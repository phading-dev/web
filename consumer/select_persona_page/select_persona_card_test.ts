import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { normalizeBody } from "../common/normalize_body";
import { SelectPersonaCard } from "./select_persona_card";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "SelectPersonaCardTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderSelected_Unselect";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new SelectPersonaCard(
          {
            id: "personaId",
            imagePath: wideImage,
            name: "My persona name",
          },
          true
        );
        this.container = E.div({}, cut.body);

        // Execute
        document.body.append(this.container);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/select_persona_card_selected_render.png"),
          path.join(
            __dirname,
            "/golden/select_persona_card_selected_render.png"
          ),
          path.join(__dirname, "/select_persona_card_selected_render_diff.png"),
          { fullPage: true }
        );

        // Execute
        cut.unselect();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/select_persona_card_unselect.png"),
          path.join(__dirname, "/golden/select_persona_card_unselect.png"),
          path.join(__dirname, "/select_persona_card_unselect_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderUnselected_Select";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new SelectPersonaCard(
          {
            id: "personaId",
            imagePath: wideImage,
            name: "My persona name",
          },
          false
        );
        this.container = E.div({}, cut.body);

        // Execute
        document.body.append(this.container);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/select_persona_card_unselected_render.png"),
          path.join(
            __dirname,
            "/golden/select_persona_card_unselected_render.png"
          ),
          path.join(
            __dirname,
            "/select_persona_card_unselected_render_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        let capturedPersonaId: string;
        cut.on("select", (personaId) => (capturedPersonaId = personaId));
        cut.body.click();

        // Verify
        assertThat(capturedPersonaId, eq("personaId"), "selected persona id");
        await asyncAssertScreenshot(
          path.join(__dirname, "/select_persona_card_select.png"),
          path.join(__dirname, "/golden/select_persona_card_select.png"),
          path.join(__dirname, "/select_persona_card_select_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
