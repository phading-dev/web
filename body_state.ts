import { MessageDescriptor } from '@selfage/message/descriptor';
import { AppType, APP_TYPE } from './app_type';
import { ChatPageState, CHAT_PAGE_STATE } from './chat_page/state';
import { ShowPageState, SHOW_PAGE_STATE } from './show_page/state';

export interface BodyState {
  app?: AppType,
  chat?: ChatPageState,
  show?: ShowPageState,
}

export let BODY_STATE: MessageDescriptor<BodyState> = {
  name: 'BodyState',
  fields: [
    {
      name: 'app',
      enumType: APP_TYPE,
    },
    {
      name: 'chat',
      messageType: CHAT_PAGE_STATE,
    },
    {
      name: 'show',
      messageType: SHOW_PAGE_STATE,
    },
  ]
};
