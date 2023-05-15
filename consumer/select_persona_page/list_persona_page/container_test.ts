import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { LOCAL_PERSONA_STORAGE } from "../../common/local_persona_storage";
import { ListPersonaPage } from "./container";
import {
  LIST_PERSONAS,
  ListPersonasResponse,
} from "@phading/user_service_interface/interface";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../common/normalize_body";

TEST_RUNNER.run({
  name: "ListPersonaPageTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderOneUnselected_Select_Create";
      private cut: ListPersonaPage;
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

        // Execute
        this.cut = new ListPersonaPage(
          mockWebServiceClient,
          LOCAL_PERSONA_STORAGE
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        document.body.append(this.cut.body);

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
        this.cut.on("selected", () => (isSelected = true));
        this.cut.personaCards[0].body.click();

        // Verify
        assertThat(isSelected, eq(true), "persona is selected");
        assertThat(
          LOCAL_PERSONA_STORAGE.read(),
          eq("id1"),
          "selected persona id"
        );

        // Execute
        let toCreate = false;
        this.cut.on("create", () => (toCreate = true));
        this.cut.addPersonaCard.click();

        // Verify
        assertThat(toCreate, eq(true), "navigate to create");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderSixWithSelected_Scroll";
      private cut: ListPersonaPage;
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

        // Execute
        this.cut = new ListPersonaPage(
          mockWebServiceClient,
          LOCAL_PERSONA_STORAGE
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        document.body.append(this.cut.body);

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
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderWideScreen";
      private cut: ListPersonaPage;
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
        await setViewport(1400, 800);

        // Execute
        this.cut = new ListPersonaPage(
          mockWebServiceClient,
          LOCAL_PERSONA_STORAGE
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_persona_page_render_wide.png"),
          path.join(__dirname, "/golden/list_persona_page_render_wide.png"),
          path.join(__dirname, "/list_persona_page_render_wide_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })()
  ],
});
