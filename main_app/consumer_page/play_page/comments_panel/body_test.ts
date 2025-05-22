import userImage = require("../../common/test_data/user_image.jpg");
import userImage2 = require("../../common/test_data/user_image2.png");
import path from "path";
import { SCHEME } from "../../../../common/color_scheme";
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { CommentWithAuthor } from "../common/comment_with_author";
import { CommentsPanel } from "./body";
import {
  POST_COMMENT,
  POST_COMMENT_REQUEST_BODY,
  PostCommentResponse,
} from "@phading/comment_service_interface/show/web/author/interface";
import {
  COMMENT,
  Comment,
} from "@phading/comment_service_interface/show/web/comment";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "CommentsPanelTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_AddedComments_Cleared_AddedCommentsOverflowed";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 35rem; background-color: ${SCHEME.neutral4}; padding: 1rem;`,
        });
        document.body.appendChild(this.container);
        let serviceClientMock = new WebServiceClientMock();
        let cut = new CommentsPanel(
          serviceClientMock,
          "width: 100%;",
          "season1",
          "episode1",
        );

        // Execute
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_default.png"),
          path.join(__dirname, "/golden/comments_panel_default.png"),
          path.join(__dirname, "/comments_panel_default_diff.png"),
        );

        // Execute
        cut.add([
          {
            comment: {
              content: "Some some content",
              pinnedVideoTimeMs: 1000,
            },
            author: {
              naturalName: "First Second",
              avatarSmallUrl: userImage,
            },
          },
          {
            comment: {
              content: "Another comment",
              pinnedVideoTimeMs: 2000,
            },
            author: {
              naturalName: "Third Fourth",
              avatarSmallUrl: userImage2,
            },
          },
          {
            comment: {
              content: "Yet another comment",
              pinnedVideoTimeMs: 3000,
            },
            author: {
              naturalName: "Fifth Sixth",
              avatarSmallUrl: userImage,
            },
          },
          {
            comment: {
              content: "Final comment",
              pinnedVideoTimeMs: 4000,
            },
            author: {
              naturalName: "Seventh Eighth",
              avatarSmallUrl: userImage2,
            },
          },
        ]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_a_few_comments.png"),
          path.join(__dirname, "/golden/comments_panel_a_few_comments.png"),
          path.join(__dirname, "/comments_panel_a_few_comments_diff.png"),
        );

        // Execute
        cut.clear();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_cleared.png"),
          path.join(__dirname, "/golden/comments_panel_default.png"),
          path.join(__dirname, "/comments_panel_cleared_diff.png"),
        );

        // Execute
        cut.add([
          ...Array.from(
            { length: 31 },
            (_, i): CommentWithAuthor => ({
              comment: {
                content: `Comment number ${i + 1}`,
                pinnedVideoTimeMs: (i + 5) * 1000,
              },
              author: {
                naturalName: `Author ${i + 1}`,
                avatarSmallUrl: i % 2 === 0 ? userImage : userImage2,
              },
            }),
          ),
        ]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_comments_overflowed.png"),
          path.join(
            __dirname,
            "/golden/comments_panel_comments_overflowed.png",
          ),
          path.join(__dirname, "/comments_panel_comments_overflowed_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/comments_panel_comments_overflowed_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/comments_panel_comments_overflowed_scrolled.png",
          ),
          path.join(
            __dirname,
            "/comments_panel_comments_overflowed_scrolled_diff.png",
          ),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdatePinnedVideoTimeMs_PostComment";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 60rem; background-color: ${SCHEME.neutral4}; padding: 1rem;`,
        });
        document.body.appendChild(this.container);
        let serviceClientMock = new WebServiceClientMock();
        let cut = new CommentsPanel(
          serviceClientMock,
          "width: 100%;",
          "season1",
          "episode1",
        );
        this.container.append(cut.body);

        // Execute
        cut.setPinnedVideoTimeMs(23100);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_pinned_video_time.png"),
          path.join(__dirname, "/golden/comments_panel_pinned_video_time.png"),
          path.join(__dirname, "/comments_panel_pinned_video_time_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        cut.commentInput.val.value = "Test comment";
        cut.commentInput.val.dispatchEvent(new Event("input"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_valid_comment_input.png"),
          path.join(
            __dirname,
            "/golden/comments_panel_valid_comment_input.png",
          ),
          path.join(__dirname, "/comments_panel_valid_comment_input_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        cut.commentInput.val.value =
          "This is a very long string that exceeds the 140-character limit to test the validation functionality of the comment input field in the CommentsPanel component.";
        cut.commentInput.val.dispatchEvent(new Event("input"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_invalid_comment_input.png"),
          path.join(
            __dirname,
            "/golden/comments_panel_invalid_comment_input.png",
          ),
          path.join(
            __dirname,
            "/comments_panel_invalid_comment_input_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Prepare
        cut.setCallbackToGetVideoTimeMs(() => 123400);
        serviceClientMock.error = new Error("Fake error");

        // Execute
        cut.commentInput.val.value = "Test comment 2";
        cut.commentInput.val.dispatchEvent(new Event("input"));
        cut.commentButton.val.click();
        await new Promise<void>((resolve) =>
          cut.once("postCommentDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(POST_COMMENT),
          "PostComment",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              content: "Test comment 2",
              pinnedVideoTimeMs: 123400,
            },
            POST_COMMENT_REQUEST_BODY,
          ),
          "PostComment body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_post_comment_error.png"),
          path.join(__dirname, "/golden/comments_panel_post_comment_error.png"),
          path.join(__dirname, "/comments_panel_post_comment_error_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        let comment: Comment;
        cut.on("commented", (comment_) => {
          comment = comment_;
        });
        serviceClientMock.error = undefined;
        serviceClientMock.response = {
          comment: {
            commentId: "commentId",
          },
        } as PostCommentResponse;

        // Execute
        cut.commentInput.val.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter" }),
        );
        await new Promise<void>((resolve) =>
          cut.once("postCommentDone", resolve),
        );

        // Verify
        assertThat(
          comment,
          eqMessage(
            {
              commentId: "commentId",
            },
            COMMENT,
          ),
          "returned comment",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/comments_panel_post_comment_success.png"),
          path.join(
            __dirname,
            "/golden/comments_panel_post_comment_success.png",
          ),
          path.join(__dirname, "/comments_panel_post_comment_success_diff.png"),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
