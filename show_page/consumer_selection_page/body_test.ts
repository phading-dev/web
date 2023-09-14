import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { ConsumerSelectionPage } from "./body";
import { ConsumerCreationPageMock } from "./consumer_creation_page/body_mock";
import {
  LIST_OWNED_USERS,
  LIST_OWNED_USERS_REQUEST_BODY,
  ListOwnedUsersResponse,
  SWITCH_USER,
  SWITCH_USER_REQUEST_BODY,
  SwitchUserResponse,
} from "@phading/user_service_interface/interface";
import { UserType } from "@phading/user_service_interface/user_type";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../common/normalize_body";

TEST_RUNNER.run({
  name: "ConsumerSelectionPageTest",
  cases: [
    new (class implements TestCase {
      public name = "SelectTheOnlyConsumer";
      private cut: ConsumerSelectionPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let userServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === LIST_OWNED_USERS) {
              assertThat(
                request.body,
                eqMessage(
                  {
                    userType: UserType.CONSUMER,
                  },
                  LIST_OWNED_USERS_REQUEST_BODY
                ),
                "ListOwnedUsersRequestBody"
              );
              return {
                users: [
                  {
                    userId: "user id",
                  },
                ],
              } as ListOwnedUsersResponse;
            } else if (request.descriptor === SWITCH_USER) {
              assertThat(
                request.body,
                eqMessage(
                  {
                    userId: "user id",
                  },
                  SWITCH_USER_REQUEST_BODY
                ),
                "SwitchUserRequestBody"
              );
              return {
                signedSession: "new session",
              } as SwitchUserResponse;
            } else {
              throw new Error("Unexpected.");
            }
          }
        })();

        // Execute
        this.cut = new ConsumerSelectionPage(
          () => new ConsumerCreationPageMock(),
          LOCAL_SESSION_STORAGE,
          userServiceClientMock,
          (...bodies) => document.body.append(...bodies)
        );
        await new Promise<void>((resolve) =>
          this.cut.once("selected", resolve)
        );

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("new session"),
          "new session"
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "CreateConsumer";
      private cut: ConsumerSelectionPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let userServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            assertThat(
              request.descriptor,
              eq(LIST_OWNED_USERS),
              "init request"
            );
            assertThat(
              request.body,
              eqMessage(
                {
                  userType: UserType.CONSUMER,
                },
                LIST_OWNED_USERS_REQUEST_BODY
              ),
              "ListOwnedUsersRequestBody"
            );
            return {
              users: [],
            } as ListOwnedUsersResponse;
          }
        })();

        // Execute
        this.cut = new ConsumerSelectionPage(
          () => new ConsumerCreationPageMock(),
          LOCAL_SESSION_STORAGE,
          userServiceClientMock,
          (...bodies) => document.body.append(...bodies)
        );
        await new Promise<void>((resolve) =>
          this.cut.once("navigated", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_selection_page_create.png"),
          path.join(__dirname, "/golden/consumer_selection_page_create.png"),
          path.join(__dirname, "/consumer_selection_page_create_diff.png")
        );

        // Prepare
        let selectedCaptured = false;
        this.cut.on("selected", () => (selectedCaptured = true));

        // Execute
        this.cut.consumerCreationPage.emit("created", "new session 2");

        // Verify
        assertThat(selectedCaptured, eq(true), "selected emitted");
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("new session 2"),
          "new session"
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
  ],
});
