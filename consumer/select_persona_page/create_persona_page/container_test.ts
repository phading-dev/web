import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
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
import { supplyFiles, writeFile } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import {
  asyncAssertImage,
  asyncAssertScreenshot,
} from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";

normalizeBody();

TEST_RUNNER.run({
  name: "CreatePersonaPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Render_InputName_ChooseFile_CreateSucceeded";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let mockWebServiceClient = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        let cut = new CreatePersonaPage(mockWebServiceClient);
        this.container = E.div({}, cut.body);
        document.body.append(this.container);

        // Execute
        cut.show();

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
        cut.editPersonaPage.nameInput.value = "Some name";
        cut.editPersonaPage.nameInput.dispatchEvent(new KeyboardEvent("input"));

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
          () => cut.editPersonaPage.chooseFileButton.click(),
          wideImage
        );
        await new Promise<void>((resolve) =>
          cut.editPersonaPage.once("imageLoaded", resolve)
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
        cut.editPersonaPage.submitButton.click();
        await new Promise<void>((resolve) => cut.once("done", resolve));

        // Verify
        await asyncAssertImage(
          path.join(__dirname, "/create_persona_page_uploaded_image.png"),
          path.join(
            __dirname,
            "/golden/create_persona_page_uploaded_image.png"
          ),
          path.join(__dirname, "/create_persona_page_uploaded_image_diff.png")
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_persona_page_submit_success.png"),
          path.join(
            __dirname,
            "/golden/create_persona_page_submit_success.png"
          ),
          path.join(__dirname, "/create_persona_page_submit_success_diff.png"),
          {
            fullPage: true,
          }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
