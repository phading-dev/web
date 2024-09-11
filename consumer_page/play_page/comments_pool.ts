import EventEmitter = require("events");
import { COMMENT_SERVICE_CLIENT } from "../../common/web_service_client";
import { getComments } from "@phading/comment_service_interface/frontend/show/client";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CommentsPool {
  on(event: "loaded", listener: () => void): this;
}

export class CommentsPool extends EventEmitter {
  public static create(episodeId: string): CommentsPool {
    return new CommentsPool(COMMENT_SERVICE_CLIENT, episodeId);
  }

  private lastTimestampMs: number = 0;
  private comments = new Array<Comment>();
  private lastIndex = 0;

  public constructor(
    private webServiceClient: WebServiceClient,
    private episodeId: string,
  ) {
    super();
    this.load();
  }

  public async load(): Promise<void> {
    let response = await getComments(this.webServiceClient, {
      episodeId: this.episodeId,
    });
    this.fill(response.comments);
    this.emit("loaded");
  }

  private fill(comments: Array<Comment>): void {
    let rightComments = comments.sort((l, r) => {
      return l.timestampMs - r.timestampMs;
    });
    let leftComments = this.comments;
    this.comments = [];
    let leftPointer = 0;
    let rightPointer = 0;
    while (
      leftPointer < leftComments.length &&
      rightPointer < rightComments.length
    ) {
      let left = leftComments[leftPointer];
      let right = rightComments[rightPointer];
      if (left.timestampMs <= right.timestampMs) {
        this.comments.push(left);
        leftPointer++;
      } else {
        this.comments.push(right);
        rightPointer++;
      }
    }
    for (; leftPointer < leftComments.length; leftPointer++) {
      this.comments.push(leftComments[leftPointer]);
    }
    for (; rightPointer < rightComments.length; rightPointer++) {
      this.comments.push(rightComments[rightPointer]);
    }

    this.binarySearchReadPointer();
  }

  private binarySearchReadPointer(): void {
    let left = 0;
    let right = this.comments.length;
    while (left < right) {
      let mid = Math.floor((left + right) / 2);
      let comment = this.comments[mid];
      if (comment.timestampMs < this.lastTimestampMs) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    this.lastIndex = left;
  }

  public startFrom(destinationTimestampMs: number): void {
    this.lastTimestampMs = destinationTimestampMs;
    this.binarySearchReadPointer();
  }

  public read(currentTimestampMs: number): Array<Comment> {
    let returnComments = new Array<Comment>();
    for (
      ;
      this.lastIndex < this.comments.length &&
      this.comments[this.lastIndex].timestampMs < currentTimestampMs;
      this.lastIndex++
    ) {
      returnComments.push(this.comments[this.lastIndex]);
    }
    this.lastTimestampMs = currentTimestampMs;
    return returnComments;
  }
}
