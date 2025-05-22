import EventEmitter = require("events");
import { SCHEME } from "../../../../../../common/color_scheme";
import { createLoadingIcon } from "../../../../../../common/icons";
import { PAGE_CENTER_CARD_BACKGROUND_STYLE } from "../../../../../../common/page_style";
import { ICON_XXL } from "../../../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../../../common/web_service_client";
import { newCancelUploadingRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { E } from "@selfage/element/factory";
import { WebServiceClient } from "@selfage/web_service_client";

export type CreateCancelUploadPageFn = (
  seasonId: string,
  episodeId: string,
) => CancelUploadPage;

export interface CancelUploadPage {
  on(event: "restart", listener: () => void): this;
}

export class CancelUploadPage extends EventEmitter {
  public static create(seasonId: string, episodeId: string): CancelUploadPage {
    return new CancelUploadPage(SERVICE_CLIENT, seasonId, episodeId);
  }

  public body: HTMLDivElement;

  public constructor(
    protected serviceClient: WebServiceClient,
    private seasonId: string,
    private episodeId: string,
    withAnimation: boolean = true,
  ) {
    super();
    this.body = E.div(
      {
        style: PAGE_CENTER_CARD_BACKGROUND_STYLE,
      },
      E.div(
        {
          class: "cancel-upload-page-loading",
          style: `width: ${ICON_XXL}rem; height: ${ICON_XXL}rem;`,
        },
        createLoadingIcon(SCHEME.neutral1, withAnimation),
      ),
    );
    this.cancel();
  }

  private async cancel() {
    await this.serviceClient.send(
      newCancelUploadingRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
      }),
    );
    this.emit("restart");
  }

  public remove(): void {
    this.body.remove();
  }
}
