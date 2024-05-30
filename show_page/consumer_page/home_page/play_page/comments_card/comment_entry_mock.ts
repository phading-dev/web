import { CommentEntry } from "./comment_entry";
import {
  Comment,
  Liking,
} from "@phading/comment_service_interface/show_app/comment";
import { GetCommentLikingResponse } from "@phading/comment_service_interface/show_app/web/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class CommentEntryMock extends CommentEntry {
  public constructor(comment: Comment) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<GetCommentLikingResponse> {
          return {
            liking: Liking.NEUTRAL,
          };
        }
      })(),
      comment,
    );
  }
}
