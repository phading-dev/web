import { ChunkedUploadMock } from "../common/chunked_upload_mock";
import { UploadingPage } from "./body";
import { StartUploadingResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { ResumableUploadingState } from "@phading/video_service_interface/node/video_container";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class UploadingPageMock extends UploadingPage {
  public constructor(
    seasonId: string,
    episodeId: string,
    file: File,
    uploadingState?: ResumableUploadingState,
  ) {
    super(
      (blob, resumeUrl, byteOffset) =>
        new ChunkedUploadMock(blob, resumeUrl, byteOffset),
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          let response: StartUploadingResponse = {
            uploadSessionUrl: "https://example.com/upload",
            byteOffset: 0,
          };
          return response;
        }
      })(),
      () => new Date("2023-01-01"),
      seasonId,
      episodeId,
      file,
      uploadingState,
    );
  }

  public complete(): void {
    (this.chunkedUpload as ChunkedUploadMock).complete();
  }
}
