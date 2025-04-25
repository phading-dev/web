import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { AccountSummary } from "@phading/user_service_interface/web/third_person/account";

export interface CommentWithAuthor {
  comment: Comment;
  author: AccountSummary;
}
