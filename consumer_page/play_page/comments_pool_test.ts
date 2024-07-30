import { CommentsPool } from "./comments_pool";
import {
  COMMENT,
  Comment,
} from "@phading/comment_service_interface/frontend/show/comment";
import {
  GET_COMMENTS,
  GET_COMMENTS_REQUEST_BODY,
  GetCommentsResponse,
} from "@phading/comment_service_interface/frontend/show/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq, isArray } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "CommentsPoolTest",
  cases: [
    {
      name: "SingleComment_ReadNothing_ReadOne_ReadNothing",
      execute: async () => {
        // Prepare
        let requestCaptured: any;
        let comment: Comment = {
          timestampMs: 10,
        };

        // Execute
        let commentsPool = new CommentsPool(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<GetCommentsResponse> {
              requestCaptured = request;
              return {
                comments: [comment],
              };
            }
          })(),
          "id1",
        );
        await new Promise<void>((resolve) =>
          commentsPool.once("loaded", resolve),
        );
        let read1 = commentsPool.read(10);

        // Verify
        assertThat(requestCaptured.descriptor, eq(GET_COMMENTS), "service");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              episodeId: "id1",
            },
            GET_COMMENTS_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(read1, isArray([]), "read nothing");

        // Execute
        let read2 = commentsPool.read(20);

        // Verify
        assertThat(
          read2,
          isArray([eqMessage(comment, COMMENT)]),
          "read a comment",
        );

        // Execute
        let read3 = commentsPool.read(30);

        // Verify
        assertThat(read3, isArray([]), "read nothing again");
      },
    },
    {
      name: "UnorderedComments_ReadOnTimestamp_ReadAgain",
      execute: async () => {
        // Prepare
        let comment10: Comment = {
          timestampMs: 10,
        };
        let comment20: Comment = {
          timestampMs: 20,
        };
        let comment40: Comment = {
          timestampMs: 40,
        };
        let comment45: Comment = {
          timestampMs: 45,
        };

        // Execute
        let commentsPool = new CommentsPool(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<GetCommentsResponse> {
              return {
                comments: [
                  comment40,
                  comment20,
                  comment10,
                  comment20,
                  comment45,
                ],
              };
            }
          })(),
          "id1",
        );
        await new Promise<void>((resolve) =>
          commentsPool.once("loaded", resolve),
        );
        let read1 = commentsPool.read(40);

        // Verify
        assertThat(
          read1,
          isArray([
            eqMessage(comment10, COMMENT),
            eqMessage(comment20, COMMENT),
            eqMessage(comment20, COMMENT),
          ]),
          "read 3",
        );

        // Execute
        let read2 = commentsPool.read(50);

        // Verify
        assertThat(
          read2,
          isArray([
            eqMessage(comment40, COMMENT),
            eqMessage(comment45, COMMENT),
          ]),
          "read 2",
        );
      },
    },
    {
      name: "UnorderedComments_StartFromSameTimestampAndRead_StartFromBeginningAndRead",
      execute: async () => {
        // Prepare
        let comment0: Comment = {
          timestampMs: 0,
        };
        let comment10: Comment = {
          timestampMs: 10,
        };
        let comment20: Comment = {
          timestampMs: 20,
        };
        let comment40: Comment = {
          timestampMs: 40,
        };
        let comment45: Comment = {
          timestampMs: 45,
        };

        // Execute
        let commentsPool = new CommentsPool(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<GetCommentsResponse> {
              return {
                comments: [
                  comment10,
                  comment40,
                  comment20,
                  comment0,
                  comment45,
                  comment20,
                ],
              };
            }
          })(),
          "id1",
        );
        await new Promise<void>((resolve) =>
          commentsPool.once("loaded", resolve),
        );

        // Execute
        commentsPool.startFrom(20);
        let read1 = commentsPool.read(50);

        // Verify
        assertThat(
          read1,
          isArray([
            eqMessage(comment20, COMMENT),
            eqMessage(comment20, COMMENT),
            eqMessage(comment40, COMMENT),
            eqMessage(comment45, COMMENT),
          ]),
          "read 2",
        );

        // Execute
        commentsPool.startFrom(0);
        let read2 = commentsPool.read(15);

        // Verify
        assertThat(
          read2,
          isArray([
            eqMessage(comment0, COMMENT),
            eqMessage(comment10, COMMENT),
          ]),
          "read 2",
        );
      },
    },
  ],
});
