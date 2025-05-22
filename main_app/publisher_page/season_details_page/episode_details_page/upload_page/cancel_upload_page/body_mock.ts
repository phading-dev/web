import { CancelUploadPage } from "./body";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class CancelUploadPageWebServiceClientMock extends WebServiceClientMock {
  public resolveFn: () => void;

  public async send(): Promise<any> {
    await new Promise<void>((resolve) => {
      this.resolveFn = resolve;
    });
    return {};
  }
}

export class CancelUploadPageMock extends CancelUploadPage {
  public constructor(seasonId: string, episodeId: string) {
    super(
      new CancelUploadPageWebServiceClientMock(),
      seasonId,
      episodeId,
      false,
    );
  }

  public complete(): void {
    (this.serviceClient as CancelUploadPageWebServiceClientMock).resolveFn();
  }
}
