import { SCHEME } from "../../../../common/color_scheme";
import { FONT_SIZE_SCALE, OPACITY_SCALE } from "../common/defaults";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { CommentOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

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
        style: `position: relative; left: 100%; transition: left .2s; pointer-events: none; margin-bottom: .5rem;`,
      },
      E.divRef(
        this.content,
        {
          class: "comment-entry-content",
          style: `color: ${SCHEME.neutral0}; text-shadow: -.1rem 0 .2rem ${SCHEME.neutral4}, 0 .1rem .2rem ${SCHEME.neutral4}, .1rem 0 .2rem ${SCHEME.neutral4}, 0 -.1rem .2rem ${SCHEME.neutral4};`,
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
