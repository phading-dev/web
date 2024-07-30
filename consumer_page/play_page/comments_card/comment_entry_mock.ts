import { CommentEntry } from "./comment_entry";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";

export class CommentEntryMock extends CommentEntry {
  public constructor(comment: Comment) {
    super(comment);
  }
}
