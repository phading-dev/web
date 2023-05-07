import nonImageFile = require("./test_data/text.bin");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { ImageCropper } from "../../common/image_cropper/container";
import { normalizeBody } from "../../common/normalize_body";
import { EditPersonaPage } from "./edit_persona_page";
import { E } from "@selfage/element/factory";
import { supplyFiles, writeFile } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import {
  asyncAssertImage,
  asyncAssertScreenshot,
} from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "EditPersonaPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Render_NameTooLong_ChooseFile_CreateFailed_CreateSucceeded";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let submitActionFn: (
          nameInput: HTMLInputElement,
          imageCropper: ImageCropper
        ) => Promise<void>;
        let cut = new EditPersonaPage(
          (validInputs) => {
            return validInputs.size == 2;
          },
          (nameInput, imageCropper) => submitActionFn(nameInput, imageCropper),
          E.div({
            style: `font-size: 1.4rem;`
          }, E.text("Name your persona")),
          "Choose an image",
          "Submit"
        );
        this.container = E.div({}, cut.body);
        document.body.append(this.container);

        // Execute
        cut.show();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/edit_persona_page_render.png"),
          path.join(__dirname, "/golden/edit_persona_page_render.png"),
          path.join(__dirname, "/edit_persona_page_render_diff.png"),
          {
            fullPage: true,
          }
        );

        // Execute
        let str = new Array<string>();
        for (let i = 0; i < 81; i++) {
          str.push("0");
        }
        cut.nameInput.value = str.join("");
        cut.nameInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/edit_persona_page_name_too_long.png"),
          path.join(__dirname, "/golden/edit_persona_page_name_too_long.png"),
          path.join(__dirname, "/edit_persona_page_name_too_long_diff.png"),
          {
            fullPage: true,
          }
        );

        // Execute
        cut.nameInput.value = "shorter name";
        cut.nameInput.dispatchEvent(new KeyboardEvent("input"));
        supplyFiles(() => cut.chooseFileButton.click(), nonImageFile);
        await new Promise<void>((resolve) => cut.once("imageLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/edit_persona_page_choose_non_image.png"),
          path.join(
            __dirname,
            "/golden/edit_persona_page_choose_non_image.png"
          ),
          path.join(__dirname, "/edit_persona_page_choose_non_image_diff.png"),
          {
            fullPage: true,
          }
        );

        // Execute
        supplyFiles(() => cut.chooseFileButton.click(), wideImage);
        await new Promise<void>((resolve) => cut.once("imageLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/edit_persona_page_choose_image.png"),
          path.join(__dirname, "/golden/edit_persona_page_choose_image.png"),
          path.join(__dirname, "/edit_persona_page_choose_image_diff.png"),
          {
            fullPage: true,
          }
        );

        // Prepare
        submitActionFn = async () => {
          throw new Error("fake error");
        };

        // Execute
        cut.submitButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/edit_persona_page_submit_error.png"),
          path.join(__dirname, "/golden/edit_persona_page_submit_error.png"),
          path.join(__dirname, "/edit_persona_page_submit_error_diff.png"),
          {
            fullPage: true,
          }
        );

        // Prepare
        submitActionFn = async (nameInput, imageCropper) => {
          assertThat(
            nameInput.value,
            eq("shorter name"),
            `Name input when submit`
          );
          let croppedImage = await imageCropper.export();
          let fileData = await new Promise<string>((resolve) => {
            let reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsBinaryString(croppedImage);
          });
          await writeFile(
            path.join(__dirname, "/edit_persona_page_cropped_image.png"),
            fileData
          );
        };

        // Execute
        cut.submitButton.click();
        await new Promise<void>((resolve) => cut.once("done", resolve));

        // Verify
        await asyncAssertImage(
          path.join(__dirname, "/edit_persona_page_cropped_image.png"),
          path.join(__dirname, "/golden/edit_persona_page_cropped_image.png"),
          path.join(__dirname, "/edit_persona_page_cropped_image_diff.png")
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/edit_persona_page_submit_success.png"),
          path.join(__dirname, "/golden/edit_persona_page_submit_success.png"),
          path.join(__dirname, "/edit_persona_page_submit_success_diff.png"),
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
