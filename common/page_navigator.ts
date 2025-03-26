export class PageNavigator<Page> {
  private currentPage: Page;

  public constructor(
    private addPage: (page: Page) => void,
    private removePage: (page: Page) => void,
    private updatePage: (page: Page) => void = () => {},
  ) {}

  private goToInternal = (page: Page): void => {
    if (this.currentPage !== page) {
      this.removePage(this.currentPage);
      this.currentPage = page;
      this.addPage(this.currentPage);
    } else {
      this.updatePage(this.currentPage);
    }
  };

  public goTo = this.goToInternal;

  // Once removed, all future navigations are stopped.
  public remove(): void {
    this.removePage(this.currentPage);
    this.goTo = () => {};
  }
}
