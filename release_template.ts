import { ENV_VARS } from "./env_vars";
import {
  K8S_SERVICE_NAME,
  K8S_SERVICE_PORT,
} from "@phading/web_interface/service_const";
import { writeFileSync } from "fs";

export function generate(env: string) {
  let turnupTemplate = `#!/bin/bash
# GCP auth
gcloud auth application-default login
gcloud config set project ${ENV_VARS.projectId}

# Create the builder service account
gcloud iam service-accounts create ${ENV_VARS.builderAccount}

# Grant permissions to the builder service account
gcloud projects add-iam-policy-binding ${ENV_VARS.projectId} --member="serviceAccount:${ENV_VARS.builderAccount}@${ENV_VARS.projectId}.iam.gserviceaccount.com" --role='roles/cloudbuild.builds.builder' --condition=None
gcloud projects add-iam-policy-binding ${ENV_VARS.projectId} --member="serviceAccount:${ENV_VARS.builderAccount}@${ENV_VARS.projectId}.iam.gserviceaccount.com" --role='roles/container.developer' --condition=None
gcloud projects add-iam-policy-binding ${ENV_VARS.projectId} --member="serviceAccount:${ENV_VARS.builderAccount}@${ENV_VARS.projectId}.iam.gserviceaccount.com" --role='roles/storage.objectUser' --condition=None

# Set k8s cluster
gcloud container clusters get-credentials ${ENV_VARS.clusterName} --location=${ENV_VARS.clusterRegion}

# Create the k8s service account
kubectl create serviceaccount ${ENV_VARS.serviceAccount} --namespace default
`;
  writeFileSync(`${env}/turnup.sh`, turnupTemplate);

  let cloudbuildTemplate = `steps:
- name: 'node:20.12.1'
  entrypoint: 'npm'
  args: ['ci']
- name: 'node:20.12.1'
  entrypoint: npx
  args: ['bundage', 'bwa', '-ec', '${env}/web_app_entries.yaml', '-o', 'server/bin']
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/${ENV_VARS.projectId}/${ENV_VARS.releaseServiceName}:latest', '-f', '${env}/Dockerfile', '.']
- name: "gcr.io/cloud-builders/docker"
  args: ['push', 'gcr.io/${ENV_VARS.projectId}/${ENV_VARS.releaseServiceName}:latest']
- name: 'gcr.io/cloud-builders/kubectl'
  args: ['apply', '-f', '${env}/service.yaml']
  env:
    - 'CLOUDSDK_CONTAINER_CLUSTER=${ENV_VARS.clusterName}'
    - 'CLOUDSDK_COMPUTE_REGION=${ENV_VARS.clusterRegion}'
- name: 'gcr.io/cloud-builders/kubectl'
  args: ['rollout', 'restart', 'deployment', '${ENV_VARS.releaseServiceName}-deployment']
  env:
    - 'CLOUDSDK_CONTAINER_CLUSTER=${ENV_VARS.clusterName}'
    - 'CLOUDSDK_COMPUTE_REGION=${ENV_VARS.clusterRegion}'
options:
  logging: CLOUD_LOGGING_ONLY
`;
  writeFileSync(`${env}/cloudbuild.yaml`, cloudbuildTemplate);

  let dockerTemplate = `FROM node:20.12.1

WORKDIR /app
COPY server/ .
RUN npm ci --omit=dev

EXPOSE ${ENV_VARS.port}
CMD ["npx", "http-server", "./bin", "--port", "${ENV_VARS.port}", "--gzip", "--no-dotfiles", "--utc"]
`;
  writeFileSync(`${env}/Dockerfile`, dockerTemplate);

  let serviceTemplate = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${ENV_VARS.releaseServiceName}-deployment
spec:
  replicas: ${ENV_VARS.replicas}
  selector:
    matchLabels:
      app: ${ENV_VARS.releaseServiceName}-pod
  template:
    metadata:
      labels:
        app: ${ENV_VARS.releaseServiceName}-pod
    spec:
      serviceAccountName: ${ENV_VARS.serviceAccount}
      containers:
      - name: ${ENV_VARS.releaseServiceName}-container
        image: gcr.io/phading-dev/${ENV_VARS.releaseServiceName}:latest
        ports:
        - containerPort: ${ENV_VARS.port}
        livenessProbe:
          httpGet:
            path: /healthz
            port: ${ENV_VARS.port}
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /readiness
            port: ${ENV_VARS.port}
          initialDelaySeconds: 10
          periodSeconds: 10
        resources:
          requests:
            cpu: "${ENV_VARS.cpu}"
            memory: "${ENV_VARS.memory}"
          limits:
            cpu: "${ENV_VARS.cpu}"
            memory: "${ENV_VARS.memory}"
---
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: ${ENV_VARS.releaseServiceName}-neg-health-check
spec:
  healthCheck:
    port: ${ENV_VARS.port}
    type: HTTP
    requestPath: /healthz
---
apiVersion: v1
kind: Service
metadata:
  name: ${K8S_SERVICE_NAME}
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
    beta.cloud.google.com/backend-config: '{"default": "${ENV_VARS.releaseServiceName}-neg-health-check"}'
spec:
  selector:
    app: ${ENV_VARS.releaseServiceName}-pod
  ports:
    - protocol: TCP
      port: ${K8S_SERVICE_PORT}
      targetPort: ${ENV_VARS.port}
  type: ClusterIP
`;
  writeFileSync(`${env}/service.yaml`, serviceTemplate);

  let mainTemplate = `import "./env";
import "../main";
`;
  writeFileSync(`${env}/main.ts`, mainTemplate);

  let webAppEntriesTemplate = `
entries:
  - source: ./main
    output: ./index
  - source: ../not_found
    output: ./404
  - source: ../empty
    output: ./healthz
  - source: ../empty
    output: ./readiness
extraAssets:
  - from: ../favicon.ico
    to: ./favicon.ico
`;
  writeFileSync(`${env}/web_app_entries.yaml`, webAppEntriesTemplate);
}

import "./dev/env";
generate("dev");
