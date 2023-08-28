import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';
import { ConsumerPageState, CONSUMER_PAGE_STATE } from './consumer_page/state';
import { PublisherPageState, PUBLISHER_PAGE_STATE } from './publisher_page/state';

export enum Page {
  Unknown = 0,
  Consumer = 1,
  Publisher = 2,
  ConsumerSelection = 3,
  PublisherSelection = 4,
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
    {
      name: 'ConsumerSelection',
      value: 3,
    },
    {
      name: 'PublisherSelection',
      value: 4,
    },
  ]
}

export interface ChatPageState {
  page?: Page,
  consumer?: ConsumerPageState,
  publisher?: PublisherPageState,
}

export let CHAT_PAGE_STATE: MessageDescriptor<ChatPageState> = {
  name: 'ChatPageState',
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
