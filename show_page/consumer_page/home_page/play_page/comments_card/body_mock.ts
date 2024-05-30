import { CommentsCard } from "./body";
import { CommentEntryMock } from "./comment_entry_mock";

export class CommentsCardMock extends CommentsCard {
  public constructor(showId: string) {
    super(undefined, CommentEntryMock.create, showId);
  }
}
