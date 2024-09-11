import { ConsumerPageState, CONSUMER_PAGE_STATE } from './consumer_page/state';
import { PublisherPageState, PUBLISHER_PAGE_STATE } from './publisher_page/state';
import { MessageDescriptor } from '@selfage/message/descriptor';

export interface RootPageState {
  consumer?: ConsumerPageState,
  publisher?: PublisherPageState,
}

export let ROOT_PAGE_STATE: MessageDescriptor<RootPageState> = {
  name: 'RootPageState',
  fields: [{
    name: 'consumer',
    index: 1,
    messageType: CONSUMER_PAGE_STATE,
  }, {
    name: 'publisher',
    index: 2,
    messageType: PUBLISHER_PAGE_STATE,
  }],
};
