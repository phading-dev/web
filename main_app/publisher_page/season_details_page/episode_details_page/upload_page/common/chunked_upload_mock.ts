import { ChunkedUpload } from "./chunked_upload";

export class ChunkedUploadMock extends ChunkedUpload {
  public resolveFn: () => void;
  public rejectFn: (error: Error) => void;

  public constructor(blob: Blob, resumeUrl: string, byteOffset: number) {
    super(undefined, blob, resumeUrl, byteOffset);
  }

  public async upload(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.resolveFn = resolve;
      this.rejectFn = reject;
    });
  }

  public complete(): void {
    this.resolveFn();
  }

  public reject(): void {
    this.rejectFn(new Error("Fake error"));
  }

  public triggerEvent(progress: number): void {
    this.emit("progress", progress);
  }
}
