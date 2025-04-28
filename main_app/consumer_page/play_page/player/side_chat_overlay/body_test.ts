import path from "path";
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { SideChatOverlay } from "./body";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { ChatOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref } from "@selfage/ref";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

let SETTINGS: ChatOverlaySettings = {
  fontSize: 18,
  opacity: 80,
};

function createComment(index: number): Comment {
  return {
    content: `${index} This is a very long comment that is being used for testing purposes. This includes testing for proper text wrapping, overflow handling.`,
  };
}

function createMultipleComments(
  totalCount: Ref<number>,
  upTo: number,
): Array<Comment> {
  let comments = new Array<Comment>();
  for (; totalCount.val < upTo; totalCount.val++) {
    comments.push(createComment(totalCount.val));
  }
  return comments;
}

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "SideChatOverlayTest",
  environment: {
    setUp() {
      container = E.div({
        style: `width: 60rem; height: 40rem; overflow: hidden; position: relative; background-color: white;`,
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "AddedComments_AddedMoreCommentsOverflowed_UpdatedSettings";
      private cut: SideChatOverlay;
      public async execute() {
        // Prepare
        await setTabletView();
        let commentCount = new Ref<number>(0);
        let settings: ChatOverlaySettings = JSON.parse(
          JSON.stringify(SETTINGS),
        );
        this.cut = new SideChatOverlay(settings);

        // Execute
        container.append(this.cut.body);
        this.cut.add(createMultipleComments(commentCount, 3));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/side_chat_overlay_init_comments.png"),
          path.join(__dirname, "/golden/side_chat_overlay_init_comments.png"),
          path.join(__dirname, "/side_chat_overlay_init_comments_diff.png"),
        );

        // Execute
        this.cut.add(createMultipleComments(commentCount, 6));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/side_chat_overlay_comments_overflowed.png"),
          path.join(
            __dirname,
            "/golden/side_chat_overlay_comments_overflowed.png",
          ),
          path.join(
            __dirname,
            "/side_chat_overlay_comments_overflowed_diff.png",
          ),
        );
        // Neesd to wait for the animation to finish.
        assertThat(this.cut.body.children.length, eq(4), "comments left");

        // Execute
        settings.fontSize = 25;
        settings.opacity = 50;
        this.cut.applySettings();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/side_chat_overlay_updated_settings.png"),
          path.join(
            __dirname,
            "/golden/side_chat_overlay_updated_settings.png",
          ),
          path.join(__dirname, "/side_chat_overlay_updated_settings_diff.png"),
        );
        // Neesd to wait for the animation to finish.
        assertThat(this.cut.body.children.length, eq(2), "comments left after update");
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
