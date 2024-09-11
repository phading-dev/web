import { PrimitiveType, MessageDescriptor } from '@selfage/message/descriptor';

export interface RecommendationPageState {
  query?: string,
  accountId?: string,
}

export let RECOMMENDATION_PAGE_STATE: MessageDescriptor<RecommendationPageState> = {
  name: 'RecommendationPageState',
  fields: [{
    name: 'query',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'accountId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }],
};
