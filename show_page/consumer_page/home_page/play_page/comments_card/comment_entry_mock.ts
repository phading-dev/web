import { CommentEntry } from "./comment_entry";
import { Comment } from "@phading/comment_service_interface/show_app/comment";

export class CommentEntryMock extends CommentEntry {
  public constructor(comment: Comment) {
    super(undefined, undefined, undefined, comment);
  }
}
