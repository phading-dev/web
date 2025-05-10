import path from "path";
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { CommentWithAuthor } from "../common/comment_with_author";
import { SideCommentOverlay } from "./body";
import { CommentOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref } from "@selfage/ref";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

let SETTINGS: CommentOverlaySettings = {
  fontSize: 20,
  opacity: 80,
};

function createComment(index: number): CommentWithAuthor {
  return {
    comment: {
      content: `${index} This is a very long comment that is being used for testing purposes. This includes testing for proper text wrapping, overflow handling.`,
    },
    author: {
      naturalName: `Author ${index}`,
    },
  };
}

function createMultipleComments(
  totalCount: Ref<number>,
  upTo: number,
): Array<CommentWithAuthor> {
  let comments = new Array<CommentWithAuthor>();
  for (; totalCount.val < upTo; totalCount.val++) {
    comments.push(createComment(totalCount.val));
  }
  return comments;
}

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "SideCommentOverlayTest",
  environment: {
    setUp() {
      container = E.div({
        style: `width: 60rem; height: 40rem; background-color: white;`,
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "AddedComments_AddedMoreCommentsOverflowed";
      private cut: SideCommentOverlay;
      public async execute() {
        // Prepare
        await setTabletView();
        let commentCount = new Ref<number>(0);
        let settings: CommentOverlaySettings = JSON.parse(
          JSON.stringify(SETTINGS),
        );
        this.cut = new SideCommentOverlay(settings);

        // Execute
        container.append(this.cut.body);
        this.cut.add(createMultipleComments(commentCount, 4));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/side_comment_overlay_init_comments.png"),
          path.join(
            __dirname,
            "/golden/side_comment_overlay_init_comments.png",
          ),
          path.join(__dirname, "/side_comment_overlay_init_comments_diff.png"),
        );

        // Execute
        this.cut.add(createMultipleComments(commentCount, 6));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/side_comment_overlay_comments_overflowed.png"),
          path.join(
            __dirname,
            "/golden/side_comment_overlay_comments_overflowed.png",
          ),
          path.join(
            __dirname,
            "/side_comment_overlay_comments_overflowed_diff.png",
          ),
        );
        // Neesd to wait for the animation to finish.
        assertThat(this.cut.body.children.length, eq(4), "comments left");
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ClearInitAddedComments_AddMoreComments_UpdatedSettings";
      private cut: SideCommentOverlay;
      public async execute() {
        // Prepare
        await setTabletView();
        let commentCount = new Ref<number>(0);
        let settings: CommentOverlaySettings = JSON.parse(
          JSON.stringify(SETTINGS),
        );
        this.cut = new SideCommentOverlay(settings);
        container.append(this.cut.body);
        this.cut.add(createMultipleComments(commentCount, 3));

        // Execute
        this.cut.clear();
        this.cut.add(createMultipleComments(commentCount, 7));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/side_comment_overlay_added_after_cleared.png"),
          path.join(
            __dirname,
            "/golden/side_comment_overlay_added_after_cleared.png",
          ),
          path.join(
            __dirname,
            "/side_comment_overlay_added_after_cleared_diff.png",
          ),
        );

        // Execute
        settings.fontSize = 25;
        settings.opacity = 50;
        this.cut.applySettings();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/side_comment_overlay_updated_settings.png"),
          path.join(
            __dirname,
            "/golden/side_comment_overlay_updated_settings.png",
          ),
          path.join(
            __dirname,
            "/side_comment_overlay_updated_settings_diff.png",
          ),
        );
        // Neesd to wait for the animation to finish.
        assertThat(
          this.cut.body.children.length,
          eq(3),
          "comments left after update",
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
