import { MessageDescriptor, PrimitiveType } from '@selfage/message/descriptor';

export interface RecommendationPageState {
  query?: string,
  accountId?: string,
}

export let RECOMMENDATION_PAGE_STATE: MessageDescriptor<RecommendationPageState> = {
  name: 'RecommendationPageState',
  fields: [
    {
      name: 'query',
      primitiveType: PrimitiveType.STRING,
    },
    {
      name: 'accountId',
      primitiveType: PrimitiveType.STRING,
    },
  ]
};
