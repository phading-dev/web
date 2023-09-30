import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { BasicInfoPag } from "./body";
import {
  GET_SUBJECT_ACCOUNT,
  GET_SUBJECT_ACCOUNT_REQUEST_BODY,
  GetSubjectAccountResponse,
} from "@phading/user_service_interface/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "BasicInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name = "NameOnly_HoverAvatar_LeaveAvatar_UpdateAvatar";
      private cut: BasicInfoPag;
      public async execute() {
        // Prepare
        this.cut = new BasicInfoPag(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              assertThat(
                request.descriptor,
                eq(GET_SUBJECT_ACCOUNT),
                "service"
              );
              assertThat(
                request.body,
                eqMessage({}, GET_SUBJECT_ACCOUNT_REQUEST_BODY),
                "request body"
              );
              return {
                account: {
                  avatarLargePath: userImage,
                  naturalName: "Some name",
                },
              } as GetSubjectAccountResponse;
            }
          })()
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_name_only.png"),
          path.join(__dirname, "/golden/basic_info_page_name_only.png"),
          path.join(__dirname, "/basic_info_page_name_only_diff.png")
        );

        // Execute
        this.cut.avatarContainer.dispatchEvent(new MouseEvent("mouseenter"));
        await new Promise<void>((resolve) =>
          this.cut.once("avatarUpdateHintTransitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_hover_avatar.png"),
          path.join(__dirname, "/golden/basic_info_page_hover_avatar.png"),
          path.join(__dirname, "/basic_info_page_hover_avatar_diff.png")
        );

        // Execute
        this.cut.avatarContainer.dispatchEvent(new MouseEvent("mouseleave"));
        await new Promise<void>((resolve) =>
          this.cut.once("avatarUpdateHintTransitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_leave_avatar.png"),
          path.join(__dirname, "/golden/basic_info_page_name_only.png"),
          path.join(__dirname, "/basic_info_page_leave_avatar_diff.png")
        );

        // Prepare
        let updateAvatar = false;
        this.cut.on("updateAvatar", () => (updateAvatar = true));

        // Execute
        this.cut.avatarContainer.click();

        // Verify
        assertThat(updateAvatar, eq(true), "update avatar");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Full";
      private cut: BasicInfoPag;
      public async execute() {
        // Prepare
        this.cut = new BasicInfoPag(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              assertThat(
                request.descriptor,
                eq(GET_SUBJECT_ACCOUNT),
                "service"
              );
              assertThat(
                request.body,
                eqMessage({}, GET_SUBJECT_ACCOUNT_REQUEST_BODY),
                "request body"
              );
              return {
                account: {
                  avatarLargePath: userImage,
                  naturalName: "Some name",
                  contactEmail: "aaa@email.com",
                  description:
                    "long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long",
                },
              } as GetSubjectAccountResponse;
            }
          })()
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/basic_info_page_full.png"),
          path.join(__dirname, "/golden/basic_info_page_full.png"),
          path.join(__dirname, "/basic_info_page_full_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateNaturalName";
      private cut: BasicInfoPag;
      public async execute() {
        // Prepare
        this.cut = new BasicInfoPag(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                account: {
                  avatarLargePath: userImage,
                  naturalName: "Some name",
                },
              } as GetSubjectAccountResponse;
            }
          })()
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateNaturalName = false;
        this.cut.on("updateNaturalName", () => (updateNaturalName = true));

        // Execute
        this.cut.naturalName.click();

        // Verify
        assertThat(updateNaturalName, eq(true), "update natural name");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateContactEmail";
      private cut: BasicInfoPag;
      public async execute() {
        // Prepare
        this.cut = new BasicInfoPag(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                account: {
                  avatarLargePath: userImage,
                  naturalName: "Some name",
                },
              } as GetSubjectAccountResponse;
            }
          })()
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateContactEmail = false;
        this.cut.on("updateContactEmail", () => (updateContactEmail = true));

        // Execute
        this.cut.contactEmail.click();

        // Verify
        assertThat(updateContactEmail, eq(true), "update contact email");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateDescription";
      private cut: BasicInfoPag;
      public async execute() {
        // Prepare
        this.cut = new BasicInfoPag(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                account: {
                  avatarLargePath: userImage,
                  naturalName: "Some name",
                },
              } as GetSubjectAccountResponse;
            }
          })()
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateDescription = false;
        this.cut.on("updateDescription", () => (updateDescription = true));

        // Execute
        this.cut.description.click();

        // Verify
        assertThat(updateDescription, eq(true), "update description");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
