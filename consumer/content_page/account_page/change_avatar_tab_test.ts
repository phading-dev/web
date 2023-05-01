import nonImageFile = require("./test_data/non_image.bin");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { ChangeAvatarTab } from "./change_avatar_tab";
import { Counter } from "@selfage/counter";
import { E } from "@selfage/element/factory";
import { supplyFiles, writeFile } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import {
  asyncAssertImage,
  asyncAssertScreenshot,
} from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";

normalizeBody();

TEST_RUNNER.run({
  name: "ChangeAvatarTabTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new ChangeAvatarTab(undefined).show();
        this.container = E.div(
          { style: `width: 100rem;` },
          E.div(
            {
              style: `position: fixed;`,
            },
            cut.prependMenuBody
          ),
          E.div({}, cut.body)
        );
        document.body.appendChild(this.container);

        // Execute
        cut.show();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_avatar_tab_render.png"),
          path.join(__dirname, "/golden/change_avatar_tab_render.png"),
          path.join(__dirname, "/change_avatar_tab_render_diff.png"),
          { fullPage: true }
        );

        // Execute
        supplyFiles(() => cut.chooseFileButton.click(), wideImage);
        await new Promise<void>((resolve) => cut.once("imageLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_avatar_tab_loaded.png"),
          path.join(__dirname, "/golden/change_avatar_tab_loaded.png"),
          path.join(__dirname, "/change_avatar_tab_loaded_diff.png"),
          { fullPage: true }
        );

        // Execute
        cut.imageCropper.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 10,
            clientY: 10,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_avatar_tab_moved_resized.png"),
          path.join(__dirname, "/golden/change_avatar_tab_moved_resized.png"),
          path.join(__dirname, "/change_avatar_tab_moved_resized_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LoadError";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new ChangeAvatarTab(undefined).show();
        this.container = E.div(
          { style: `width: 100rem;` },
          E.div(
            {
              style: `position: fixed;`,
            },
            cut.prependMenuBody
          ),
          E.div({}, cut.body)
        );
        document.body.appendChild(this.container);
        cut.show();

        // Execute
        supplyFiles(() => cut.chooseFileButton.click(), nonImageFile);
        await new Promise<void>((resolve) => cut.once("imageLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_avatar_tab_load_error.png"),
          path.join(__dirname, "/golden/change_avatar_tab_load_error.png"),
          path.join(__dirname, "/change_avatar_tab_load_error_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Upload";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let clientMock = new (class extends WebServiceClient {
          public counter = new Counter<string>();
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            switch (this.counter.increment("send")) {
              case 1:
                throw new Error("upload error");
              case 2:
                let toBeSent = await new Promise<string>((resolve) => {
                  let fileReader = new FileReader();
                  fileReader.onload = () => {
                    resolve(fileReader.result as string);
                  };
                  fileReader.readAsBinaryString(request.body as Blob);
                });
                await writeFile(
                  path.join(__dirname, "/change_avatar_uploaded_image.png"),
                  toBeSent
                );
                break;
              default:
                throw new Error("Not reachable.");
            }
          }
        })();
        let cut = new ChangeAvatarTab(clientMock).show();
        this.container = E.div(
          { style: `width: 100rem;` },
          E.div(
            {
              style: `position: fixed;`,
            },
            cut.prependMenuBody
          ),
          E.div({}, cut.body)
        );
        document.body.appendChild(this.container);
        cut.show();

        supplyFiles(() => cut.chooseFileButton.click(), wideImage);
        await new Promise<void>((resolve) => cut.once("imageLoaded", resolve));

        // Execute
        await cut.uploadButton.click();

        // Verify
        assertThat(clientMock.counter.get("send"), eq(1), "send times");
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_avatar_tab_upload_error.png"),
          path.join(__dirname, "/golden/change_avatar_tab_upload_error.png"),
          path.join(__dirname, "/change_avatar_tab_upload_error_diff.png"),
          { fullPage: true }
        );

        // Execute
        await cut.uploadButton.click();

        // Verify
        assertThat(clientMock.counter.get("send"), eq(2), "send times");
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_avatar_tab_upload_success.png"),
          path.join(__dirname, "/golden/change_avatar_tab_upload_success.png"),
          path.join(__dirname, "/change_avatar_tab_upload_success_diff.png"),
          { fullPage: true }
        );
        await asyncAssertImage(
          path.join(__dirname, "/change_avatar_uploaded_image.png"),
          path.join(__dirname, "/golden/change_avatar_uploaded_image.png"),
          path.join(__dirname, "/change_avatar_uploaded_image_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    {
      name: "Back",
      execute: () => {
        // Prepare
        let cut = new ChangeAvatarTab(undefined);
        let isBack = false;
        cut.on("back", () => (isBack = true));

        // Execute
        cut.backMenuItem.click();

        // Verify
        assertThat(isBack, eq(true), "Back");
      },
    },
  ],
});
