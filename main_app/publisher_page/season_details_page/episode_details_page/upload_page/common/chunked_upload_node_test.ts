import "../../../../../../dev/env";
import path = require("path");
import { ENV_VARS } from "../../../../../../env_vars";
import { runInPuppeteer } from "@selfage/bundler_cli/runner_in_puppeteer";
import { assertThat, eq } from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import { execSync } from "child_process";
import { fstatSync, openSync } from "fs";
import { GoogleAuth } from "google-auth-library";

let TEST_BUCKET_NAME = "phading-test-video-bucket-for-web-2";
let BUCKET_LOCATION = "us-central1";
let PORT = 8080;

async function createUploadUrl(
  gcsFilename: string,
  contentLength: number,
): Promise<string> {
  let googleAuth = new GoogleAuth({
    projectId: ENV_VARS.projectId,
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  let response = await googleAuth.request({
    method: "POST",
    url: `https://storage.googleapis.com/upload/storage/v1/b/${TEST_BUCKET_NAME}/o?uploadType=resumable&name=${gcsFilename}`,
    headers: {
      "Content-Length": 0,
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": contentLength,
    },
  });
  return response.headers.location;
}

TEST_RUNNER.run({
  name: "ChunkedUploadTest",
  environment: {
    setUp: () => {
      execSync(
        `gcloud storage buckets create gs://${TEST_BUCKET_NAME} --project ${ENV_VARS.projectId} --location ${BUCKET_LOCATION}`,
        {
          stdio: "inherit",
        },
      );
    },
    tearDown: () => {
      execSync(`gcloud storage rm -r gs://${TEST_BUCKET_NAME}`, {
        stdio: "inherit",
      });
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "RealUpload";
      public async execute() {
        // Prepare
        let gcsFilename = "test_video.mp4";
        let file = fstatSync(
          openSync(
            path.join(__dirname, "./test_data/two_videos_two_audios.mp4"),
            "r",
          ),
        );
        let uploadSessionUrl = await createUploadUrl(gcsFilename, file.size);

        // Execute & Verify
        await runInPuppeteer(
          path.join(__dirname, "./test_data/chunked_uploading_completed"),
          ".",
          PORT,
          true,
          {
            debug: true,
            skipMinify: true,
          },
          [uploadSessionUrl],
        );
        assertThat(process.exitCode, eq(0), "test status");
      }
    })(),
    new (class implements TestCase {
      public name = "RealUploadInterrupted";
      public async execute() {
        // Prepare
        let gcsFilename = "test_video2.mp4";
        let file = fstatSync(
          openSync(
            path.join(__dirname, "./test_data/two_videos_two_audios.mp4"),
            "r",
          ),
        );
        let uploadSessionUrl = await createUploadUrl(gcsFilename, file.size);

        // Execute & Verify
        await runInPuppeteer(
          path.join(__dirname, "./test_data/chunked_uploading_interrupted"),
          ".",
          PORT,
          true,
          {
            debug: true,
            skipMinify: true,
          },
          [uploadSessionUrl],
        );
        assertThat(process.exitCode, eq(0), "test status");
      }
    })(),
  ],
});
