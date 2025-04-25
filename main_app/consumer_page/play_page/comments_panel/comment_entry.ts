import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import {
  AVATAR_S,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  LINE_HEIGHT_M,
} from "../../../../common/sizes";
import { CommentWithAuthor } from "../comment_with_author";
import { SIDE_PADDING } from "./styles";
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
        style: `position: relative; padding: .5rem ${SIDE_PADDING}rem; min-height: ${AVATAR_S}rem;`,
      },
      E.image({
        class: "comment-entry-author-avatar",
        style: `float: left; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: ${AVATAR_S}rem; margin: 0 .5rem .5rem 0;`,
        src: comment.author.avatarSmallUrl,
      }),
      E.div(
        {
          class: "comment-entry-author-name",
          style: `display: inline; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(comment.author.naturalName),
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
          style: `display: inline; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
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
