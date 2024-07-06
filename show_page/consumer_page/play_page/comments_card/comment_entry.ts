import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import {
  AVATAR_S,
  FONT_M,
  FONT_S,
  LINE_HEIGHT_M,
} from "../../../../common/sizes";
import { CARD_SIDE_PADDING } from "../common/styles";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import { E } from "@selfage/element/factory";

export class CommentEntry extends EventEmitter {
  public static create(comment: Comment): CommentEntry {
    return new CommentEntry(comment);
  }

  private body_: HTMLDivElement;

  public constructor(comment: Comment) {
    super();
    this.body_ = E.div(
      {
        class: "comment-entry",
        style: `position: relative; padding: .5rem ${CARD_SIDE_PADDING}rem; min-height: ${AVATAR_S}rem; background-color: ${SCHEME.neutral4};`,
      },
      E.image({
        class: "comment-entry-author-avatar",
        style: `float: left; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: ${AVATAR_S}rem; margin: 0 .5rem .5rem 0;`,
        src: comment.author.avatarSmallPath,
      }),
      E.div(
        {
          class: "comment-entry-author-name",
          style: `display: inline; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${
            SCHEME.neutral1
          }; font-weight: ${comment.isThePublisher ? "bold" : "normal"};`,
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
        E.text(comment.content),
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

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }
}
