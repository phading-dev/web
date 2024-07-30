import { MessageDescriptor } from '@selfage/message/descriptor';
import { ConsumerPageState, CONSUMER_PAGE_STATE } from './consumer_page/state';
import { PublisherPageState, PUBLISHER_PAGE_STATE } from './publisher_page/state';

export interface RootPageState {
  consumer?: ConsumerPageState,
  publisher?: PublisherPageState,
}

export let ROOT_PAGE_STATE: MessageDescriptor<RootPageState> = {
  name: 'RootPageState',
  fields: [
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
