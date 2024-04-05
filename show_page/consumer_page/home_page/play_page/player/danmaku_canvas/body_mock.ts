import { DanmakuCanvas } from "./body";
import { DanmakuElementMock } from "./element_mock";
import { DanmakuSettings } from "@phading/product_service_interface/consumer/show_app/player_settings";

export class DanmakuCanvasMock extends DanmakuCanvas {
  public constructor(
    reservedBottomMargin: number,
    pausedPosX: number,
    danmakuSettings: DanmakuSettings
  ) {
    super(
      () => 0.4,
      (danmakuSettings, comment) =>
        new DanmakuElementMock(pausedPosX, danmakuSettings, comment),
      reservedBottomMargin,
      danmakuSettings
    );
  }
}
