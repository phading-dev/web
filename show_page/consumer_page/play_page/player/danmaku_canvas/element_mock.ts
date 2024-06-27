import { DanmakuElement } from "./element";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import { DanmakuSettings } from "@phading/product_service_interface/consumer/frontend/show/player_settings";

export class DanmakuElementMock extends DanmakuElement {
  public constructor(
    public pausedPosX: number,
    danmakuSettings: DanmakuSettings,
    comment: Comment,
  ) {
    super(
      () => 0,
      () => {},
      () => this.getComputedStyleMock(),
      danmakuSettings,
      comment,
    );
  }

  private getComputedStyleMock(): CSSStyleDeclaration {
    return { transform: `matrix(1,0,0,1,${this.pausedPosX},0)` } as any;
  }
}
