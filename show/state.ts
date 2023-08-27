import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';
import { ConsumerState, CONSUMER_STATE } from './consumer/state';
import { PublisherState, PUBLISHER_STATE } from './publisher/state';

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

export interface ShowAppState {
  page?: Page,
  consumer?: ConsumerState,
  publisher?: PublisherState,
}

export let SHOW_APP_STATE: MessageDescriptor<ShowAppState> = {
  name: 'ShowAppState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
    {
      name: 'consumer',
      messageType: CONSUMER_STATE,
    },
    {
      name: 'publisher',
      messageType: PUBLISHER_STATE,
    },
  ]
};
