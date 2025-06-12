#!/bin/bash
# GCP auth
gcloud auth application-default login
gcloud config set project phading-dev

# Create the builder service account
gcloud iam service-accounts create web-ui-builder

# Grant permissions to the builder service account
gcloud projects add-iam-policy-binding phading-dev --member="serviceAccount:web-ui-builder@phading-dev.iam.gserviceaccount.com" --role='roles/cloudbuild.builds.builder' --condition=None
gcloud projects add-iam-policy-binding phading-dev --member="serviceAccount:web-ui-builder@phading-dev.iam.gserviceaccount.com" --role='roles/container.developer' --condition=None
gcloud projects add-iam-policy-binding phading-dev --member="serviceAccount:web-ui-builder@phading-dev.iam.gserviceaccount.com" --role='roles/storage.objectUser' --condition=None

# Set k8s cluster
gcloud container clusters get-credentials phading-cluster --location=us-central1

# Create the k8s service account
kubectl create serviceaccount web-ui-account --namespace default
