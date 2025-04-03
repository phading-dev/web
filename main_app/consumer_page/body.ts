import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { SCHEME } from "../../common/color_scheme";
import { FONT_M } from "../../common/sizes";
import { ConsumerPage as ConsumerPageUrl } from "@phading/web_interface/main/consumer/page";
import { E } from "@selfage/element/factory";

export interface ConsumerPage {
  on(event: "newUrl", listener: (newUrl: ConsumerPageUrl) => void): this;
  on(event: "goToAccount", listener: () => void): this;
}

export class ConsumerPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): ConsumerPage {
    return new ConsumerPage(appendBodies);
  }

  public body: HTMLElement;

  public constructor(appendBodies: AddBodiesFn) {
    super();
    this.body = E.div(
      {
        class: "consumer-page",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.primary0};`,
      },
      E.text("Consumer page"),
    );
    appendBodies(this.body);
  }

  public applyUrl(newUrl?: ConsumerPageUrl): this {
    return this;
  }

  public remove(): void {
    this.body.remove();
  }
}
