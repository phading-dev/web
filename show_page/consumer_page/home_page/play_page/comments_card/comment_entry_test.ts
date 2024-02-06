import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { CommentEntry } from "./comment_entry";
import { Liking } from "@phading/comment_service_interface/show_app/comment";
import {
  LIKE_COMMENT,
  LIKE_COMMENT_REQUEST_BODY,
  LikeCommentResponse,
} from "@phading/comment_service_interface/show_app/web/interface";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  deleteFile,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "CommentEntryTest",
  environment: {
    setUp() {
      container = E.div({
        style: `margin-top: 5rem;`,
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_ShowActions_ShowTooltip_Dislike";
      private cut: CommentEntry;
      public async execute() {
        // Prepare
        await setViewport(300, 200);
        let requestCaptured: any;
        this.cut = new CommentEntry(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<LikeCommentResponse> {
              requestCaptured = request;
              return {};
            }
          })(),
          () => 0,
          () => {},
          {
            commentId: "id1",
            author: {
              naturalName: "First Second",
              avatarSmallPath: userImage,
            },
            content: "Some some content",
            liking: Liking.NEUTRAL,
          }
        );

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_default.png"),
          path.join(__dirname, "/golden/comment_entry_default.png"),
          path.join(__dirname, "/comment_entry_default_diff.png")
        );

        // Execute
        this.cut.hover();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_show_actions.png"),
          path.join(__dirname, "/golden/comment_entry_show_actions.png"),
          path.join(__dirname, "/comment_entry_show_actions_diff.png")
        );

        // Execute
        this.cut.likeDislikeButtons.thumbDownButton.hover();
        await new Promise<void>((resolve) =>
          this.cut.likeDislikeButtons.thumbDownButton.once(
            "tooltipShowed",
            resolve
          )
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_show_tooltip.png"),
          path.join(__dirname, "/golden/comment_entry_show_tooltip.png"),
          path.join(__dirname, "/comment_entry_show_tooltip_diff.png")
        );

        // Execute
        this.cut.likeDislikeButtons.thumbDownButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("postLike", resolve)
        );

        // Verify
        assertThat(requestCaptured.descriptor, eq(LIKE_COMMENT), "service");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              commentId: "id1",
              liking: Liking.DISLIKE,
            },
            LIKE_COMMENT_REQUEST_BODY
          ),
          "request body"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_disliked.png"),
          path.join(__dirname, "/golden/comment_entry_disliked.png"),
          path.join(__dirname, "/comment_entry_disliked_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LongContent";
      private cut: CommentEntry;
      public async execute() {
        // Prepare
        await setViewport(300, 200);
        this.cut = new CommentEntry(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
          })(),
          () => 0,
          () => {},
          {
            author: {
              naturalName:
                "First Second First Second First Second First Second First Second",
              avatarSmallPath: userImage,
            },
            content:
              "Some some content Some some content Some some content Some some content Some some content",
            liking: Liking.NEUTRAL,
          }
        );

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_long.png"),
          path.join(__dirname, "/golden/comment_entry_long.png"),
          path.join(__dirname, "/comment_entry_long_diff.png")
        );

        // Execute
        this.cut.hover();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_long_show_actions.png"),
          path.join(__dirname, "/golden/comment_entry_long_show_actions.png"),
          path.join(__dirname, "/comment_entry_long_show_actions_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Hover_Leave";
      private cut: CommentEntry;
      public async execute() {
        // Prepare
        await setViewport(300, 200);
        let callbackCaptured: any;
        let delayCaptured: any;
        let timeoutId = 1;
        let idCaptured: number;
        this.cut = new CommentEntry(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
          })(),
          (callback, delay) => {
            callbackCaptured = callback;
            delayCaptured = delay;
            return timeoutId;
          },
          (id) => {
            idCaptured = id;
          },
          {
            author: {
              naturalName: "First Second",
              avatarSmallPath: userImage,
            },
            content: "Some some content",
            liking: Liking.NEUTRAL,
          }
        );
        container.append(this.cut.body);
        await screenshot(
          path.join(__dirname, "/comment_entry_hover_leave_baseline.png")
        );

        // Execute
        this.cut.hover();
        await new Promise<void>((resolve) =>
          this.cut.once("actionsTransitionEnded", resolve)
        );

        // Execute
        assertThat(delayCaptured, eq(3000), "delay");

        // Execute
        this.cut.leave();
        await new Promise<void>((resolve) =>
          this.cut.once("actionsTransitionEnded", resolve)
        );

        // Verify
        assertThat(idCaptured, eq(1), "cancelled timeout 1");
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_hide_actions.png"),
          path.join(__dirname, "/comment_entry_hover_leave_baseline.png"),
          path.join(__dirname, "/comment_entry_hide_actions_diff.png")
        );

        // Prepare
        timeoutId = 2;
        this.cut.hover();
        await new Promise<void>((resolve) =>
          this.cut.once("actionsTransitionEnded", resolve)
        );
        timeoutId = 3;

        // Execute
        this.cut.body.dispatchEvent(new PointerEvent("pointermove"));

        // Verify
        assertThat(idCaptured, eq(2), "cancelled timeout 2");

        // Execute
        callbackCaptured();
        await new Promise<void>((resolve) =>
          this.cut.once("actionsTransitionEnded", resolve)
        );

        // Verify
        assertThat(idCaptured, eq(3), "cancelled timeout 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_auto_hide_actions.png"),
          path.join(__dirname, "/comment_entry_hover_leave_baseline.png"),
          path.join(__dirname, "/comment_entry_auto_hide_actions_diff.png")
        );

        // Cleanup
        await deleteFile(
          path.join(__dirname, "/comment_entry_hover_leave_baseline.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
