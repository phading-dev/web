import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';
import { ConsumerPageState, CONSUMER_PAGE_STATE } from './consumer_page/state';
import { PublisherPageState, PUBLISHER_PAGE_STATE } from './publisher_page/state';

export enum Page {
  Unknown = 0,
  Consumer = 1,
  Publisher = 2,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'Unknown',
      value: 0,
    },
    {
      name: 'Consumer',
      value: 1,
    },
    {
      name: 'Publisher',
      value: 2,
    },
  ]
}

export interface ShowPageState {
  page?: Page,
  consumer?: ConsumerPageState,
  publisher?: PublisherPageState,
}

export let SHOW_PAGE_STATE: MessageDescriptor<ShowPageState> = {
  name: 'ShowPageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
    {
      name: 'consumer',
      messageType: CONSUMER_PAGE_STATE,
    },
    {
      name: 'publisher',
      messageType: PUBLISHER_PAGE_STATE,
    },
  ]
};
