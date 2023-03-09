import userImage = require("./test_data/user_image.jpg");
import { QuickTalesPage } from "./container";
import { QuickTaleCardMock } from "./quick_tale_card_mock";
import { UserInfoCardMock } from "./user_info_card_mock";
import {
  GET_QUICK_TALE,
  GET_RECOMMENDED_QUICK_TALES,
  GetQuickTaleResponse,
  GetRecommendedQuickTalesResponse,
  VIEW_TALE,
  ViewTaleResponse,
} from "@phading/tale_service_interface/interface";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";
import { TaleContext } from "@phading/tale_service_interface/tale_context";
import {
  GET_USER_INFO_CARD,
  GetUserInfoCardResponse,
} from "@phading/user_service_interface/interface";
import { UserInfoCard as UserInfoCardData } from "@phading/user_service_interface/user_info_card";
import { WebServiceClient } from "@selfage/web_service_client";

function createCardData(taleId: number): QuickTaleCardData {
  return {
    metadata: {
      taleId: `tale${taleId}`,
      userId: `user1`,
      username: "some-username",
      userNatureName: "First Second",
      createdTimestamp: Date.parse("2022-10-11"),
      avatarSmallPath: userImage,
    },
    text: `some text ${taleId}`,
  };
}

export interface QuickTalesPageMockData {
  startingTaleId: number;
  pinnedTaleId?: number;
  userInfoCardData?: UserInfoCardData;
}

export class QuickTalesPageMock extends QuickTalesPage {
  public constructor(
    context: TaleContext,
    appendBodiesFn: (bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    appendMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    appendControllerBodiesFn: (controllerBodies: Array<HTMLElement>) => void,
    mockData: QuickTalesPageMockData
  ) {
    super(
      context,
      appendBodiesFn,
      prependMenuBodiesFn,
      appendMenuBodiesFn,
      appendControllerBodiesFn,
      (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
      (cardData) => new UserInfoCardMock(cardData),
      new (class extends WebServiceClient {
        private taleId = mockData.startingTaleId;
        public constructor() {
          super(undefined, undefined);
        }
        public send(request: any): any {
          if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
            let cards = new Array<QuickTaleCardData>();
            for (let i = 0; i < 20; i++, this.taleId++) {
              cards.push(createCardData(this.taleId));
            }
            return {
              cards,
            } as GetRecommendedQuickTalesResponse;
          } else if (request.descriptor === VIEW_TALE) {
            return {} as ViewTaleResponse;
          } else if (request.descriptor === GET_QUICK_TALE) {
            return {
              card: createCardData(mockData.pinnedTaleId),
            } as GetQuickTaleResponse;
          } else if (request.descriptor === GET_USER_INFO_CARD) {
            return {
              card: mockData.userInfoCardData,
            } as GetUserInfoCardResponse;
          }
        }
      })()
    );
  }
}
