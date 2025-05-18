import { WebServiceClient } from '@selfage/web_service_client';
import EventEmitter = require('events');

export class UploadPage extends EventEmitter {
  public constructor(private serviceClient: WebServiceClient) {
    super();
  }
}
