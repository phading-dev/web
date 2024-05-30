import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { CommentsCard } from "./body";
import { CommentEntryMock } from "./comment_entry_mock";
import {
  COMMENT,
  Comment,
} from "@phading/comment_service_interface/show_app/comment";
import {
  POST_COMMENT,
  POST_COMMENT_REQUEST_BODY,
  PostCommentResponse,
} from "@phading/comment_service_interface/show_app/web/interface";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  keyboardDown,
  keyboardType,
  mouseMove,
  mouseWheel,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import "../../../../../common/normalize_body";

let SAMPLE_COMMENT: Comment = {
  author: {
    avatarSmallPath: userImage,
    naturalName: "First Second",
  },
  content: "Some some some comment comment comment comment comment",
};

function repeatString(base: string, times: number): string {
  let arr = new Array<string>();
  for (let i = 0; i < times; i++) {
    arr.push(base);
  }
  return arr.join("");
}

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "CommentsCardTest",
  environment: {
    setUp() {
      container = E.div({
        style: "width: 100vw; height: 100vh; display: flex;",
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "AddComments_ScrollToBottom_AddMore_ScrollToTop";
      private cut: CommentsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        this.cut = new CommentsCard(
          new WebServiceClientMock(),
          (comment) => new CommentEntryMock(comment),
          "id1",
        ).show();

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_default.png"),
          path.join(__dirname, "/golden/comments_card_default.png"),
          path.join(__dirname, "/comments_card_default_diff.png"),
        );

        // Execute
        this.cut.addComments([SAMPLE_COMMENT]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_add_one_comment.png"),
          path.join(__dirname, "/golden/comments_card_add_one_comment.png"),
          path.join(__dirname, "/comments_card_add_one_comment_diff.png"),
        );

        // Execute
        let comments = new Array<Comment>();
        for (let i = 0; i < 10; i++) {
          comments.push(SAMPLE_COMMENT);
        }
        this.cut.addComments(comments);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_add_10_comments.png"),
          path.join(__dirname, "/golden/comments_card_add_10_comments.png"),
          path.join(__dirname, "/comments_card_add_10_comments_diff.png"),
        );

        // Execute
        await mouseMove(100, 200, 1);
        await mouseWheel(100, 300);
        await mouseMove(0, 0, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_scroll_to_bottom.png"),
          path.join(__dirname, "/golden/comments_card_scroll_to_bottom.png"),
          path.join(__dirname, "/comments_card_scroll_to_bottom_diff.png"),
        );

        // Execute
        this.cut.addComments([SAMPLE_COMMENT]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_prepend_one_comment.png"),
          path.join(__dirname, "/golden/comments_card_scroll_to_bottom.png"),
          path.join(__dirname, "/comments_card_prepend_one_comment_diff.png"),
        );

        // Execute
        this.cut.scrollToTopButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_scroll_to_top.png"),
          path.join(__dirname, "/golden/comments_card_add_10_comments.png"),
          path.join(__dirname, "/comments_card_scroll_to_top_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(0, 0, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "AddTooManyAndDeleteComments";
      private cut: CommentsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        this.cut = new CommentsCard(
          new WebServiceClientMock(),
          (comment) => new CommentEntryMock(comment),
          "id1",
        ).show();
        container.append(this.cut.body);

        let comments = new Array<Comment>();
        for (let i = 0; i < 100; i++) {
          comments.push(SAMPLE_COMMENT);
        }
        this.cut.addComments(comments);
        let scrollHeightBaseline = this.cut.scrollingArea.val.scrollHeight;

        // Execute
        this.cut.addComments(comments);

        // Verify
        assertThat(
          this.cut.scrollingArea.val.scrollHeight,
          eq(scrollHeightBaseline),
          "Same scroll height",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PostComment_Valid_Invalid_PostError_PostSuccess";
      private cut: CommentsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let currentTimestamp = 123456;
        let webServiceClientMock =
          new (class extends WebServiceClientMock {})();
        this.cut = new CommentsCard(
          webServiceClientMock,
          (comment) => new CommentEntryMock(comment),
          "id1",
        )
          .show()
          .setCallbackToGetTimestamp(() => currentTimestamp);
        container.append(this.cut.body);

        // Execute
        this.cut.commentInput.val.value = "";
        this.cut.commentInput.val.focus();
        await keyboardType("some content");
        this.cut.commentInput.val.blur();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_valid_comment_input.png"),
          path.join(__dirname, "/golden/comments_card_valid_comment_input.png"),
          path.join(__dirname, "/comments_card_valid_comment_input_diff.png"),
        );

        // Execute
        this.cut.commentInput.val.value = "";
        this.cut.commentInput.val.focus();
        await keyboardType(repeatString("some content", 30));
        this.cut.commentInput.val.blur();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_invalid_comment_input.png"),
          path.join(
            __dirname,
            "/golden/comments_card_invalid_comment_input.png",
          ),
          path.join(__dirname, "/comments_card_invalid_comment_input_diff.png"),
        );

        // Prepare
        let requestCaptured: any;
        webServiceClientMock.send = async (
          request: any,
        ): Promise<PostCommentResponse> => {
          requestCaptured = request;
          throw new Error("fake error");
        };

        // Execute
        this.cut.commentInput.val.value = "";
        this.cut.commentInput.val.focus();
        await keyboardType("some content");
        this.cut.commentInput.val.blur();
        this.cut.commentButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("commentError", resolve),
        );

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(POST_COMMENT),
          "Post comment service",
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              content: "some content",
              showId: "id1",
              timestamp: currentTimestamp,
            },
            POST_COMMENT_REQUEST_BODY,
          ),
          "posting comment",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_failed_to_post_commet.png"),
          path.join(__dirname, "/golden/comments_card_valid_comment_input.png"),
          path.join(__dirname, "/comments_card_failed_to_post_commet_diff.png"),
        );

        // Prepare
        webServiceClientMock.send = async (): Promise<PostCommentResponse> => {
          return {
            comment: {
              commentId: "cid1",
            },
          };
        };
        let postedCommentPromise = new Promise<Comment>((resolve) =>
          this.cut.once("commented", (comment) => resolve(comment)),
        );

        // Execute
        this.cut.commentInput.val.focus();
        await keyboardDown("Enter");
        this.cut.commentInput.val.blur();

        // Verify
        assertThat(
          await postedCommentPromise,
          eqMessage(
            {
              commentId: "cid1",
            },
            COMMENT,
          ),
          "posted comment",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_posted_commet.png"),
          path.join(__dirname, "/golden/comments_card_posted_commet.png"),
          path.join(__dirname, "/comments_card_posted_commet_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
