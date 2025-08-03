import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import {
  AVATAR_S,
  FONT_S,
  FONT_WEIGHT_600,
  GAP_d_25X,
  LINE_HEIGHT_S,
} from "../../../../common/sizes";
import { CommentWithAuthor } from "../common/comment_with_author";
import { E } from "@selfage/element/factory";

export class CommentEntry extends EventEmitter {
  public static create(comment: CommentWithAuthor): CommentEntry {
    return new CommentEntry(comment);
  }

  public body: HTMLDivElement;

  public constructor(comment: CommentWithAuthor) {
    super();
    this.body = E.div(
      {
        class: "comment-entry",
        style: `position: relative; margin: ${GAP_d_25X}rem 0; min-height: ${AVATAR_S}rem;`,
      },
      E.image({
        class: "comment-entry-author-avatar",
        style: `float: left; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: ${AVATAR_S}rem; margin: ${GAP_d_25X}rem ${GAP_d_25X}rem ${GAP_d_25X}rem 0;`,
        src: comment.author.avatarSmallUrl,
      }),
      E.div(
        {
          class: "comment-entry-author-name",
          style: `display: inline; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(comment.author.name),
      ),
      E.div(
        {
          style: "white-space: pre-line",
        },
        E.text("\n"),
      ),
      E.div(
        {
          class: "comment-entry-content",
          style: `display: inline; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(comment.comment.content),
      ),
      // assign(
      //   this.likeDislikeButtons,
      //   LikeDislikeButtons.create(
      //     `width: 100%; box-sizing: border-box; padding: 0 ${CARD_SIDE_PADDING}rem; position: absolute; left: 0; bottom: 100%; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: row nowrap; justify-content: flex-end; gap: .5rem;`,
      //     0.7,
      //     TooltipPosition.LEFT,
      //   )
      //     .disable()
      //     .hide(),
      // ).body,
    );
  }

  public remove(): void {
    this.body.remove();
  }
}
