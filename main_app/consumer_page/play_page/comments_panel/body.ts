import EventEmitter = require("events");
import {
  BlockingButton,
  FilledBlockingButton,
} from "../../../../common/blocking_button";
import { SCHEME } from "../../../../common/color_scheme";
import { formatSecondsAsHHMMSS } from "../../../../common/formatter/timestamp";
import { BASIC_INPUT_STYLE } from "../../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { FONT_M, LINE_HEIGHT_XXL } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { CommentWithAuthor } from "../comment_with_author";
import { CommentEntry } from "./comment_entry";
import { SIDE_PADDING } from "./styles";
import { newPostCommentRequest } from "@phading/comment_service_interface/show/web/author/client";
import { PostCommentResponse } from "@phading/comment_service_interface/show/web/author/interface";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { MAX_CONTENT_LENGTH } from "@phading/constants/comment";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CommentsPanel {
  on(event: "commented", listener: (comment: Comment) => void): this;
  on(event: "postedComment", listener: () => void): this;
}

export class CommentsPanel extends EventEmitter {
  public static create(
    customeStyle: string,
    seasonId: string,
    episodeId: string,
  ): CommentsPanel {
    return new CommentsPanel(SERVICE_CLIENT, customeStyle, seasonId, episodeId);
  }

  private static NUM_COMMENTS_LIMIT = 20;

  public body: HTMLDivElement;
  private commentInputLine = new Ref<HTMLDivElement>();
  private pinTimestamp = new Ref<HTMLDivElement>();
  public commentInput = new Ref<HTMLInputElement>();
  public commentButton = new Ref<BlockingButton<PostCommentResponse>>();
  public commentEntries = new Set<CommentEntry>();
  private getPinTimestampMs: () => number;

  public constructor(
    private webServiceClient: WebServiceClient,
    customStyle: string,
    private seasonId: string,
    private episodeId: string,
  ) {
    super();
    this.body = E.div(
      {
        class: "comments-panel",
        style: `min-height: 20rem; display: flex; flex-flow: column nowrap; border-bottom: .1rem solid ${SCHEME.neutral1}; ${customStyle}`,
      },
      E.divRef(
        this.commentInputLine,
        {
          class: "comments-panel-input-line",
          style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center; padding: .5rem ${SIDE_PADDING}rem; box-sizing: border-box; width: 100%; gap: 1rem;`,
        },
        E.divRef(
          this.pinTimestamp,
          {
            class: "comments-panel-input-timestamp",
            style: `flex: 0 0 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
          },
          E.text(formatSecondsAsHHMMSS(0)),
        ),
        E.inputRef(this.commentInput, {
          class: "comments-panel-input",
          style: `${BASIC_INPUT_STYLE} flex: 1 0 0; line-height: ${LINE_HEIGHT_XXL}rem;`,
          placeholder: LOCALIZED_TEXT.commentInputPlaceholder,
        }),
        assign(
          this.commentButton,
          FilledBlockingButton.create<PostCommentResponse>().append(
            E.text(LOCALIZED_TEXT.commentButtonLabel),
          ),
        ).body,
      ),
    );
    this.validateCommentInput();

    this.commentInput.val.addEventListener("input", () =>
      this.validateCommentInput(),
    );
    this.commentInput.val.addEventListener("keydown", (event) =>
      this.handleKeyDown(event),
    );
    this.commentButton.val.addAction(
      () => this.postComment(),
      (response, error) => this.postPostComment(response, error),
    );
  }

  private validateCommentInput(): void {
    if (
      this.commentInput.val.value.length > 0 &&
      this.commentInput.val.value.length <= MAX_CONTENT_LENGTH
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

  private postComment(): Promise<PostCommentResponse> {
    return this.webServiceClient.send(
      newPostCommentRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
        content: this.commentInput.val.value,
        pinTimestampMs: this.getPinTimestampMs(),
      }),
    );
  }

  private postPostComment(response?: PostCommentResponse, error?: Error): void {
    if (error) {
      console.error(error);
      this.emit("postedComment");
      return;
    }
    this.commentInput.val.value = "";
    this.validateCommentInput();
    this.emit("commented", response.comment);
    this.emit("postedComment");
  }

  public setPinTimestampMs(pinTimestampMs: number): void {
    this.pinTimestamp.val.textContent = formatSecondsAsHHMMSS(
      pinTimestampMs / 1000,
    );
  }

  public setCallbackToGetPinTimestampMs(getPinTimestampMs: () => number): this {
    this.getPinTimestampMs = getPinTimestampMs;
    return this;
  }

  public addComments(comments: Array<CommentWithAuthor>): void {
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
}
