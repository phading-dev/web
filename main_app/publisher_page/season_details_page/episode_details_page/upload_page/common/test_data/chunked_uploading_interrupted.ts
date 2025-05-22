import video = require("./two_videos_two_audios.mp4");
import { ChunkedUpload } from "../chunked_upload";
import { E } from "@selfage/element/factory";
import {
  exit,
  getArgv,
  supplyFiles,
} from "@selfage/puppeteer_test_executor_api";
import { assertReject } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let uploadSessionUrl = getArgv()[0];
  let fileInput = E.input({
    type: "file",
  });
  await supplyFiles(() => fileInput.click(), video);
  let file = fileInput.files[0];

  // Execute
  let chunkedUpload = new ChunkedUpload(
    window,
    file,
    uploadSessionUrl,
    0,
  );
  let uploadPromise = chunkedUpload.upload();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  chunkedUpload.stop();

  // Verify
  await assertReject(uploadPromise);
  exit();
}

main();
