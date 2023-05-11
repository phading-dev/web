import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { PersonaCard } from "./persona_card";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "PersonaCardTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderSelected";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new PersonaCard(
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
          path.join(__dirname, "/persona_card_selected_render.png"),
          path.join(
            __dirname,
            "/golden/persona_card_selected_render.png"
          ),
          path.join(__dirname, "/persona_card_selected_render_diff.png"),
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
        let cut = new PersonaCard(
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
          path.join(__dirname, "/persona_card_unselected_render.png"),
          path.join(
            __dirname,
            "/golden/persona_card_unselected_render.png"
          ),
          path.join(
            __dirname,
            "/persona_card_unselected_render_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        let capturedPersonaId: string;
        cut.on("select", (personaId) => (capturedPersonaId = personaId));
        cut.body.click();

        // Verify
        assertThat(capturedPersonaId, eq("personaId"), "selected persona id");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
