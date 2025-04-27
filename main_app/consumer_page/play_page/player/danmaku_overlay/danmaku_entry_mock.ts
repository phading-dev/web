import { DanmakuEntry } from "./danmaku_entry";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { ChatOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";

export class DanmakuEntryMock extends DanmakuEntry {
  public constructor(
    public pausedPosX: number,
    settings: ChatOverlaySettings,
    comment: Comment,
  ) {
    super(
      () => 0,
      () => {},
      () => this.getComputedStyleMock(),
      settings,
      comment,
    );
  }

  private getComputedStyleMock(): CSSStyleDeclaration {
    return { transform: `matrix(1,0,0,1,${this.pausedPosX},0)` } as any;
  }
}
