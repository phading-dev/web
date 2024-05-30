import { CommentsPool } from "./comments_pool";
import { Comment } from "@phading/comment_service_interface/show_app/comment";
import { GetCommentsResponse } from "@phading/comment_service_interface/show_app/web/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class CommentsPoolMock extends CommentsPool {
  public constructor(showId: string, comments: Array<Comment>) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<GetCommentsResponse> {
          return {
            comments,
          };
        }
      })(),
      showId,
    );
  }
}
