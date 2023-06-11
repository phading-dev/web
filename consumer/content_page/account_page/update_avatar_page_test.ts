import nonImageFile = require("./test_data/non_image.bin");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { UpdateAvatarPage } from "./update_avatar_page";
import { UploadAvatarResponse } from "@phading/user_service_interface/interface";
import { E } from "@selfage/element/factory";
import {
  setViewport,
  supplyFiles,
  writeFile,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref } from "@selfage/ref";
import {
  asyncAssertImage,
  asyncAssertScreenshot,
} from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../common/normalize_body";

let container: HTMLDivElement;
let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "UpdateAvatarPageTest",
  environment: {
    setUp: () => {
      let containerRef = new Ref<HTMLDivElement>();
      let menuContainerRef = new Ref<HTMLDivElement>();
      document.body.appendChild(
        E.divRef(
          containerRef,
          {},
          E.divRef(menuContainerRef, {
            style: `position: fixed;`,
          })
        )
      );
      container = containerRef.val;
      menuContainer = menuContainerRef.val;
    },
    tearDown: () => {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Render_Load_Resize";
      private cut: UpdateAvatarPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);

        // Execute
        this.cut = new UpdateAvatarPage(undefined);
        container.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_render.png"),
          path.join(__dirname, "/golden/update_avatar_page_render.png"),
          path.join(__dirname, "/update_avatar_page_render_diff.png")
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_scroll_to_bottom.png"),
          path.join(
            __dirname,
            "/golden/update_avatar_page_scroll_to_bottom.png"
          ),
          path.join(__dirname, "/update_avatar_page_scroll_to_bottom_diff.png")
        );

        // Execute
        supplyFiles(() => this.cut.chooseFileButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_loaded.png"),
          path.join(__dirname, "/golden/update_avatar_page_loaded.png"),
          path.join(__dirname, "/update_avatar_page_loaded_diff.png")
        );

        // Execute
        this.cut.imageCropper.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 10,
            clientY: 10,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_moved_resized.png"),
          path.join(__dirname, "/golden/update_avatar_page_moved_resized.png"),
          path.join(__dirname, "/update_avatar_page_moved_resized_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LoadError";
      private cut: UpdateAvatarPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 900);
        this.cut = new UpdateAvatarPage(undefined);
        container.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        // Execute
        supplyFiles(() => this.cut.chooseFileButton.click(), nonImageFile);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_load_error.png"),
          path.join(__dirname, "/golden/update_avatar_page_load_error.png"),
          path.join(__dirname, "/update_avatar_page_load_error_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Upload";
      private cut: UpdateAvatarPage;
      public async execute() {
        // Prepare
        let clientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        await setViewport(1000, 1200);
        this.cut = new UpdateAvatarPage(clientMock);
        container.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        supplyFiles(() => this.cut.chooseFileButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve)
        );

        clientMock.send = () => {
          throw new Error("upload error");
        };

        // Execute
        this.cut.uploadButton.click();
        await new Promise<void>((resolve) =>
          this.cut.uploadButton.once("postAction", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_upload_error.png"),
          path.join(__dirname, "/golden/update_avatar_page_upload_error.png"),
          path.join(__dirname, "/update_avatar_page_upload_error_diff.png")
        );

        // Prepare
        clientMock.send = async (request) => {
          let toBeSent = await new Promise<string>((resolve) => {
            let fileReader = new FileReader();
            fileReader.onload = () => {
              resolve(fileReader.result as string);
            };
            fileReader.readAsBinaryString(request.body as Blob);
          });
          await writeFile(
            path.join(__dirname, "/update_avatar_page_uploaded_image.png"),
            toBeSent
          );
          return {} as UploadAvatarResponse;
        };

        // Execute
        this.cut.uploadButton.click();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertImage(
          path.join(__dirname, "/update_avatar_page_uploaded_image.png"),
          path.join(__dirname, "/golden/update_avatar_page_uploaded_image.png"),
          path.join(__dirname, "/update_avatar_page_uploaded_image_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    {
      name: "Back",
      execute: () => {
        // Prepare
        let cut = new UpdateAvatarPage(undefined);
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
