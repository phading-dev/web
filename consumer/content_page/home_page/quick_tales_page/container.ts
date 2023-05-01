import EventEmitter = require("events");
import { FilledBlockingButton } from "../../../common/blocking_button";
import { SCHEME } from "../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../../common/web_service_client";
import { MenuItem } from "../../menu_item/container";
import {
  createBackMenuItem,
  createReplyPostMenuItem,
} from "../../menu_item/factory";
import { ImagesViewerPage } from "./image_viewer_page/container";
import { QuickTaleCard } from "./quick_tale_card";
import { CARD_WIDTH } from "./styles";
import { UserInfoCard } from "./user_info_card";
import {
  getQuickTale,
  getRecommendedQuickTales,
  viewTale,
} from "@phading/tale_service_interface/client_requests";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";
import { TaleContext } from "@phading/tale_service_interface/tale_context";
import { getUserInfoCard } from "@phading/user_service_interface/client_requests";
import { UserInfoCard as UserInfoCardData } from "@phading/user_service_interface/user_info_card";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface QuickTalesPage {
  on(event: "contextLoaded", listener: () => void): this;
  on(event: "talesLoaded", listener: () => void): this;
  on(event: "back", listener: (context?: TaleContext) => void): this;
  on(event: "pin", listener: (context: TaleContext) => void): this;
  on(event: "reply", listener: (taleId: string) => void): this;
}

export class QuickTalesPage extends EventEmitter {
  private static MAX_NUM_CARDS = 30;

  // Visible for testing
  public tryLoadingButton: FilledBlockingButton;
  public quickTaleCards = new Set<QuickTaleCard>();
  public imagesViewerPage: ImagesViewerPage;
  public backMenuItem: MenuItem;
  public replyMenuItem: MenuItem;
  private body: HTMLDivElement;
  private loadingSection: HTMLDivElement;
  private loadingObserver: IntersectionObserver;
  private moreTalesLoaded: boolean;

  public constructor(
    private context: TaleContext,
    private appendBodiesFn: (bodies: Array<HTMLElement>) => void,
    private prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    private appendMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    private appendControllerBodiesFn: (
      controllerBodies: Array<HTMLElement>
    ) => void,
    private quickTaleCardFactoryFn: (
      cardData: QuickTaleCardData,
      pinned: boolean
    ) => QuickTaleCard,
    private userInfoCardFactoryFn: (cardData: UserInfoCardData) => UserInfoCard,
    protected webServiceClient: WebServiceClient
  ) {
    super();
    let loadingSectionRef = new Ref<HTMLDivElement>();
    let tryLoadingButtonRef = new Ref<FilledBlockingButton>();
    this.body = E.div(
      {
        class: "quick-tales-page",
        style: `flex-flow: column nowrap; width: 100vw; align-items: center;`,
      },
      E.divRef(
        loadingSectionRef,
        {
          class: "quick-tales-page-loading-section",
          style: `display: flex; flex-flow: column nowrap; width: ${CARD_WIDTH}; align-items: center; padding: 1rem 0; gap: 1rem; background-color: ${SCHEME.neutral4};`,
        },
        E.div(
          {
            class: "quick-tales-page-end-of-loading",
            style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.noMoreTales)
        ),
        assign(
          tryLoadingButtonRef,
          FilledBlockingButton.create(
            E.text(LOCALIZED_TEXT.tryLoadingTalesLabel)
          )
        ).body
      )
    );
    this.loadingSection = loadingSectionRef.val;
    this.tryLoadingButton = tryLoadingButtonRef.val;
    this.appendBodiesFn([this.body]);

    this.imagesViewerPage = ImagesViewerPage.create(
      this.appendBodiesFn,
      this.prependMenuBodiesFn,
      this.appendControllerBodiesFn
    );

    if (this.context.taleId) {
      this.backMenuItem = createBackMenuItem();
      this.replyMenuItem = createReplyPostMenuItem();
      this.prependMenuBodiesFn([this.backMenuItem.body]);
      this.appendMenuBodiesFn([this.replyMenuItem.body]);

      this.backMenuItem.on("action", () => this.emit("back"));
      this.replyMenuItem.on("action", () =>
        this.emit("reply", this.context.taleId)
      );
    } else if (this.context.userId) {
      this.backMenuItem = createBackMenuItem();
      this.prependMenuBodiesFn([this.backMenuItem.body]);

      this.backMenuItem.on("action", () => this.emit("back"));
    }

    this.tryLoadContext();
    this.loadingObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMoreUponReachingEnd();
      }
    });
    this.loadMoreUponReachingEnd();
    this.tryLoadingButton.on("action", () => this.loadMoreUponButtonClick());
    this.tryLoadingButton.on("postAction", () =>
      this.resumeLoadingAfterButtonClick()
    );
    this.imagesViewerPage.on("back", () => this.hideImagesViewer());
  }

  public static create(
    context: TaleContext,
    appendBodiesFn: (bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    appendMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    appendControllerBodiesFn: (controllerBodies: Array<HTMLElement>) => void
  ): QuickTalesPage {
    return new QuickTalesPage(
      context,
      appendBodiesFn,
      prependMenuBodiesFn,
      appendMenuBodiesFn,
      appendControllerBodiesFn,
      QuickTaleCard.create,
      UserInfoCard.create,
      WEB_SERVICE_CLIENT
    );
  }

  private async tryLoadContext(): Promise<void> {
    if (this.context.taleId) {
      let response = await getQuickTale(this.webServiceClient, {
        taleId: this.context.taleId,
      });
      let quickTaleCard = this.quickTaleCardFactoryFn(response.card, true);
      this.body.prepend(quickTaleCard.body);
      quickTaleCard.on("viewImages", (imageUrls, index) =>
        this.emit("viewImages", this.showImagesViewer(imageUrls, index))
      );
    } else if (this.context.userId) {
      let response = await getUserInfoCard(this.webServiceClient, {
        userId: this.context.userId,
      });
      let userInfoCard = this.userInfoCardFactoryFn(response.card);
      this.body.prepend(userInfoCard.body);
    }
    this.emit("contextLoaded");
  }

  private tryObserveLoading(): void {
    if (this.moreTalesLoaded) {
      this.loadingObserver.observe(this.loadingSection);
    }
  }

  private unobserveLoading(): void {
    this.loadingObserver.unobserve(this.loadingSection);
  }

  private async loadMoreUponReachingEnd(): Promise<void> {
    this.tryLoadingButton.disable();
    this.unobserveLoading();
    try {
      await this.loadMoreAndTryRemoveOldTales();
    } catch (e) {
      console.log(e);
    }
    this.tryLoadingButton.enable();
    this.tryObserveLoading();
  }

  public async loadMoreAndTryRemoveOldTales(): Promise<void> {
    let response = await getRecommendedQuickTales(this.webServiceClient, {
      context: this.context,
    });

    let accumulatedHeights = 0;
    let cardsToRemove = new Array<QuickTaleCard>();
    for (let card of this.quickTaleCards) {
      if (
        cardsToRemove.length <
        this.quickTaleCards.size - QuickTalesPage.MAX_NUM_CARDS
      ) {
        accumulatedHeights += card.body.scrollHeight;
        cardsToRemove.push(card);
      } else {
        break;
      }
    }
    for (let card of cardsToRemove) {
      card.remove();
      this.quickTaleCards.delete(card);
    }
    this.body.scrollBy(-accumulatedHeights, 0);

    for (let cardData of response.cards) {
      let quickTaleCard = this.quickTaleCardFactoryFn(cardData, false);
      this.body.insertBefore(quickTaleCard.body, this.loadingSection);
      this.quickTaleCards.add(quickTaleCard);
      quickTaleCard.on("pin", (context) => this.emit("pin", context));
      quickTaleCard.on("viewImages", (imageUrls, index) =>
        this.emit("viewImages", this.showImagesViewer(imageUrls, index))
      );
      this.viewTaleOnVisible(quickTaleCard);
    }
    if (response.cards.length > 0) {
      this.moreTalesLoaded = true;
    } else {
      this.moreTalesLoaded = false;
    }
    this.emit("talesLoaded");
  }

  private viewTaleOnVisible(quickTaleCard: QuickTaleCard): void {
    let observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.viewTale(quickTaleCard.cardData.metadata.taleId);
        observer.unobserve(quickTaleCard.observee);
      }
    });
    observer.observe(quickTaleCard.observee);
  }

  private async viewTale(taleId: string): Promise<void> {
    await viewTale(this.webServiceClient, { taleId });
  }

  private async loadMoreUponButtonClick(): Promise<void> {
    this.unobserveLoading();
    await this.loadMoreAndTryRemoveOldTales();
  }

  private resumeLoadingAfterButtonClick(): void {
    this.tryObserveLoading();
  }

  private showImagesViewer(imageUrls: Array<string>, index: number): void {
    if (this.backMenuItem) {
      this.backMenuItem.hide();
    }
    if (this.replyMenuItem) {
      this.replyMenuItem.hide();
    }
    this.body.style.display = "none";
    this.imagesViewerPage.show(imageUrls, index);
  }

  private hideImagesViewer(): void {
    this.imagesViewerPage.hide();
    if (this.backMenuItem) {
      this.backMenuItem.show();
    }
    if (this.replyMenuItem) {
      this.replyMenuItem.show();
    }
    this.body.style.display = "flex";
  }

  public show(): this {
    if (this.backMenuItem) {
      this.backMenuItem.show();
    }
    if (this.replyMenuItem) {
      this.replyMenuItem.show();
    }
    this.body.style.display = "flex";
    this.imagesViewerPage.hide();
    return this;
  }

  public hide(): this {
    if (this.backMenuItem) {
      this.backMenuItem.hide();
    }
    if (this.replyMenuItem) {
      this.replyMenuItem.hide();
    }
    this.body.style.display = "none";
    this.imagesViewerPage.hide();
    return this;
  }

  public remove(): void {
    if (this.backMenuItem) {
      this.backMenuItem.remove();
    }
    if (this.replyMenuItem) {
      this.replyMenuItem.remove();
    }
    this.body.remove();
    this.imagesViewerPage.remove();
  }
}
