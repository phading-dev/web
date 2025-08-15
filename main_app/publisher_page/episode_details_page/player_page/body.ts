import EventEmitter = require("events");
import Hls from "hls.js";
import { IconButton, createBackButton } from "../../../../common/button";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { ePageWithTopDownCard } from "../../../../common/page_elements";
import {
  GAP_1X,
  ICON_BUTTON_L,
  PAGE_MAX_WIDTH_L,
} from "../../../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface PlayerPage {
  on(event: "back", listener: () => void): this;
}

export class PlayerPage extends EventEmitter {
  public static create(videoUrl: string): PlayerPage {
    return new PlayerPage(videoUrl);
  }

  public body: HTMLDivElement;
  public backButton = new Ref<IconButton>();
  private video = new Ref<HTMLVideoElement>();
  private hls: Hls;

  public constructor(public videoUrl: string) {
    super();
    this.body = ePageWithTopDownCard(
      new Ref<HTMLDivElement>(),
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${ICON_BUTTON_L}rem ${GAP_1X}rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem ${GAP_1X}rem;`,
      assign(this.backButton, createBackButton()).body,
      E.videoRef(this.video, {
        class: "episode-details-video-player",
        style: `width: 100%; object-fit: contain;`,
        controls: "true",
      }),
    );
    this.hls = new Hls();
    this.hls.loadSource(videoUrl);
    this.hls.attachMedia(this.video.val);
    this.backButton.val.addAction(() => this.emit("back"));
  }

  public remove(): void {
    this.video.val.pause();
    this.hls.destroy();
    this.body.remove();
  }
}
