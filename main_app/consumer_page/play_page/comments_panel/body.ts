import EventEmitter = require("events");
import { BlockingButton, FilledButton } from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import { formatSecondsAsHHMMSS } from "../../../../common/formatter/timestamp";
import { COMMON_BASIC_INPUT_STYLE } from "../../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { FONT_M, GAP_d_5X, LINE_HEIGHT_M } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { CommentWithAuthor } from "../common/comment_with_author";
import { CommentEntry } from "./comment_entry";
import { newPostCommentRequest } from "@phading/comment_service_interface/show/web/author/client";
import { PostCommentResponse } from "@phading/comment_service_interface/show/web/author/interface";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { MAX_CONTENT_LENGTH } from "@phading/constants/comment";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CommentsPanel {
  on(event: "commented", listener: (comment: Comment) => void): this;
  on(event: "postCommentDone", listener: () => void): this;
}

export class CommentsPanel extends EventEmitter {
  public static create(
    customeStyle: string,
    seasonId: string,
    episodeId: string,
  ): CommentsPanel {
    return new CommentsPanel(SERVICE_CLIENT, customeStyle, seasonId, episodeId);
  }

  private static NUM_COMMENTS_LIMIT = 30;

  public body: HTMLDivElement;
  private commentInputLine = new Ref<HTMLDivElement>();
  private pinTimestamp = new Ref<HTMLDivElement>();
  public commentInput = new Ref<HTMLInputElement>();
  public commentButton = new Ref<BlockingButton<PostCommentResponse>>();
  public commentEntries = new Set<CommentEntry>();
  private getVideoTimeMs: () => number;

  public constructor(
    protected serviceClient: WebServiceClient,
    customStyle: string,
    private seasonId: string,
    private episodeId: string,
  ) {
    super();
    this.body = E.div(
      {
        class: "comments-panel",
        style: `flex-flow: column nowrap; ${customStyle}`,
      },
      E.divRef(
        this.commentInputLine,
        {
          class: "comments-panel-input-container",
          style: `flex: 0 0 auto; width: 100%; display: flex; flex-flow: column nowrap; padding-bottom: ${GAP_d_5X}rem; gap: ${GAP_d_5X}rem;`,
        },
        E.inputRef(this.commentInput, {
          class: "comments-panel-input",
          style: `${COMMON_BASIC_INPUT_STYLE} width: 100%;`,
          placeholder: LOCALIZED_TEXT.commentInputPlaceholder,
        }),
        E.div(
          {
            class: "comments-panel-input-actions",
            style: `display: flex; flex-flow: row nowrap; align-items: center; justify-content: space-between;`,
          },
          E.divRef(
            this.pinTimestamp,
            {
              class: "comments-panel-input-timestamp",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral1};`,
            },
            E.text(formatSecondsAsHHMMSS(0)),
          ),
          assign(
            this.commentButton,
            new BlockingButton<PostCommentResponse>(
              new FilledButton().append(
                E.text(LOCALIZED_TEXT.commentButtonLabel),
              ),
            ),
          ).body,
        ),
      ),
    );
    this.show();

    this.validateCommentInput();
    this.commentInput.val.addEventListener("input", () =>
      this.validateCommentInput(),
    );
    this.commentInput.val.addEventListener("keydown", (event) =>
      this.handleKeyDown(event),
    );
    this.commentButton.val.addAction(
      () => this.postComment(),
      (error, response) => this.postPostComment(error, response),
    );
  }

  private validateCommentInput(): void {
    if (
      this.commentInput.val.value &&
      this.commentInput.val.value.length <= MAX_CONTENT_LENGTH
    ) {
      this.commentButton.val.enable();
    } else {
      this.commentButton.val.disable();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.commentButton.val.click();
    }
  }

  private postComment(): Promise<PostCommentResponse> {
    return this.serviceClient.send(
      newPostCommentRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
        content: this.commentInput.val.value,
        pinnedVideoTimeMs: this.getVideoTimeMs(),
      }),
    );
  }

  private postPostComment(error?: Error, response?: PostCommentResponse): void {
    if (error) {
      console.error(error);
      this.emit("postCommentDone");
      return;
    }
    this.commentInput.val.value = "";
    this.validateCommentInput();
    this.emit("commented", response.comment);
    this.emit("postCommentDone");
  }

  public setPinnedVideoTimeMs(pinnedVideoTimeMs: number): void {
    this.pinTimestamp.val.textContent = formatSecondsAsHHMMSS(
      pinnedVideoTimeMs / 1000,
    );
  }

  public setCallbackToGetVideoTimeMs(getVideoTimeMs: () => number): this {
    this.getVideoTimeMs = getVideoTimeMs;
    return this;
  }

  public add(comments: Array<CommentWithAuthor>): void {
    for (let comment of comments) {
      let commentEntry = CommentEntry.create(comment);
      this.commentInputLine.val.after(commentEntry.body);
      this.commentEntries.add(commentEntry);
    }

    for (let commentEntry of this.commentEntries) {
      if (this.commentEntries.size <= CommentsPanel.NUM_COMMENTS_LIMIT) {
        break;
      }
      this.commentEntries.delete(commentEntry);
      commentEntry.remove();
    }
  }

  public clear(): void {
    for (let commentEntry of this.commentEntries) {
      commentEntry.remove();
    }
    this.commentEntries.clear();
  }

  public show(): void {
    this.body.style.display = "flex";
  }

  public hide(): void {
    this.body.style.display = "none";
  }
}
