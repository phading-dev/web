import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';
import { HomePageState, HOME_PAGE_STATE } from './home_page/state';
import { AccountPageState, ACCOUNT_PAGE_STATE } from './account_page/state';

export enum Page {
  Home = 1,
  Account = 2,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'Home',
      value: 1,
    },
    {
      name: 'Account',
      value: 2,
    },
  ]
}

export interface ContentPageState {
  page?: Page,
  home?: HomePageState,
  account?: AccountPageState,
}

export let CONTENT_PAGE_STATE: MessageDescriptor<ContentPageState> = {
  name: 'ContentPageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
    {
      name: 'home',
      messageType: HOME_PAGE_STATE,
    },
    {
      name: 'account',
      messageType: ACCOUNT_PAGE_STATE,
    },
  ]
};
