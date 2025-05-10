import { DanmakuEntry } from "./danmaku_entry";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { CommentOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";

export class DanmakuEntryMock extends DanmakuEntry {
  public constructor(
    public pausedPosX: number,
    settings: CommentOverlaySettings,
    comment: Comment,
  ) {
    super(
      (callback, delay) => window.setTimeout(callback, delay),
      (id) => window.clearTimeout(id),
      (element) => window.getComputedStyle(element),
      settings,
      comment,
    );
  }

  protected getPosXComputed(): number {
    return this.pausedPosX;
  }
}
