import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { SCHEME } from "../../common/color_scheme";
import { FONT_M } from "../../common/sizes";
import { PublisherPage as PublisherPageUrl } from "@phading/web_interface/main/publisher/page";
import { E } from "@selfage/element/factory";

export interface PublisherPage {
  on(event: "newUrl", listener: (newUrl: PublisherPageUrl) => void): this;
  on(event: "goToAccount", listener: () => void): this;
}

export class PublisherPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): PublisherPage {
    return new PublisherPage(appendBodies);
  }

  public body: HTMLElement;

  public constructor(appendBodies: AddBodiesFn) {
    super();
    this.body = E.div(
      {
        class: "publisher-page",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.primary0};`,
      },
      E.text("Publisher page"),
    );
    appendBodies(this.body);
  }

  public applyUrl(newUrl?: PublisherPageUrl): this {
    return this;
  }

  public remove(): void {
    this.body.remove();
  }
}
