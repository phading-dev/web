import { AT_USER } from "../../../common/at_user";
import {
  FILLED_BUTTON_STYLE,
  OUTLINE_BUTTON_STYLE,
} from "../../../common/button_styles";
import { SCHEME } from "../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../../common/web_service_client";
import { CARD_WIDTH } from "./styles";
import { setUserRelationship } from "@phading/user_service_interface/client_requests";
import { UserInfoCard as UserInfoCardData } from "@phading/user_service_interface/user_info_card";
import { UserRelationship } from "@phading/user_service_interface/user_relationship";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export class UserInfoCard {
  public body: HTMLDivElement;
  // Visible for testing
  public likeButton: HTMLButtonElement;
  public likedButton: HTMLButtonElement;
  public dislikeButton: HTMLButtonElement;
  public dislikedButton: HTMLButtonElement;

  public constructor(
    private cardData: UserInfoCardData,
    private webServiceClient: WebServiceClient
  ) {
    let likeButtonRef = new Ref<HTMLButtonElement>();
    let likedButtonRef = new Ref<HTMLButtonElement>();
    let dislikeButtonRef = new Ref<HTMLButtonElement>();
    let dislikedButtonRef = new Ref<HTMLButtonElement>();
    this.body = E.div(
      {
        class: "user-info-card",
        style: `display: flex; flex-flow: column nowrap; box-sizing: border-box; width: ${CARD_WIDTH}; padding: 1.2rem; gap: 1rem; align-items: center; border-bottom: .1rem solid ${SCHEME.neutral2}; background-color: ${SCHEME.neutral4};`,
      },
      E.image({
        class: "user-info-card-avatar",
        style: `width: 12rem; height: 12rem; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral2}; border-radius: 16rem;`,
        src: this.cardData.avatarLargePath,
      }),
      E.div(
        {
          class: "user-info-card-names",
        },
        E.div(
          {
            class: "user-info-card-natural-name",
            style: `display: inline-block; margin-right: .5rem; font-size: 1.6rem; color: ${SCHEME.neutral0};`,
          },
          E.text(this.cardData.naturalName)
        ),
        E.div(
          {
            class: "user-info-card-username",
            style: `display: inline-block; font-size: 1.6rem; color: ${SCHEME.neutral0};`,
          },
          E.text(`${AT_USER}${this.cardData.username}`)
        )
      ),
      E.div(
        {
          class: "user-info-card-description",
          style: `font-size: 1.6rem; color: ${SCHEME.neutral0}; align-self: flex-start;`,
        },
        E.text(this.cardData.description ?? LOCALIZED_TEXT.noUserDescription)
      ),
      E.div(
        {
          class: "user-info-card-actions",
          style: `display: flex; flex-flow: row-reverse nowrap; gap: 1.8rem; align-items: center; margin: .6rem 0 .8rem;`,
        },
        E.buttonRef(
          likeButtonRef,
          {
            class: "user-info-card-like-button",
            style: `${OUTLINE_BUTTON_STYLE} color: ${
              SCHEME.neutral0
            }; border-color: ${SCHEME.neutral1}; display: ${
              this.cardData.relationship === UserRelationship.LIKE
                ? "none"
                : "block"
            };`,
          },
          E.text(LOCALIZED_TEXT.likeUserLabel)
        ),
        E.buttonRef(
          likedButtonRef,
          {
            class: "user-info-card-liked-button",
            style: `${FILLED_BUTTON_STYLE} background-color: ${
              SCHEME.primary1
            }; display: ${
              this.cardData.relationship === UserRelationship.LIKE
                ? "block"
                : "none"
            };`,
          },
          E.text(LOCALIZED_TEXT.likedUserLabel)
        ),
        E.buttonRef(
          dislikeButtonRef,
          {
            class: "user-info-card-dislike-button",
            style: `${OUTLINE_BUTTON_STYLE} color: ${
              SCHEME.neutral0
            }; border-color: ${SCHEME.neutral1}; display: ${
              this.cardData.relationship === UserRelationship.DISLIKE
                ? "none"
                : "block"
            };`,
          },
          E.text(LOCALIZED_TEXT.dislikeUserLabel)
        ),
        E.buttonRef(
          dislikedButtonRef,
          {
            class: "user-info-card-disliked-button",
            style: `${FILLED_BUTTON_STYLE} background-color: ${
              SCHEME.primary1
            }; display: ${
              this.cardData.relationship === UserRelationship.DISLIKE
                ? "block"
                : "none"
            };`,
          },
          E.text(LOCALIZED_TEXT.dislikedUserLabel)
        )
      )
    );
    this.likeButton = likeButtonRef.val;
    this.likedButton = likedButtonRef.val;
    this.dislikeButton = dislikeButtonRef.val;
    this.dislikedButton = dislikedButtonRef.val;

    this.likeButton.addEventListener("click", () => this.like());
    this.likedButton.addEventListener("click", () => this.unlike());
    this.dislikeButton.addEventListener("click", () => this.dislike());
    this.dislikedButton.addEventListener("click", () => this.undislike());
  }

  public static create(cardData: UserInfoCardData): UserInfoCard {
    return new UserInfoCard(cardData, WEB_SERVICE_CLIENT);
  }

  private async like(): Promise<void> {
    this.resetAllButtons();
    this.likeButton.style.display = "none";
    this.likedButton.style.display = "block";
    await this.setUserRelationship(UserRelationship.LIKE);
  }

  private async setUserRelationship(
    relationship?: UserRelationship
  ): Promise<void> {
    await setUserRelationship(this.webServiceClient, {
      userId: this.cardData.userId,
      relationship,
    });
  }

  private resetAllButtons(): void {
    this.likeButton.style.display = "block";
    this.likedButton.style.display = "none";
    this.dislikeButton.style.display = "block";
    this.dislikedButton.style.display = "none";
  }

  private async unlike(): Promise<void> {
    this.likeButton.style.display = "block";
    this.likedButton.style.display = "none";
    await this.setUserRelationship();
  }

  private async dislike(): Promise<void> {
    this.resetAllButtons();
    this.dislikeButton.style.display = "none";
    this.dislikedButton.style.display = "block";
    await this.setUserRelationship(UserRelationship.DISLIKE);
  }

  private async undislike(): Promise<void> {
    this.dislikeButton.style.display = "block";
    this.dislikedButton.style.display = "none";
    await this.setUserRelationship();
  }

  public remove(): void {
    this.body.remove();
  }
}
