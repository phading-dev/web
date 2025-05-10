import { CommentWithAuthor } from "../common/comment_with_author";
import { CommentEntry } from "./comment_entry";
import { CommentOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";

export class SideCommentOverlay {
  public static create(settings: CommentOverlaySettings): SideCommentOverlay {
    return new SideCommentOverlay(settings);
  }

  public body: HTMLDivElement;
  private commentEntries = new Set<CommentEntry>();

  public constructor(private settings: CommentOverlaySettings) {
    this.body = E.div({
      class: "side-comment-overlay",
      style: `margin-left: auto; width: 100%; max-width: 30rem; height: 100%; overflow: hidden;`,
    });
  }

  public add(comments: Array<CommentWithAuthor>): void {
    comments.forEach((comment) => {
      let entry = CommentEntry.create(this.settings, comment.comment);
      this.commentEntries.add(entry);
      this.body.prepend(entry.body);
      entry.moveIn();
    });
    this.moveOutOverflowedComments();
  }

  private moveOutOverflowedComments(): void {
    for (let entry of this.commentEntries) {
      if (entry.body.offsetTop > this.body.offsetHeight) {
        entry.remove();
        this.commentEntries.delete(entry);
      } else {
        break;
      }
    }
  }

  public applySettings(): void {
    this.commentEntries.forEach((entry) => {
      entry.applySettings();
    });
    this.moveOutOverflowedComments();
  }

  public clear(): void {
    this.commentEntries.forEach((entry) => {
      entry.remove();
    });
    this.commentEntries.clear();
  }

  public remove(): void {
    this.body.remove();
  }
}
