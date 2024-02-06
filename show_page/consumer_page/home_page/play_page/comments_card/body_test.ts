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
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

let SAMPLE_COMMENT: Comment = {
  author: {
    avatarSmallPath: userImage,
    naturalName: "First Second",
  },
  content: "Some some some comment comment comment",
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
        style: "display: flex; width: 100vw; height: 100vh;",
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Portrait_AddComments_ScrollToBottom_AddMore_ScrollToTop";
      private cut: CommentsCard;
      public async execute() {
        // Prepare
        await setViewport(500, 400);
        container.style.flexFlow = "row nowrap";
        this.cut = new CommentsCard(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
          })(),
          (comment) => new CommentEntryMock(comment),
          "id1"
        );

        // Execute
        this.cut.changeToPortrait();
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_default.png"),
          path.join(__dirname, "/golden/comments_card_default.png"),
          path.join(__dirname, "/comments_card_default_diff.png")
        );

        // Execute
        this.cut.addComment([SAMPLE_COMMENT]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_add_one_comment.png"),
          path.join(__dirname, "/golden/comments_card_add_one_comment.png"),
          path.join(__dirname, "/comments_card_add_one_comment_diff.png")
        );

        // Execute
        let comments = new Array<Comment>();
        for (let i = 0; i < 10; i++) {
          comments.push(SAMPLE_COMMENT);
        }
        this.cut.addComment(comments);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_add_10_comments.png"),
          path.join(__dirname, "/golden/comments_card_add_10_comments.png"),
          path.join(__dirname, "/comments_card_add_10_comments_diff.png")
        );

        // Execute
        this.cut.scrollingArea.scrollTop = this.cut.scrollingArea.scrollHeight;
        this.cut.scrollingArea.dispatchEvent(new Event("scrollend"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_scroll_to_bottom.png"),
          path.join(__dirname, "/golden/comments_card_scroll_to_bottom.png"),
          path.join(__dirname, "/comments_card_scroll_to_bottom_diff.png")
        );

        // Execute
        this.cut.addComment([SAMPLE_COMMENT]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_prepend_one_comment.png"),
          path.join(__dirname, "/golden/comments_card_scroll_to_bottom.png"),
          path.join(__dirname, "/comments_card_prepend_one_comment_diff.png")
        );

        // Execute
        this.cut.scrollToTopButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_scroll_to_top.png"),
          path.join(__dirname, "/golden/comments_card_add_10_comments.png"),
          path.join(__dirname, "/comments_card_scroll_to_top_diff.png")
        );
      }
      public tearDown() {
        container.style.flexFlow = "";
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Landscape_AddComments_ScrollToBottom";
      private cut: CommentsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 800);
        container.style.flexFlow = "column nowrap";
        this.cut = new CommentsCard(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
          })(),
          (comment) => new CommentEntryMock(comment),
          "id1"
        );

        // Execute
        this.cut.changeToLandscape();
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_landscape_narrow.png"),
          path.join(__dirname, "/golden/comments_card_landscape_narrow.png"),
          path.join(__dirname, "/comments_card_landscape_narrow_diff.png")
        );

        // Execute
        this.cut.addComment([SAMPLE_COMMENT]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_landscape_add_one_comment.png"),
          path.join(
            __dirname,
            "/golden/comments_card_landscape_add_one_comment.png"
          ),
          path.join(
            __dirname,
            "/comments_card_landscape_add_one_comment_diff.png"
          )
        );

        // Execute
        let comments = new Array<Comment>();
        for (let i = 0; i < 15; i++) {
          comments.push(SAMPLE_COMMENT);
        }
        this.cut.addComment(comments);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_landscape_add_15_comments.png"),
          path.join(
            __dirname,
            "/golden/comments_card_landscape_add_15_comments.png"
          ),
          path.join(
            __dirname,
            "/comments_card_landscape_add_15_comments_diff.png"
          )
        );

        // Execute
        this.cut.scrollingArea.scrollTop = this.cut.scrollingArea.scrollHeight;
        this.cut.scrollingArea.dispatchEvent(new Event("scrollend"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_landscape_scroll_to_bottom.png"),
          path.join(
            __dirname,
            "/golden/comments_card_landscape_scroll_to_bottom.png"
          ),
          path.join(
            __dirname,
            "/comments_card_landscape_scroll_to_bottom_diff.png"
          )
        );
      }
      public tearDown() {
        container.style.flexFlow = "";
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "AddTooManyAndDeleteComments";
      private cut: CommentsCard;
      public async execute() {
        // Prepare
        await setViewport(500, 400);
        container.style.flexFlow = "row nowrap";
        this.cut = new CommentsCard(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
          })(),
          (comment) => new CommentEntryMock(comment),
          "id1"
        ).changeToPortrait();
        container.append(this.cut.body);

        let comments = new Array<Comment>();
        for (let i = 0; i < 500; i++) {
          comments.push(SAMPLE_COMMENT);
        }
        this.cut.addComment(comments);
        let scrollHeightBaseline = this.cut.scrollingArea.scrollHeight;

        // Execute
        this.cut.addComment(comments);

        // Verify
        assertThat(
          this.cut.scrollingArea.scrollHeight,
          eq(scrollHeightBaseline),
          "Same scroll height"
        );
      }
      public tearDown() {
        container.style.flexFlow = "";
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PostComment_Valid_Invalid_PostError_PostSuccess";
      private cut: CommentsCard;
      public async execute() {
        // Prepare
        await setViewport(500, 400);
        container.style.flexFlow = "row nowrap";
        let currentTimestamp = 123456;
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        this.cut = new CommentsCard(
          webServiceClientMock,
          (comment) => new CommentEntryMock(comment),
          "id1"
        )
          .changeToPortrait()
          .setCallbackToGetTimestamp(() => currentTimestamp);
        container.append(this.cut.body);

        // Execute
        this.cut.commentInput.value = "some content";
        this.cut.commentInput.dispatchEvent(new Event("input"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_valid_comment_input.png"),
          path.join(__dirname, "/golden/comments_card_valid_comment_input.png"),
          path.join(__dirname, "/comments_card_valid_comment_input_diff.png")
        );

        // Execute
        this.cut.commentInput.value = repeatString("some content", 30);
        this.cut.commentInput.dispatchEvent(new Event("input"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_invalid_comment_input.png"),
          path.join(
            __dirname,
            "/golden/comments_card_invalid_comment_input.png"
          ),
          path.join(__dirname, "/comments_card_invalid_comment_input_diff.png")
        );

        // Prepare
        let requestCaptured: any;
        webServiceClientMock.send = async (
          request: any
        ): Promise<PostCommentResponse> => {
          requestCaptured = request;
          throw new Error("fake error");
        };

        // Execute
        this.cut.commentInput.value = "some content";
        this.cut.commentInput.dispatchEvent(new Event("input"));
        this.cut.commentButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("commentError", resolve)
        );

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(POST_COMMENT),
          "Post comment service"
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              content: "some content",
              showId: "id1",
              timestamp: currentTimestamp,
            },
            POST_COMMENT_REQUEST_BODY
          ),
          "posting comment"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_failed_to_post_commet.png"),
          path.join(__dirname, "/golden/comments_card_valid_comment_input.png"),
          path.join(__dirname, "/comments_card_failed_to_post_commet_diff.png")
        );

        // Prepare
        webServiceClientMock.send = async (): Promise<PostCommentResponse> => {
          return {
            comment: {
              commentId: "cid1",
            },
          };
        };

        // Execute
        this.cut.commentInput.dispatchEvent(
          new KeyboardEvent("keydown", {
            code: "Enter",
          })
        );
        let postedComment = await new Promise<Comment>((resolve) =>
          this.cut.once("commented", (comment) => resolve(comment))
        );

        // Verify
        assertThat(
          postedComment,
          eqMessage(
            {
              commentId: "cid1",
            },
            COMMENT
          ),
          "posted comment"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_card_posted_commet.png"),
          path.join(__dirname, "/golden/comments_card_posted_commet.png"),
          path.join(__dirname, "/comments_card_posted_commet_diff.png")
        );
      }
      public tearDown() {
        container.style.flexFlow = "";
        this.cut.remove();
      }
    })(),
  ],
});
