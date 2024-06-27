import { DanmakuCanvas } from "./body";
import { DanmakuElementMock } from "./element_mock";
import { DanmakuSettings } from "@phading/product_service_interface/consumer/frontend/show/player_settings";

export class DanmakuCanvasMock extends DanmakuCanvas {
  public constructor(
    pausedPosX: number,
    reservedBottomMargin: number,
    danmakuSettings: DanmakuSettings,
  ) {
    super(
      () => 0.4,
      (danmakuSettings, comment) =>
        new DanmakuElementMock(pausedPosX, danmakuSettings, comment),
      reservedBottomMargin,
      danmakuSettings,
    );
  }
}
