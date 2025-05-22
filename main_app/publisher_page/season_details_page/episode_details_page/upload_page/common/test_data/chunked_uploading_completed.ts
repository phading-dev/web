import video = require("./two_videos_two_audios.mp4");
import { ChunkedUpload } from "../chunked_upload";
import { E } from "@selfage/element/factory";
import {
  exit,
  getArgv,
  supplyFiles,
} from "@selfage/puppeteer_test_executor_api";
import { assertThat, eq, isArray } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let uploadSessionUrl = getArgv()[0];
  let fileInput = E.input({
    type: "file",
  });
  await supplyFiles(() => fileInput.click(), video);
  let file = fileInput.files[0];

  // Execute
  let progressBytes = new Array<number>();
  let chunkedUpload = new ChunkedUpload(
    window,
    file,
    uploadSessionUrl,
    0,
  ).on("progress", (progress) => {
    console.log(`Progress: ${progress}`);
    progressBytes.push(progress);
  });
  await chunkedUpload.upload();

  // Verify
  assertThat(
    progressBytes,
    isArray([
      eq(8388608),
      eq(16777216),
      eq(25165824),
      eq(33554432),
      eq(41943040),
      eq(42658746),
    ]),
    "progress bytes",
  );
  exit();
}

main();
