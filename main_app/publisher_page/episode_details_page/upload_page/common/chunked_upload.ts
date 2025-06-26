import EventEmitter = require("events");
import { HttpError } from "@selfage/http_error";
import { ENV_VARS } from "../../../../../env_vars";

export interface ChunkedUpload {
  on(event: "progress", listener: (byteOffset: number) => void): this;
}

export class ChunkedUpload extends EventEmitter {
  public static create(
    blob: Blob,
    resumeUrl: string,
    byteOffset: number,
    chunkSize: number = ChunkedUpload.DEFAULT_CHUNK_SIZE_BYTES,
  ): ChunkedUpload {
    return new ChunkedUpload(
      window,
      ENV_VARS.externalOrigin,
      blob,
      resumeUrl,
      byteOffset,
      chunkSize,
    );
  }

  private static INCOMPLETE_ERROR_CODE = 308;
  private static DEFAULT_CHUNK_SIZE_BYTES = 8 * 1024 * 1024; // Must be a multiple of 256 x 1024.

  private abortController = new AbortController();

  public constructor(
    private window: Window,
    private externalOrigin: string,
    public blob: Blob,
    public resumeUrl: string,
    public byteOffset: number,
    private chunkSize: number = ChunkedUpload.DEFAULT_CHUNK_SIZE_BYTES,
  ) {
    super();
  }

  public async upload(): Promise<void> {
    while (this.byteOffset < this.blob.size) {
      let newOffset = Math.min(
        this.byteOffset + this.chunkSize,
        this.blob.size,
      );
      let chunkBlob = this.blob.slice(this.byteOffset, newOffset);
      let responsePromise = this.window.fetch(this.resumeUrl, {
        method: "PUT",
        headers: {
          "Content-Length": `${newOffset - this.byteOffset}`,
          "Content-Range": `bytes ${this.byteOffset}-${newOffset - 1}/${this.blob.size}`,
          "Origin": this.externalOrigin,
        },
        signal: this.abortController.signal,
        body: chunkBlob,
      });
      if (newOffset === this.blob.size) {
        // Last chunk.
        await responsePromise;
      } else {
        let response = await responsePromise;
        if (response.status !== ChunkedUpload.INCOMPLETE_ERROR_CODE) {
          throw new HttpError(response.status, response.statusText);
        }
      }
      this.byteOffset = newOffset;
      this.emit("progress", this.byteOffset);
    }
  }

  public async stop(): Promise<void> {
    this.abortController.abort(new Error("Upload stopped by user"));
  }
}
