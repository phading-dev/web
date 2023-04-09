import nonImageFile = require("./test_data/non_image.bin");
import wideImage = require("./test_data/wide.jpeg");
import { normalizeBody } from "../../common/normalize_body";
import { ChangeAvatarTab } from "./change_avatar_tab";
import { Counter } from "@selfage/counter";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import { WebServiceClient } from "@selfage/web_service_client";

normalizeBody();

TEST_RUNNER.run({
  name: "ChangeAvatarTabTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        let cut = new ChangeAvatarTab(undefined).show();
        this.container = E.div(
          {},
          E.div(
            {
              style: `position: fixed;`,
            },
            cut.prependMenuBody
          ),
          E.div({}, cut.body)
        );
        document.body.style.width = "1000px";
        document.body.appendChild(this.container);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/change_avatar_tab_render.png",
          __dirname + "/golden/change_avatar_tab_render.png",
          __dirname + "/change_avatar_tab_render_diff.png",
          { fullPage: true }
        );

        // Execute
        await puppeteerWaitForFileChooser();
        cut.chooseFileButton.click();
        puppeteerFileChooserAccept(wideImage);
        await new Promise<void>((resolve) => cut.once("imageLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/change_avatar_tab_loaded.png",
          __dirname + "/golden/change_avatar_tab_loaded.png",
          __dirname + "/change_avatar_tab_loaded_diff.png",
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
          __dirname + "/change_avatar_tab_moved_resized.png",
          __dirname + "/golden/change_avatar_tab_moved_resized.png",
          __dirname + "/change_avatar_tab_moved_resized_diff.png",
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
          {},
          E.div(
            {
              style: `position: fixed;`,
            },
            cut.prependMenuBody
          ),
          E.div({}, cut.body)
        );
        document.body.style.width = "1000px";
        document.body.appendChild(this.container);

        // Execute
        await puppeteerWaitForFileChooser();
        cut.chooseFileButton.click();
        puppeteerFileChooserAccept(nonImageFile);
        await new Promise<void>((resolve) => cut.once("imageLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/change_avatar_tab_load_error.png",
          __dirname + "/golden/change_avatar_tab_load_error.png",
          __dirname + "/change_avatar_tab_load_error_diff.png",
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
                await puppeteerWriteFile(
                  __dirname + "/change_avatar_uploaded_image.png",
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
          {},
          E.div(
            {
              style: `position: fixed;`,
            },
            cut.prependMenuBody
          ),
          E.div({}, cut.body)
        );
        document.body.style.width = "1000px";
        document.body.appendChild(this.container);

        await puppeteerWaitForFileChooser();
        cut.chooseFileButton.click();
        puppeteerFileChooserAccept(wideImage);
        await new Promise<void>((resolve) => cut.once("imageLoaded", resolve));

        // Execute
        await cut.uploadButton.click();

        // Verify
        assertThat(clientMock.counter.get("send"), eq(1), "send times");
        await asyncAssertScreenshot(
          __dirname + "/change_avatar_tab_upload_error.png",
          __dirname + "/golden/change_avatar_tab_upload_error.png",
          __dirname + "/change_avatar_tab_upload_error_diff.png",
          { fullPage: true }
        );

        // Execute
        await cut.uploadButton.click();

        // Verify
        assertThat(clientMock.counter.get("send"), eq(2), "send times");
        await asyncAssertScreenshot(
          __dirname + "/change_avatar_tab_upload_success.png",
          __dirname + "/golden/change_avatar_tab_upload_success.png",
          __dirname + "/change_avatar_tab_upload_success_diff.png",
          { fullPage: true }
        );
        {
          let actual = await puppeteerReadFile(
            __dirname + "/change_avatar_uploaded_image.png",
            "binary"
          );
          let expected = await puppeteerReadFile(
            __dirname + "/golden/change_avatar_uploaded_image.png",
            "binary"
          );
          assertThat(actual, eq(expected), "uploaded image");
        }

        // Cleanup
        await puppeteerDeleteFile(
          __dirname + "/change_avatar_uploaded_image.png"
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
