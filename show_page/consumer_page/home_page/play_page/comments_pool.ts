import EventEmitter = require("events");
import { COMMENT_SERVICE_CLIENT } from "../../../../common/web_service_client";
import { Comment } from "@phading/comment_service_interface/show_app/comment";
import { getComments } from "@phading/comment_service_interface/show_app/web/client_requests";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CommentsPool {
  on(event: "loaded", listener: () => void): this;
}

export class CommentsPool extends EventEmitter {
  public static create(showId: string): CommentsPool {
    return new CommentsPool(COMMENT_SERVICE_CLIENT, showId);
  }

  private lastTimestamp: number = 0; // ms
  private comments = new Array<Comment>();
  private lastIndex = 0;

  public constructor(
    private webServiceClient: WebServiceClient,
    private showId: string,
  ) {
    super();
    this.load();
  }

  public async load(): Promise<void> {
    let response = await getComments(this.webServiceClient, {
      showId: this.showId,
    });
    this.fill(response.comments);
    this.emit("loaded");
  }

  private fill(comments: Array<Comment>): void {
    let rightComments = comments.sort((l, r) => {
      return l.timestamp - r.timestamp;
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
      if (left.timestamp <= right.timestamp) {
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
      if (comment.timestamp < this.lastTimestamp) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    this.lastIndex = left;
  }

  public startFrom(destinationTimestamp: number /* ms */): void {
    this.lastTimestamp = destinationTimestamp;
    this.binarySearchReadPointer();
  }

  public read(currentTimestamp: number /* ms */): Array<Comment> {
    let returnComments = new Array<Comment>();
    for (
      ;
      this.lastIndex < this.comments.length &&
      this.comments[this.lastIndex].timestamp < currentTimestamp;
      this.lastIndex++
    ) {
      returnComments.push(this.comments[this.lastIndex]);
    }
    this.lastTimestamp = currentTimestamp;
    return returnComments;
  }
}
