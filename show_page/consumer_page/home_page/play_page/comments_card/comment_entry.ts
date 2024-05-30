import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { HoverObserver, Mode } from "../../../../../common/hover_observer";
import { TooltipPosition } from "../../../../../common/icon_button";
import { LikeDislikeButtons } from "../../../../../common/like_dislike_buttons";
import {
  AVATAR_S,
  FONT_M,
  FONT_S,
  LINE_HEIGHT_M,
} from "../../../../../common/sizes";
import { COMMENT_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { CARD_SIDE_PADDING } from "../common/styles";
import {
  Comment,
  Liking,
} from "@phading/comment_service_interface/show_app/comment";
import {
  getCommentLiking,
  likeComment,
} from "@phading/comment_service_interface/show_app/web/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CommentEntry {
  on(event: "postLike", listener: () => void): this;
}

export class CommentEntry extends EventEmitter {
  public static create(comment: Comment): CommentEntry {
    return new CommentEntry(COMMENT_SERVICE_CLIENT, comment);
  }

  private body_: HTMLDivElement;
  private likeDislikeButtons_: LikeDislikeButtons;
  private hoverObserver: HoverObserver;
  private liking: Liking;

  public constructor(
    private webServiceClient: WebServiceClient,
    private comment: Comment,
  ) {
    super();
    let likeDislikeButtonsRef = new Ref<LikeDislikeButtons>();
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
      assign(
        likeDislikeButtonsRef,
        LikeDislikeButtons.create(
          `width: 100%; box-sizing: border-box; padding: 0 ${CARD_SIDE_PADDING}rem; position: absolute; left: 0; bottom: 100%; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: row nowrap; justify-content: flex-end; gap: .5rem;`,
          0.7,
          TooltipPosition.LEFT,
        ).disable(),
      ).body,
    );
    this.likeDislikeButtons_ = likeDislikeButtonsRef.val;

    this.hideActions();
    this.hoverObserver = HoverObserver.create(
      this.body_,
      Mode.DELAY_HOVER_DELAY_LEAVE,
    )
      .on("hover", () => this.showActions())
      .on("leave", () => this.hideActions());
    this.likeDislikeButtons_.on("like", (liking) => this.likeComment(liking));
    this.likeDislikeButtons_.on("postLike", () => this.emit("postLike"));
  }

  private async showActions(): Promise<void> {
    this.likeDislikeButtons_.show();
    if (!this.liking) {
      let response = await getCommentLiking(this.webServiceClient, {
        commentId: this.comment.commentId,
      });
      this.likeDislikeButtons_.enable(response.liking);
    }
  }

  private hideActions(): void {
    this.likeDislikeButtons_.hide();
  }

  private async likeComment(liking: Liking): Promise<void> {
    await likeComment(this.webServiceClient, {
      commentId: this.comment.commentId,
      liking,
    });
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for tesitng
  public get likeDislikeButtons() {
    return this.likeDislikeButtons_;
  }
  public hover(): void {
    this.hoverObserver.emit("hover");
  }
  public leave(): void {
    this.hoverObserver.emit("leave");
  }
}
