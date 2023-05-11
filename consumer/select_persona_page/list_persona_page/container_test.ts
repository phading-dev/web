import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { LOCAL_PERSONA_STORAGE } from "../../common/local_persona_storage";
import { normalizeBody } from "../../common/normalize_body";
import { ListPersonaPage } from "./container";
import {
  LIST_PERSONAS,
  ListPersonasResponse,
} from "@phading/user_service_interface/interface";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";

normalizeBody();

TEST_RUNNER.run({
  name: "ListPersonaPageTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderOneUnselected_Select_Create";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let mockWebServiceClient = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
          public send(request: any): any {
            assertThat(request.descriptor, eq(LIST_PERSONAS), "List request");
            return {
              cards: [
                {
                  id: "id1",
                  imagePath: wideImage,
                  name: "Persona 1",
                },
              ],
            } as ListPersonasResponse;
          }
        })();
        await setViewport(1000, 800);
        let cut = new ListPersonaPage(
          mockWebServiceClient,
          LOCAL_PERSONA_STORAGE
        );
        this.container = E.div({}, cut.body);

        // Execute
        document.body.append(this.container);
        await cut.show();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_persona_page_render_one_unselected.png"),
          path.join(
            __dirname,
            "/golden/list_persona_page_render_one_unselected.png"
          ),
          path.join(
            __dirname,
            "/list_persona_page_render_one_unselected_diff.png"
          )
        );

        // Execute
        let isSelected = false;
        cut.on("selected", () => (isSelected = true));
        cut.personaCards[0].body.click();

        // Verify
        assertThat(isSelected, eq(true), "persona is selected");
        assertThat(
          LOCAL_PERSONA_STORAGE.read(),
          eq("id1"),
          "selected persona id"
        );

        // Execute
        let toCreate = false;
        cut.on("create", () => (toCreate = true));
        cut.addPersonaCard.click();

        // Verify
        assertThat(toCreate, eq(true), "navigate to create");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderSixWithSelected_Scroll";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let mockWebServiceClient = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
          public send(request: any): any {
            assertThat(request.descriptor, eq(LIST_PERSONAS), "List request");
            return {
              cards: [
                {
                  id: "id1",
                  imagePath: wideImage,
                  name: "Persona 1",
                },
                {
                  id: "id2",
                  imagePath: wideImage,
                  name: "Persona 2",
                },
                {
                  id: "id3",
                  imagePath: wideImage,
                  name: "Persona 3",
                },
                {
                  id: "id4",
                  imagePath: wideImage,
                  name: "Persona 4",
                },
                {
                  id: "id5",
                  imagePath: wideImage,
                  name: "Persona 5",
                },
                {
                  id: "id6",
                  imagePath: wideImage,
                  name: "Persona 6",
                },
              ],
            } as ListPersonasResponse;
          }
        })();
        LOCAL_PERSONA_STORAGE.save("id3");
        await setViewport(1000, 600);
        let cut = new ListPersonaPage(
          mockWebServiceClient,
          LOCAL_PERSONA_STORAGE
        );
        this.container = E.div({}, cut.body);

        // Execute
        document.body.append(this.container);
        await cut.show();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_persona_page_render_six.png"),
          path.join(__dirname, "/golden/list_persona_page_render_six.png"),
          path.join(__dirname, "/list_persona_page_render_six_diff.png")
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_persona_page_scrolled_six.png"),
          path.join(__dirname, "/golden/list_persona_page_scrolled_six.png"),
          path.join(__dirname, "/list_persona_page_scrolled_six_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
