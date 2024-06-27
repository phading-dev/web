import EventEmitter = require("events");
import {
  BlockingButton,
  FilledBlockingButton,
} from "../../../../common/blocking_button";
import { SCHEME } from "../../../../common/color_scheme";
import { COMMENT_LENGTH_LIMIT } from "../../../../common/comment_limits";
import { IconButton, TooltipPosition } from "../../../../common/icon_button";
import { createArrowWithBarIcon } from "../../../../common/icons";
import { BASIC_INPUT_STYLE } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { ICON_S } from "../../../../common/sizes";
import { COMMENT_SERVICE_CLIENT } from "../../../../common/web_service_client";
import { CARD_SIDE_PADDING } from "../common/styles";
import { CommentEntry } from "./comment_entry";
import { postComment } from "@phading/comment_service_interface/frontend/show/client_requests";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CommentsCard {
  on(event: "commentError", listener: () => void): this;
  on(event: "commented", listener: (comment: Comment) => void): this;
}

export class CommentsCard extends EventEmitter {
  public static create(episodeId: string): CommentsCard {
    return new CommentsCard(
      COMMENT_SERVICE_CLIENT,
      CommentEntry.create,
      episodeId,
    );
  }

  private static NUM_COMMENTS_LIMIT = 100;

  public body: HTMLDivElement;
  public commentInput = new Ref<HTMLInputElement>();
  public commentButton = new Ref<BlockingButton>();
  public scrollingArea = new Ref<HTMLDivElement>();
  public scrollToTopButton = new Ref<IconButton>();
  public commentEntries = new Set<CommentEntry>();
  private getTimestampMs: () => number;
  private postedComment: Comment;

  public constructor(
    private webServiceClient: WebServiceClient,
    private createCommentEntry: (comment: Comment) => CommentEntry,
    private episodeId: string,
  ) {
    super();
    this.body = E.div(
      {
        class: "comments-card",
        style: `flex: 1 1 0; min-height: 0; width: 100%; height: 100%; display: flex; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "comments-card-input-box",
          style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center; padding: .5rem ${CARD_SIDE_PADDING}rem; box-sizing: border-box; width: 100%; gap: 1rem;`,
        },
        E.inputRef(this.commentInput, {
          class: "comments-card-input",
          style: `${BASIC_INPUT_STYLE} flex: 1 1 0; min-width: 0; line-height: 3rem; border-color: ${SCHEME.neutral1};`,
          placeholder: LOCALIZED_TEXT.commentInputPlaceholder,
        }),
        assign(
          this.commentButton,
          FilledBlockingButton.create("")
            .append(E.text(LOCALIZED_TEXT.commentButtonLabel))
            .show(),
        ).body,
      ),
      E.div(
        {
          class: "comments-card-list-container",
          style: `flex: 1 1 0; min-height: 0; position: relative;`,
        },
        E.divRef(this.scrollingArea, {
          class: "comments-card-scrolling-area",
          style: `height: 100%; width: 100%; overflow-y: auto;`,
        }),
        assign(
          this.scrollToTopButton,
          IconButton.create(
            `position: absolute; display: block; top: 0; left: 0; width: 100%; background-color: ${SCHEME.neutral4};`,
            E.div(
              {
                class: "comments-card-scroll-to-buttom-icon",
                style: `margin-left: auto; margin-right: auto; width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .8rem; box-sizing: border-box; transform: rotate(90deg);`,
              },
              createArrowWithBarIcon(SCHEME.neutral1),
            ),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.accountDescriptionLabel,
          ).enable(),
        ).body,
      ),
    );

    this.validateCommentInput();
    this.updateScrollButton();
    this.commentInput.val.addEventListener("input", () =>
      this.validateCommentInput(),
    );
    this.commentInput.val.addEventListener("keydown", (event) =>
      this.handleKeyDown(event),
    );
    this.commentButton.val.on("action", () => this.postComment());
    this.commentButton.val.on("postAction", (error) =>
      this.postPostComment(error),
    );
    this.scrollingArea.val.addEventListener("scrollend", () =>
      this.updateScrollButton(),
    );
    this.scrollToTopButton.val.on("action", () => this.scrollToTop());
  }

  private validateCommentInput(): void {
    if (
      this.commentInput.val.value.length > 0 &&
      this.commentInput.val.value.length <= COMMENT_LENGTH_LIMIT
    ) {
      this.commentButton.val.enable();
    } else {
      this.commentButton.val.disable();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.code === "Enter") {
      this.commentButton.val.click();
    }
  }

  private async postComment(): Promise<void> {
    let response = await postComment(this.webServiceClient, {
      episodeId: this.episodeId,
      content: this.commentInput.val.value,
      timestampMs: this.getTimestampMs(),
    });
    this.postedComment = response.comment;
  }

  private postPostComment(error?: Error): void {
    if (error) {
      console.error(error);
      this.emit("commentError");
      return;
    }
    this.commentInput.val.value = "";
    this.validateCommentInput();
    this.emit("commented", this.postedComment);
  }

  private updateScrollButton(): void {
    if (this.scrollingArea.val.scrollTop <= 0) {
      this.scrollToTopButton.val.hide();
    } else {
      this.scrollToTopButton.val.show();
    }
  }

  private scrollToTop(): void {
    this.scrollingArea.val.scrollTop = 0;
    this.scrollToTopButton.val.hide();
  }

  // In milliseconds
  public setCallbackToGetTimestampMs(getTimestampMs: () => number): this {
    this.getTimestampMs = getTimestampMs;
    return this;
  }

  public addComments(comments: Array<Comment>): void {
    let hadReachedTop = this.scrollingArea.val.scrollTop === 0;
    for (let comment of comments) {
      let commentEntry = this.createCommentEntry(comment);
      this.scrollingArea.val.prepend(commentEntry.body);
      this.commentEntries.add(commentEntry);
    }
    if (hadReachedTop) {
      this.scrollingArea.val.scrollTop = 0;
    }

    for (let commentEntry of this.commentEntries) {
      if (this.commentEntries.size <= CommentsCard.NUM_COMMENTS_LIMIT) {
        break;
      }
      this.commentEntries.delete(commentEntry);
      commentEntry.remove();
    }
  }

  public show(): this {
    this.body.style.display = "flex";
    return this;
  }

  public hide(): this {
    this.body.style.display = "none";
    return this;
  }

  public remove(): void {
    this.body.remove();
  }
}
