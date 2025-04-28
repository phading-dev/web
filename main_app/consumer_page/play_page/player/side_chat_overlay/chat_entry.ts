import { SCHEME } from "../../../../../common/color_scheme";
import { FONT_SIZE_SCALE } from "../scales";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { ChatOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export class ChatEntry {
  public static create(
    settings: ChatOverlaySettings,
    comment: Comment,
  ): ChatEntry {
    return new ChatEntry(settings, comment);
  }

  public body: HTMLDivElement;
  private content = new Ref<HTMLDivElement>();

  public constructor(
    private settings: ChatOverlaySettings,
    comment: Comment,
  ) {
    this.body = E.div(
      {
        class: "danmaku-entry",
        style: `position: relative; left: 100%; transition: left .2s; pointer-events: none; margin-bottom: .5rem;`,
      },
      E.divRef(
        this.content,
        {
          class: "danmaku-entry-content",
          style: `color: ${SCHEME.neutral0}; text-shadow: -.1rem 0 .2rem ${SCHEME.neutral4}, 0 .1rem .2rem ${SCHEME.neutral4}, .1rem 0 .2rem ${SCHEME.neutral4}, 0 -.1rem .2rem ${SCHEME.neutral4};`,
        },
        E.text(comment.content),
      ),
    );
    this.render();
  }

  private render(): void {
    this.content.val.style.opacity = `${this.settings.opacity / 100}`;
    this.content.val.style.fontSize = `${
      this.settings.fontSize * FONT_SIZE_SCALE
    }rem`;
    this.content.val.style.fontFamily = this.settings.fontFamily;
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

  public moveOut(): this {
    this.body.style.left = "100%";
    this.body.addEventListener("transitionend", () => {
      this.body.remove();
    });
    return this;
  }
}
