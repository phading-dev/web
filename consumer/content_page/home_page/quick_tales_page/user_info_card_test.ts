import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { UserInfoCard } from "./user_info_card";
import { SET_USER_RELATIONSHIP_REQUEST_BODY } from "@phading/user_service_interface/interface";
import { UserInfoCard as UserInfoCardData } from "@phading/user_service_interface/user_info_card";
import { UserRelationship } from "@phading/user_service_interface/user_relationship";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { deleteFile, screenshot } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";

normalizeBody();

class RenderCase implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private data: UserInfoCardData,
    private screenshotPath: string,
    private screenshotGoldenPath: string,
    private screenshotDiffPath: string
  ) {}
  public async execute() {
    // Prepare
    document.body.style.width = "800px";
    let cut = new UserInfoCard(this.data, undefined);
    this.container = E.div({}, cut.body);

    // Execute
    document.body.appendChild(this.container);

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.screenshotGoldenPath,
      this.screenshotDiffPath,
      { fullPage: true }
    );
  }
  public tearDown() {
    this.container.remove();
  }
}

class UndoCase implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private getActionButtonFn: (cut: UserInfoCard) => HTMLButtonElement,
    private getUndoActionButtonFn: (cut: UserInfoCard) => HTMLButtonElement,
    private screenshotPath: string,
    private screenshotBaselinePath: string,
    private screenshotDiffPath: string
  ) {}
  public async execute() {
    // Prepare
    document.body.style.width = "800px";
    let webServiceClientMock = new (class extends WebServiceClient {
      public requestCaptured: any;
      public constructor() {
        super(undefined, undefined);
      }
      public send(request: any) {
        this.requestCaptured = request;
        return {} as any;
      }
    })();
    let cut = new UserInfoCard(
      {
        userId: "id1",
        username: "someusername",
        naturalName: "First Second",
        avatarLargePath: userImage,
      },
      webServiceClientMock
    );
    this.container = E.div({}, cut.body);
    document.body.appendChild(this.container);
    await screenshot(this.screenshotBaselinePath, { fullPage: true });
    this.getActionButtonFn(cut).click();

    // Execute
    this.getUndoActionButtonFn(cut).click();

    // Verify
    assertThat(
      webServiceClientMock.requestCaptured.body,
      eqMessage({ userId: "id1" }, SET_USER_RELATIONSHIP_REQUEST_BODY),
      "request"
    );
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.screenshotBaselinePath,
      this.screenshotDiffPath,
      { fullPage: true }
    );
    await deleteFile(this.screenshotBaselinePath);
  }
  public tearDown() {
    this.container.remove();
  }
}

TEST_RUNNER.run({
  name: "UserInfoCardTest",
  cases: [
    new RenderCase(
      "Render",
      {
        userId: "id1",
        username: "someusername",
        naturalName: "First Second",
        avatarLargePath: userImage,
      },
      path.join(__dirname, "/user_info_card_render.png"),
      path.join(__dirname, "/golden/user_info_card_render.png"),
      path.join(__dirname, "/user_info_card_render_diff.png")
    ),
    new RenderCase(
      "RenderDescription",
      {
        userId: "id1",
        username: "someusername",
        naturalName: "First Second",
        avatarLargePath: userImage,
        description:
          "some long long description some long long description some long long description some long long descriptionsome long long descriptionsome long long description some long long description some long long description some long long descriptionsome long long description some long long description",
      },
      path.join(__dirname, "/user_info_card_render_description.png"),
      path.join(__dirname, "/golden/user_info_card_render_description.png"),
      path.join(__dirname, "/user_info_card_render_description_diff.png")
    ),
    new RenderCase(
      "RenderLiked",
      {
        userId: "id1",
        username: "someusername",
        naturalName: "First Second",
        avatarLargePath: userImage,
        relationship: UserRelationship.LIKE,
      },
      path.join(__dirname, "/user_info_card_render_liked.png"),
      path.join(__dirname, "/golden/user_info_card_render_liked.png"),
      path.join(__dirname, "/user_info_card_render_liked_diff.png")
    ),
    new RenderCase(
      "RenderDisliked",
      {
        userId: "id1",
        username: "someusername",
        naturalName: "First Second",
        avatarLargePath: userImage,
        relationship: UserRelationship.DISLIKE,
      },
      path.join(__dirname, "/user_info_card_render_disliked.png"),
      path.join(__dirname, "/golden/user_info_card_render_disliked.png"),
      path.join(__dirname, "/user_info_card_render_disliked_diff.png")
    ),
    new (class implements TestCase {
      public name = "SwitchButtons";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        document.body.style.width = "800px";
        let webServiceClientMock = new (class extends WebServiceClient {
          public requestCaptured: any;
          public constructor() {
            super(undefined, undefined);
          }
          public send(request: any) {
            this.requestCaptured = request;
            return {} as any;
          }
        })();
        let cut = new UserInfoCard(
          {
            userId: "id1",
            username: "someusername",
            naturalName: "First Second",
            avatarLargePath: userImage,
          },
          webServiceClientMock
        );
        this.container = E.div({}, cut.body);
        document.body.appendChild(this.container);

        // Execute
        cut.likeButton.click();

        // Verify
        assertThat(
          webServiceClientMock.requestCaptured.body,
          eqMessage(
            { userId: "id1", relationship: UserRelationship.LIKE },
            SET_USER_RELATIONSHIP_REQUEST_BODY
          ),
          "like request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/user_info_card_liked.png"),
          path.join(__dirname, "/golden/user_info_card_liked.png"),
          path.join(__dirname, "/user_info_card_liked_diff.png"),
          { fullPage: true }
        );

        // Execute
        cut.dislikeButton.click();

        // Verify
        assertThat(
          webServiceClientMock.requestCaptured.body,
          eqMessage(
            { userId: "id1", relationship: UserRelationship.DISLIKE },
            SET_USER_RELATIONSHIP_REQUEST_BODY
          ),
          "dislike request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/user_info_card_disliked.png"),
          path.join(__dirname, "/golden/user_info_card_disliked.png"),
          path.join(__dirname, "/user_info_card_disliked_diff.png"),
          { fullPage: true }
        );

        // Execute
        cut.likeButton.click();

        // Verify
        assertThat(
          webServiceClientMock.requestCaptured.body,
          eqMessage(
            { userId: "id1", relationship: UserRelationship.LIKE },
            SET_USER_RELATIONSHIP_REQUEST_BODY
          ),
          "like request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/user_info_card_liked.png"),
          path.join(__dirname, "/golden/user_info_card_liked.png"),
          path.join(__dirname, "/user_info_card_liked_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new UndoCase(
      "UndoLike",
      (cut) => cut.likeButton,
      (cut) => cut.likedButton,
      path.join(__dirname, "/user_info_card_undo_like.png"),
      path.join(__dirname, "/user_info_card_undo_like_baseline.png"),
      path.join(__dirname, "/user_info_card_undo_like_diff.png")
    ),
    new UndoCase(
      "UndoDislike",
      (cut) => cut.dislikeButton,
      (cut) => cut.dislikedButton,
      path.join(__dirname, "/user_info_card_undo_dislike.png"),
      path.join(__dirname, "/user_info_card_undo_dislike_baseline.png"),
      path.join(__dirname, "/user_info_card_undo_dislike_diff.png")
    ),
  ],
});
