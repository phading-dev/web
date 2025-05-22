import { ChunkedUpload } from "./chunked_upload";

export class ChunkedUploadMock extends ChunkedUpload {
  public resolveFn: () => void;

  public constructor(blob: Blob, resumeUrl: string, byteOffset: number) {
    super(undefined, blob, resumeUrl, byteOffset);
  }

  public async upload(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.resolveFn = resolve;
    });
  }

  public complete(): void {
    this.resolveFn();
  }

  public triggerEvent(progress: number): void {
    this.emit("progress", progress);
  }
}
