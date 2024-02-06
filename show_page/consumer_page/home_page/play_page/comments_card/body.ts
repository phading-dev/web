import EventEmitter = require("events");
import {
  BlockingButton,
  FilledBlockingButton,
} from "../../../../../common/blocking_button";
import { SCHEME } from "../../../../../common/color_scheme";
import { COMMENT_LENGTH_LIMIT } from "../../../../../common/comment_limits";
import { IconButton, TooltipPosition } from "../../../../../common/icon_button";
import { createArrowWithBarIcon } from "../../../../../common/icons";
import { BASIC_INPUT_STYLE } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { ICON_S } from "../../../../../common/sizes";
import { COMMENT_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { CommentEntry } from "./comment_entry";
import { CONTAINER_PADDING_LEFT_RIGHT } from "./styles";
import { Comment } from "@phading/comment_service_interface/show_app/comment";
import { postComment } from "@phading/comment_service_interface/show_app/web/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CommentsCard {
  on(event: "commentError", listener: () => void): this;
  on(event: "commented", listener: (comment: Comment) => void): this;
}

export class CommentsCard extends EventEmitter {
  public static create(showId: string): CommentsCard {
    return new CommentsCard(
      COMMENT_SERVICE_CLIENT,
      CommentEntry.create,
      showId
    );
  }

  private static NUM_COMMENTS_LIMIT = 500;

  private body_: HTMLDivElement;
  private commentInput_: HTMLInputElement;
  private commentButton_: BlockingButton;
  private scrollingArea_: HTMLDivElement;
  private scrollToTopButton_: IconButton;
  private commentEntries = new Set<CommentEntry>();
  private getTimestamp: () => number;
  private postedComment: Comment;

  public constructor(
    private webServiceClient: WebServiceClient,
    private createCommentEntry: (comment: Comment) => CommentEntry,
    private showId: string
  ) {
    super();
    let commentInputRef = new Ref<HTMLInputElement>();
    let commentButtonRef = new Ref<BlockingButton>();
    let scrollingAreaRef = new Ref<HTMLDivElement>();
    let scrollToTopButtonRef = new Ref<IconButton>();
    this.body_ = E.div(
      {
        class: "comments-card",
        style: `flex: 0 0 auto; display: flex; flex-flow: column nowrap; background-color: ${SCHEME.neutral4};`,
      },
      E.div(
        {
          class: "comments-card-input-box",
          style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center; padding: .5rem ${CONTAINER_PADDING_LEFT_RIGHT}rem; box-sizing: border-box; width: 100%; gap: 1rem;`,
        },
        E.inputRef(commentInputRef, {
          class: "comments-card-input",
          style: `${BASIC_INPUT_STYLE} flex: 1 0 0; line-height: 3rem; border-color: ${SCHEME.neutral1};`,
          placeholder: LOCALIZED_TEXT.commentInputPlaceholder,
        }),
        assign(
          commentButtonRef,
          FilledBlockingButton.create("")
            .append(E.text(LOCALIZED_TEXT.commentButtonLabel))
            .show()
        ).body
      ),
      E.div(
        {
          class: "comments-card-list-container",
          style: `flex: 1 1 0; position: relative; display: flex; flex-flow: column nowrap;`,
        },
        E.divRef(scrollingAreaRef, {
          class: "comments-card-scrolling-area",
          style: `flex: 1 1 0; width: 100%; overflow-y: scroll;`,
        }),
        assign(
          scrollToTopButtonRef,
          IconButton.create(
            `position: absolute; display: block; top: 0; left: 0; width: 100%; background-color: ${SCHEME.neutral4};`,
            E.div(
              {
                class: "comments-card-scroll-to-buttom-icon",
                style: `margin-left: auto; margin-right: auto; width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .8rem; box-sizing: border-box; transform: rotate(90deg);`,
              },
              createArrowWithBarIcon(SCHEME.neutral1)
            ),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.accountDescriptionLabel
          ).enable()
        ).body
      )
    );
    this.commentInput_ = commentInputRef.val;
    this.commentButton_ = commentButtonRef.val;
    this.scrollingArea_ = scrollingAreaRef.val;
    this.scrollToTopButton_ = scrollToTopButtonRef.val;

    this.validateCommentInput();
    this.updateScrollButton();
    this.commentInput_.addEventListener("input", () =>
      this.validateCommentInput()
    );
    this.commentInput_.addEventListener("keydown", (event) =>
      this.handleKeyDown(event)
    );
    this.commentButton_.on("action", () => this.postComment());
    this.commentButton_.on("postAction", (error) =>
      this.postPostComment(error)
    );
    this.scrollingArea_.addEventListener("scrollend", () =>
      this.updateScrollButton()
    );
    this.scrollToTopButton_.on("action", () => this.scrollToTop());
  }

  private validateCommentInput(): void {
    if (
      this.commentInput_.value.length > 0 &&
      this.commentInput_.value.length <= COMMENT_LENGTH_LIMIT
    ) {
      this.commentButton_.enable();
    } else {
      this.commentButton_.disable();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.code === "Enter") {
      this.commentButton_.click();
    }
  }

  private async postComment(): Promise<void> {
    let response = await postComment(this.webServiceClient, {
      showId: this.showId,
      content: this.commentInput_.value,
      timestamp: this.getTimestamp(),
    });
    this.postedComment = response.comment;
  }

  private postPostComment(error?: Error): void {
    if (error) {
      console.error(error);
      this.emit("commentError");
      return;
    }
    this.commentInput.value = "";
    this.validateCommentInput();
    this.emit("commented", this.postedComment);
  }

  private updateScrollButton(): void {
    if (this.scrollingArea_.scrollTop <= 0) {
      this.scrollToTopButton_.hide();
    } else {
      this.scrollToTopButton_.show();
    }
  }

  private scrollToTop(): void {
    this.scrollingArea_.scrollTop = 0;
    this.scrollToTopButton_.hide();
  }

  // In milliseconds
  public setCallbackToGetTimestamp(getTimestamp: () => number): this {
    this.getTimestamp = getTimestamp;
    return this;
  }

  public changeToPortrait(): this {
    this.body_.style.width = "40rem";
    this.body_.style.height = "100vh";
    return this;
  }

  public changeToLandscape(): this {
    this.body_.style.width = "100vm";
    this.body_.style.maxWidth = `80rem;`;
    this.body_.style.height = "70rem";
    return this;
  }

  public addComment(comments: Array<Comment>): void {
    let hadReachedTop = this.scrollingArea_.scrollTop === 0;
    for (let comment of comments) {
      let commentEntry = this.createCommentEntry(comment);
      this.scrollingArea_.prepend(commentEntry.body);
      this.commentEntries.add(commentEntry);
    }
    if (hadReachedTop) {
      this.scrollingArea_.scrollTop = 0;
    }

    for (let commentEntry of this.commentEntries) {
      if (this.commentEntries.size <= CommentsCard.NUM_COMMENTS_LIMIT) {
        break;
      }
      this.commentEntries.delete(commentEntry);
      commentEntry.remove();
    }
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for testing
  public get commentInput() {
    return this.commentInput_;
  }
  public get commentButton() {
    return this.commentButton_;
  }
  public get scrollingArea() {
    return this.scrollingArea_;
  }
  public get scrollToTopButton() {
    return this.scrollToTopButton_;
  }
  public get comments() {
    return this.commentEntries;
  }
}
