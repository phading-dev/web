import wideImage = require("./test_data/wide.jpeg");
import { WriteTalePage } from "./container";
import { QuickLayoutEditorMock } from "./quick_layout_editor/container_mock";
import {
  CREATE_TALE_REQUEST_BODY,
  GET_QUICK_TALE_REQUEST_BODY,
  GetQuickTaleResponse,
} from "@phading/tale_service_interface/interface";
import { WarningTagType } from "@phading/tale_service_interface/warning_tag_type";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../common/normalize_body";

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "WriteTalePageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; right: 0; top: 0;`,
      });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "RenderWide_Scroll";
      private cut: WriteTalePage;
      public async execute() {
        // Prepare
        await setViewport(1300, 600);

        // Execute
        this.cut = new WriteTalePage(
          "",
          new QuickLayoutEditorMock(),
          undefined
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_render_wide.png",
          __dirname + "/golden/write_tale_page_render_wide.png",
          __dirname + "/write_tale_page_render_wide_diff.png"
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_render_wide_scroll_to_bottom.png",
          __dirname +
            "/golden/write_tale_page_render_wide_scroll_to_bottom.png",
          __dirname + "/write_tale_page_render_wide_scroll_to_bottom_diff.png"
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderReply";
      private cut: WriteTalePage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);

        // Execute
        this.cut = new WriteTalePage(
          "tale1",
          new QuickLayoutEditorMock(),
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public send(request: any): any {
              assertThat(
                request.body,
                eqMessage(
                  {
                    taleId: "tale1",
                  },
                  GET_QUICK_TALE_REQUEST_BODY
                ),
                "request"
              );
              return {
                card: { text: "some some text", imagePaths: [wideImage] },
              } as GetQuickTaleResponse;
            }
          })()
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_render_reply.png",
          __dirname + "/golden/write_tale_page_render_reply.png",
          __dirname + "/write_tale_page_render_reply_diff.png"
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderAndSubmit";
      private cut: WriteTalePage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let quickLayoutEditorMock = new QuickLayoutEditorMock();
        let requestCaptured: any;
        let serviceClientMock = new (class extends WebServiceClient {
          public errorToThrow: Error;
          public constructor() {
            super(undefined, undefined);
          }
          public send(request: any): any {
            if (this.errorToThrow) {
              throw this.errorToThrow;
            }
            requestCaptured = request;
          }
        })();

        // Execute
        this.cut = new WriteTalePage(
          "",
          quickLayoutEditorMock,
          serviceClientMock
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_render.png",
          __dirname + "/golden/write_tale_page_render.png",
          __dirname + "/write_tale_page_render_diff.png"
        );

        // Execute
        quickLayoutEditorMock.addImage(wideImage);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_upload_first_image.png",
          __dirname + "/golden/write_tale_page_upload_first_image.png",
          __dirname + "/write_tale_page_upload_first_image_diff.png"
        );

        // Execute
        this.cut.tagInput.value = "some tag";
        this.cut.addTagButton.click();
        this.cut.tagInput.value = "tag 2";
        this.cut.addTagButton.click();
        this.cut.tagInput.value = "tag 3";
        this.cut.addTagButton.click();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_add_tags.png",
          __dirname + "/golden/write_tale_page_add_tags.png",
          __dirname + "/write_tale_page_add_tags_diff.png"
        );

        // Execute
        this.cut.tags[0].deleteButton.click();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_remove_tag.png",
          __dirname + "/golden/write_tale_page_remove_tag.png",
          __dirname + "/write_tale_page_remove_tag_diff.png"
        );

        // Execute
        this.cut.warningTagGross.body.click();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_add_warning_tag.png",
          __dirname + "/golden/write_tale_page_add_warning_tag.png",
          __dirname + "/write_tale_page_add_warning_tag_diff.png"
        );

        // Prepare
        serviceClientMock.errorToThrow = new Error("Some error");

        // Execute
        this.cut.submitButton.click();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/write_tale_page_submit_failure.png",
          __dirname + "/golden/write_tale_page_submit_failure.png",
          __dirname + "/write_tale_page_submit_failure_diff.png"
        );

        // Prepare
        serviceClientMock.errorToThrow = undefined;

        // Execute
        this.cut.submitButton.click();
        await new Promise<void>((resolve) => this.cut.once("done", resolve));

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              quickLayout: {
                text: "",
                imagePaths: [wideImage],
              },
              tags: ["tag 2", "tag 3"],
              warningTags: [WarningTagType.Gross],
            },
            CREATE_TALE_REQUEST_BODY
          ),
          "submitTale request"
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
