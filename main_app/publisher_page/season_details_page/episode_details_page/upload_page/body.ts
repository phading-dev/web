import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../../common/add_bodies_fn";
import { TabNavigator } from "../../../../../common/page_navigator";
import {
  CancelUploadPage,
  CreateCancelUploadPageFn,
} from "./cancel_upload_page/body";
import { NewUploadPage } from "./new_upload_page/body";
import { ResumeUploadPage } from "./resume_upload_page/body";
import { CreateUploadingPageFn, UploadingPage } from "./uploading_page/body";
import { ResumableUploadingState } from "@phading/video_service_interface/node/video_container";

export enum Page {
  NEW_UPLOAD,
  RESUME_UPLOAD,
  UPLOADING,
  CANCEL_UPLOAD,
}

export interface PageArgs {
  error?: string;
  uploadFile?: File;
}

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

  private pageNavigator = new TabNavigator<Page, PageArgs>();
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
    this.pageNavigator.set(
      Page.NEW_UPLOAD,
      (args) => this.addNewUploadPage(args),
      () => this.newUploadPage.remove(),
    );
    this.pageNavigator.set(
      Page.RESUME_UPLOAD,
      (args) => this.addResumeUploadPage(args),
      () => this.resumeUploadPage.remove(),
    );
    this.pageNavigator.set(
      Page.UPLOADING,
      (args) => this.addUploadingPage(args),
      () => this.uploadingPage.remove(),
    );
    this.pageNavigator.set(
      Page.CANCEL_UPLOAD,
      () => this.addCancelUploadPage(),
      () => this.cancelUploadPage.remove(),
    );
    this.checkUploadingState();
  }

  private checkUploadingState(error?: string): void {
    if (this.uploadingState) {
      this.pageNavigator.goTo(Page.RESUME_UPLOAD, { error });
    } else {
      this.pageNavigator.goTo(Page.NEW_UPLOAD, { error });
    }
  }

  private addNewUploadPage(args?: PageArgs): void {
    this.newUploadPage = this.createNewUploadPage(args?.error);
    this.appendBody(this.newUploadPage.body);
    this.newUploadPage.on("back", () => this.emit("back"));
    this.newUploadPage.on("upload", (uploadFile) =>
      this.pageNavigator.goTo(Page.UPLOADING, { uploadFile }),
    );
  }

  private addResumeUploadPage(args?: PageArgs): void {
    this.resumeUploadPage = this.createResumeUploadPage(args?.error);
    this.appendBody(this.resumeUploadPage.body);
    this.resumeUploadPage.on("back", () => this.emit("back"));
    this.resumeUploadPage.on("upload", (uploadFile) =>
      this.pageNavigator.goTo(Page.UPLOADING, { uploadFile }),
    );
    this.resumeUploadPage.on("cancel", () =>
      this.pageNavigator.goTo(Page.CANCEL_UPLOAD),
    );
  }

  private addUploadingPage(args?: PageArgs): void {
    this.uploadingPage = this.createUploadingPage(
      this.seasonId,
      this.episodeId,
      args?.uploadFile,
      this.uploadingState,
    );
    this.appendBody(this.uploadingPage.body);
    this.uploadingPage.on("back", () => this.emit("back"));
    this.uploadingPage.on("reSelect", (error) =>
      this.checkUploadingState(error),
    );
    this.uploadingPage.on("cancel", () =>
      this.pageNavigator.goTo(Page.CANCEL_UPLOAD),
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
    this.pageNavigator.remove();
  }
}
