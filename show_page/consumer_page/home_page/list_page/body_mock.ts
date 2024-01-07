import coverImage = require("./test_data/cover.jpg");
import userImage = require("./test_data/user_image.jpg");
import { ListPage } from "./body";
import { ShowItem } from "./show_item";
import { RecommendShowsResponse } from "@phading/product_recommendation_service_interface/consumer/show_app/web/interface";
import { ShowSnapshot } from "@phading/product_service_interface/consumer/show_app/show";
import { Counter } from "@selfage/counter";
import { WebServiceClient } from "@selfage/web_service_client";

function createShowSnapshot(showId: string): ShowSnapshot {
  return {
    showId,
    name: `Show ${showId}`,
    coverImagePath: coverImage,
    length: 3789,
    publishedTime: 1234567890,
    publisher: {
      accountId: "account 1",
      avatarSmallPath: userImage,
      naturalName: "First second",
    },
  };
}

export class ListPageMock extends ListPage {
  public constructor() {
    super(
      ShowItem.create,
      new (class extends WebServiceClient {
        private counter = new Counter<string>();
        public constructor() {
          super(undefined, undefined);
        }
        public async send(): Promise<RecommendShowsResponse> {
          switch (this.counter.increment("send")) {
            case 1:
              let shows = new Array<ShowSnapshot>();
              for (let i = 0; i < 3; i++) {
                shows.push(createShowSnapshot(`id${i}`));
              }
              return {
                shows,
              };
            case 2:
              return {
                shows: [],
              };
            default:
              throw new Error("Not expected");
          }
        }
      })()
    );
  }
}
