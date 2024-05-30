import { Player } from "./body";
import { DanmakuCanvasMock } from "./danmaku_canvas/body_mock";
import { Comment } from "@phading/comment_service_interface/show_app/comment";
import { PlayerSettings } from "@phading/product_service_interface/consumer/show_app/player_settings";
import { Show } from "@phading/product_service_interface/consumer/show_app/show";

export class PlayerMock extends Player {
  public nextVideoTimestamp: number;
  public constructor(playerSettings: PlayerSettings, show: Show) {
    super(
      undefined,
      undefined,
      (reservedBottomMargin, danmakuSettings) =>
        new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettings),
      playerSettings,
      show,
    );
  }
  public getCurrentVideoTimestamp(): number {
    return this.nextVideoTimestamp;
  }
  public addDanmaku(comments: Comment[]): void {
    super.addDanmaku(comments);
    this.danmakuCanvas.val.pause();
  }
}
