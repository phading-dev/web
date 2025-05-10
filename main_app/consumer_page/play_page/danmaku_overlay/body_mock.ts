import { DanmakuOverlay } from "./body";
import { DanmakuEntryMock } from "./danmaku_entry_mock";
import { CommentOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";

export class DanmakuOverlayMock extends DanmakuOverlay {
  public constructor(pausedPosX: number, settings: CommentOverlaySettings) {
    super(
      (settings, comment) =>
        new DanmakuEntryMock(pausedPosX, settings, comment),
      () => 0.4,
      settings,
    );
  }
}
