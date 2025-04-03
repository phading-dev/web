export class PageNavigator<Page, Args = any> {
  public currentPage: Page;

  public constructor(
    private addPage: (page: Page, args?: Args) => void,
    private removePage: (page: Page) => void,
    private updatePage: (page: Page, args?: Args) => void = () => {},
  ) {}

  private goToInternal = (page: Page, args?: Args): void => {
    if (this.currentPage !== page) {
      this.removePage(this.currentPage);
      this.currentPage = page;
      this.addPage(this.currentPage, args);
      this.updatePage(this.currentPage, args);
    } else {
      this.updatePage(this.currentPage, args);
    }
  };

  public goTo = this.goToInternal;

  // Once removed, all future navigations are stopped.
  public remove(): void {
    this.removePage(this.currentPage);
    this.goTo = () => {};
  }
}
