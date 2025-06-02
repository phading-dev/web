import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../../common/add_bodies_fn";
import { TabSwitcher } from "../../../../../common/page_navigator";
import {
  CancelUploadPage,
  CreateCancelUploadPageFn,
} from "./cancel_upload_page/body";
import { NewUploadPage } from "./new_upload_page/body";
import { ResumeUploadPage } from "./resume_upload_page/body";
import { CreateUploadingPageFn, UploadingPage } from "./uploading_page/body";
import { ResumableUploadingState } from "@phading/video_service_interface/node/video_container";

export interface UploadPage {
  on(event: "back", listener: () => void): this;
}

export class UploadPage extends EventEmitter {
  public static create(
    appendBody: AddBodiesFn,
    seasonId: string,
    episodeId: string,
    uploadingState?: ResumableUploadingState,
  ): UploadPage {
    return new UploadPage(
      NewUploadPage.create,
      ResumeUploadPage.create,
      UploadingPage.create,
      CancelUploadPage.create,
      appendBody,
      seasonId,
      episodeId,
      uploadingState,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public newUploadPage: NewUploadPage;
  public resumeUploadPage: ResumeUploadPage;
  public uploadingPage: UploadingPage;
  public cancelUploadPage: CancelUploadPage;

  public constructor(
    private createNewUploadPage: (error?: string) => NewUploadPage,
    private createResumeUploadPage: (error?: string) => ResumeUploadPage,
    private createUploadingPage: CreateUploadingPageFn,
    private createCancelUploadPage: CreateCancelUploadPageFn,
    private appendBody: AddBodiesFn,
    private seasonId: string,
    private episodeId: string,
    private uploadingState?: ResumableUploadingState,
  ) {
    super();
    this.checkUploadingState();
  }

  private checkUploadingState(error?: string): void {
    if (this.uploadingState) {
      this.pageSwitcher.goTo(
        () => this.addResumeUploadPage(error),
        () => this.resumeUploadPage.remove(),
      );
    } else {
      this.pageSwitcher.goTo(
        () => this.addNewUploadPage(error),
        () => this.newUploadPage.remove(),
      );
    }
  }

  private addNewUploadPage(error?: string): void {
    this.newUploadPage = this.createNewUploadPage(error);
    this.appendBody(this.newUploadPage.body);
    this.newUploadPage.on("back", () => this.emit("back"));
    this.newUploadPage.on("upload", (uploadFile) =>
      this.pageSwitcher.goTo(
        () => this.addUploadingPage(uploadFile),
        () => this.uploadingPage.remove(),
      ),
    );
  }

  private addResumeUploadPage(error?: string): void {
    this.resumeUploadPage = this.createResumeUploadPage(error);
    this.appendBody(this.resumeUploadPage.body);
    this.resumeUploadPage.on("back", () => this.emit("back"));
    this.resumeUploadPage.on("upload", (uploadFile) =>
      this.pageSwitcher.goTo(
        () => this.addUploadingPage(uploadFile),
        () => this.uploadingPage.remove(),
      ),
    );
    this.resumeUploadPage.on("cancel", () =>
      this.pageSwitcher.goTo(
        () => this.addCancelUploadPage(),
        () => this.cancelUploadPage.remove(),
      ),
    );
  }

  private addUploadingPage(file: File): void {
    this.uploadingPage = this.createUploadingPage(
      this.seasonId,
      this.episodeId,
      file,
      this.uploadingState,
    );
    this.appendBody(this.uploadingPage.body);
    this.uploadingPage.on("back", () => this.emit("back"));
    this.uploadingPage.on("reSelect", (error) =>
      this.checkUploadingState(error),
    );
    this.uploadingPage.on("cancel", () =>
      this.pageSwitcher.goTo(
        () => this.addCancelUploadPage(),
        () => this.cancelUploadPage.remove(),
      ),
    );
  }

  private addCancelUploadPage(): void {
    this.cancelUploadPage = this.createCancelUploadPage(
      this.seasonId,
      this.episodeId,
    );
    this.appendBody(this.cancelUploadPage.body);
    this.cancelUploadPage.on("restart", () => {
      this.uploadingState = undefined;
      this.checkUploadingState();
    });
  }

  public remove(): void {
    this.pageSwitcher.remove();
  }
}
