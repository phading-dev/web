import wideImage = require("./test_data/wide.jpeg");
import { LOCAL_PERSONA_STORAGE } from "../../common/local_persona_storage";
import { ListPersonaPage } from "./container";
import { ListPersonasResponse } from "@phading/user_service_interface/interface";
import { WebServiceClient } from "@selfage/web_service_client";

export class ListPersonaPageMock extends ListPersonaPage {
  public constructor() {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public send(): any {
          return {
            cards: [
              {
                id: "id1",
                imagePath: wideImage,
                name: "Persona 1",
              },
            ],
          } as ListPersonasResponse;
        }
      })(),
      LOCAL_PERSONA_STORAGE
    );
  }
}
