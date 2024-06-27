import { Player } from "./body";
import { DanmakuCanvasMock } from "./danmaku_canvas/body_mock";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import { EpisodeToPlay } from "@phading/product_service_interface/consumer/frontend/show/episode_to_play";
import { PlayerSettings } from "@phading/product_service_interface/consumer/frontend/show/player_settings";

export class PlayerMock extends Player {
  public nextVideoTimestamp: number;
  public constructor(playerSettings: PlayerSettings, episode: EpisodeToPlay) {
    super(
      undefined,
      (reservedBottomMargin, danmakuSettings) =>
        new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettings),
      playerSettings,
      episode,
    );
    this.autoPlay = false;
  }
  public getCurrentVideoTimestampMs(): number {
    return this.nextVideoTimestamp;
  }
  public addDanmaku(comments: Comment[]): void {
    super.addDanmaku(comments);
    this.danmakuCanvas.val.pause();
  }
}
