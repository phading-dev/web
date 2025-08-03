import { SCHEME } from "../../../../common/color_scheme";
import { FONT_SIZE_SCALE, OPACITY_SCALE } from "../common/defaults";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { CommentOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { BORDER_WIDTH_1, BORDER_WIDTH_2 } from "../../../../common/sizes";

export class CommentEntry {
  public static create(
    settings: CommentOverlaySettings,
    comment: Comment,
  ): CommentEntry {
    return new CommentEntry(settings, comment);
  }

  public body: HTMLDivElement;
  private content = new Ref<HTMLDivElement>();

  public constructor(
    private settings: CommentOverlaySettings,
    public comment: Comment,
  ) {
    this.body = E.div(
      {
        class: "comment-entry",
        style: `position: relative; left: 100%; transition: left .2s; padding-left: ${BORDER_WIDTH_2}rem; pointer-events: none;`,
      },
      E.divRef(
        this.content,
        {
          class: "comment-entry-content",
          style: `line-height: 1.2; color: ${SCHEME.neutral0}; text-shadow: -${BORDER_WIDTH_1}rem 0 ${BORDER_WIDTH_2}rem ${SCHEME.neutral4}, 0 ${BORDER_WIDTH_1}rem ${BORDER_WIDTH_2}rem ${SCHEME.neutral4}, ${BORDER_WIDTH_1}rem 0 ${BORDER_WIDTH_2}rem ${SCHEME.neutral4}, 0 -${BORDER_WIDTH_1}rem ${BORDER_WIDTH_2}rem ${SCHEME.neutral4};`,
        },
        E.text(comment.content),
      ),
    );
    this.render();
  }

  private render(): void {
    this.content.val.style.opacity = `${this.settings.opacity * OPACITY_SCALE}`;
    this.content.val.style.fontSize = `${
      this.settings.fontSize * FONT_SIZE_SCALE
    }rem`;
  }

  public applySettings(): void {
    this.render();
  }

  public moveIn(): this {
    // Force reflow.
    this.body.scrollHeight;
    this.body.style.left = "0";
    return this;
  }

  public remove(): void {
    this.body.remove();
  }
}
