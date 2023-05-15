import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { LOCAL_PERSONA_STORAGE } from "../../common/local_persona_storage";
import { CreatePersonaPage } from "./container";
import {
  CREATE_PERSONA,
  CREATE_PERSONA_REQUEST_BODY,
  CreatePersonaResponse,
  UPLOAD_PERSONA_IMAGE,
  UploadPersonaImageResponse,
} from "@phading/user_service_interface/interface";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  setViewport,
  supplyFiles,
  writeFile,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import {
  asyncAssertImage,
  asyncAssertScreenshot,
} from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../common/normalize_body";

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "CreatePersonaPageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: absolute; top: 0; left: 0;`,
      });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Render_InputName_ChooseFile_CreateSucceeded";
      private cut: CreatePersonaPage;
      public async execute() {
        // Prepare
        let mockWebServiceClient = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        await setViewport(800, 800);

        // Execute
        this.cut = new CreatePersonaPage(
          mockWebServiceClient,
          LOCAL_PERSONA_STORAGE
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.menuBody);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_persona_page_render.png"),
          path.join(__dirname, "/golden/create_persona_page_render.png"),
          path.join(__dirname, "/create_persona_page_render_diff.png"),
          {
            fullPage: true,
          }
        );

        // Execute
        this.cut.editPersonaPage.nameInput.value = "Some name";
        this.cut.editPersonaPage.nameInput.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_persona_page_name_input.png"),
          path.join(__dirname, "/golden/create_persona_page_name_input.png"),
          path.join(__dirname, "/create_persona_page_name_input_diff.png"),
          {
            fullPage: true,
          }
        );

        // Execute
        supplyFiles(
          () => this.cut.editPersonaPage.chooseFileButton.click(),
          wideImage
        );
        await new Promise<void>((resolve) =>
          this.cut.editPersonaPage.once("imageLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_persona_page_choose_image.png"),
          path.join(__dirname, "/golden/create_persona_page_choose_image.png"),
          path.join(__dirname, "/create_persona_page_choose_image_diff.png"),
          {
            fullPage: true,
          }
        );

        // Prepare
        mockWebServiceClient.send = async (request) => {
          switch (request.descriptor) {
            case UPLOAD_PERSONA_IMAGE:
              let fileData = await new Promise<string>((resolve) => {
                let reader = new FileReader();
                reader.onloadend = () => {
                  resolve(reader.result as string);
                };
                reader.readAsBinaryString(request.body);
              });
              await writeFile(
                path.join(__dirname, "/create_persona_page_uploaded_image.png"),
                fileData
              );
              return {
                imagePath: "/uploaded_image_path",
              } as UploadPersonaImageResponse;
            case CREATE_PERSONA:
              assertThat(
                request.body,
                eqMessage(
                  {
                    imagePath: "/uploaded_image_path",
                    name: "Some name",
                  },
                  CREATE_PERSONA_REQUEST_BODY
                ),
                "Create persona request"
              );
              return { id: "new id" } as CreatePersonaResponse;
            default:
              throw new Error("Unexpected");
          }
        };

        // Execute
        this.cut.editPersonaPage.submitButton.click();
        await new Promise<void>((resolve) => this.cut.once("created", resolve));

        // Verify
        assertThat(
          LOCAL_PERSONA_STORAGE.read(),
          eq("new id"),
          "created persona id"
        );
        await asyncAssertImage(
          path.join(__dirname, "/create_persona_page_uploaded_image.png"),
          path.join(
            __dirname,
            "/golden/create_persona_page_uploaded_image.png"
          ),
          path.join(__dirname, "/create_persona_page_uploaded_image_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
