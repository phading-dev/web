import { InfoCard } from "./body";
import { GetPricingResponse } from "@phading/commerce_service_interface/consumer/frontend/show/interface";
import { EpisodeToPlay } from "@phading/product_service_interface/consumer/frontend/show/episode_to_play";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class InfoCardMock extends InfoCard {
  public constructor(episode: EpisodeToPlay) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<GetPricingResponse> {
          return {
            money: {
              integer: 4,
              nano: 0,
            },
          };
        }
      })(),
      episode,
    );
  }
}
