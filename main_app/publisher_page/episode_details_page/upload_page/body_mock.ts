import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { UploadPage } from "./body";
import { NewUploadPage } from "./new_upload_page/body";
import { ResumeUploadPage } from "./resume_upload_page/body";
import { ResumableUploadingState } from "@phading/video_service_interface/node/video_container";

export class UploadPageMock extends UploadPage {
  public constructor(
    getNowDate: () => Date,
    appendBodies: AddBodiesFn,
    seasonId: string,
    episodeId: string,
    uploadingState?: ResumableUploadingState,
  ) {
    super(
      (error) => new NewUploadPage(getNowDate, error),
      (error) => new ResumeUploadPage(error),
      undefined,
      undefined,
      appendBodies,
      seasonId,
      episodeId,
      uploadingState,
    );
  }
}
