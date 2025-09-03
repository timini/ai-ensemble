#!/bin/bash

# This script automates the creation of a Google Cloud service account,
# assigns it the necessary permissions for Firebase Hosting deployment,
# generates a key, and uploads it as a secret to a GitHub repository.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# The name for the new service account.
SERVICE_ACCOUNT_NAME="firebase-deploy-sa"

# The name of the secret to be created in the GitHub repository.
# This should match the secret name used in the GitHub Actions workflow file.
GITHUB_SECRET_NAME="FIREBASE_SERVICE_ACCOUNT"

# --- Script ---

# 1. Get Project ID from .firebaserc
PROJECT_ID=$(grep -o '"default": "[^"]*' .firebaserc | grep -o '[^"]*$')

if [ -z "$PROJECT_ID" ]; then
    echo "Error: Could not find Firebase project ID in .firebaserc"
    exit 1
fi

echo "Firebase Project ID: $PROJECT_ID"

# 2. Get GitHub Repository from user input
read -p "Enter your GitHub repository (e.g., 'owner/repo'): " GITHUB_REPO
if [ -z "$GITHUB_REPO" ]; then
    echo "Error: GitHub repository cannot be empty."
    exit 1
fi

echo "Setting up for GitHub repo: $GITHUB_REPO"
echo "---"

# 3. Set gcloud project
echo "Setting active gcloud project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# 4. Create Service Account
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Creating service account $SERVICE_ACCOUNT_NAME..."
if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" > /dev/null 2>&1; then
    echo "Service account $SERVICE_ACCOUNT_NAME already exists."
else
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="Firebase Deploy Service Account"
fi

# 5. Grant Firebase Hosting Admin role to the Service Account
echo "Granting Firebase Hosting Admin role to the service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/firebasehosting.admin"

# Add a short delay to allow for IAM propagation
echo "Waiting for IAM propagation..."
sleep 5

# 6. Create Service Account Key
KEY_FILE_PATH="./firebase-service-account-key.json"
echo "Creating service account key..."
gcloud iam service-accounts keys create "$KEY_FILE_PATH" \
    --iam-account="$SERVICE_ACCOUNT_EMAIL"

echo "Service account key created at $KEY_FILE_PATH"

# 7. Upload the Service Account Key to GitHub Secrets
echo "Uploading service account key to GitHub secrets as $GITHUB_SECRET_NAME..."
gh secret set "$GITHUB_SECRET_NAME" --repo "$GITHUB_REPO" < "$KEY_FILE_PATH"

# 8. Clean up the key file
echo "Cleaning up local service account key file..."
rm "$KEY_FILE_PATH"

echo "---"
echo "✅ Success! The service account has been configured and the key has been securely uploaded to GitHub."
echo "Your GitHub Actions workflow is now ready to deploy to Firebase Hosting."
