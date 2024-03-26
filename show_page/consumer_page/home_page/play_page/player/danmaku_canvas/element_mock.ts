import { DanmakuElement } from "./element";
import { Comment } from "@phading/comment_service_interface/show_app/comment";
import { DanmakuSettings } from "@phading/product_service_interface/consumer/show_app/player_settings";

export class DanmakuElementMock extends DanmakuElement {
  public constructor(
    public pausedPosX: number,
    danmakuSettings: DanmakuSettings,
    comment: Comment
  ) {
    super(
      undefined,
      () => 0,
      () => {},
      () => this.getComputedStyleMock(),
      danmakuSettings,
      comment
    );
  }

  private getComputedStyleMock(): CSSStyleDeclaration {
    return { transform: `matrix(1,0,0,1,${this.pausedPosX},0)` } as any;
  }
}
