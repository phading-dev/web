import { CommentsCard } from "./body";
import { CommentEntryMock } from "./comment_entry_mock";

export class CommentsCardMock extends CommentsCard {
  public constructor(episodeId: string) {
    super(undefined, CommentEntryMock.create, episodeId);
  }
}
