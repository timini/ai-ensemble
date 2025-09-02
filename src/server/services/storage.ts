import { Storage } from '@google-cloud/storage';
import type { SharedResponse } from '~/types/share';

export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });
    this.bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? 'ai-ensemble-shares';
  }

  async uploadSharedResponse(data: SharedResponse): Promise<string> {
    try {
      const fileName = `shared-responses/${data.id}.json`;
      const file = this.storage.bucket(this.bucketName).file(fileName);
      
      const jsonData = JSON.stringify(data, null, 2);
      
      await file.save(jsonData, {
        metadata: {
          contentType: 'application/json',
          metadata: {
            prompt: data.prompt.substring(0, 100), // First 100 chars for metadata
            timestamp: data.timestamp,
            providers: Object.keys(data.models).join(','),
          },
        },
      });

      // Make the file publicly readable
      await file.makePublic();

      // Return the public URL
      return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    } catch (error) {
      console.error('Error uploading to Google Cloud Storage:', error);
      throw new Error(`Failed to upload shared response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSharedResponse(id: string): Promise<SharedResponse | null> {
    try {
      const fileName = `shared-responses/${id}.json`;
      const file = this.storage.bucket(this.bucketName).file(fileName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      const [contents] = await file.download();
      const data = JSON.parse(contents.toString()) as SharedResponse;
      
      return data;
    } catch (error) {
      console.error('Error downloading from Google Cloud Storage:', error);
      return null;
    }
  }

  async deleteSharedResponse(id: string): Promise<boolean> {
    try {
      const fileName = `shared-responses/${id}.json`;
      const file = this.storage.bucket(this.bucketName).file(fileName);
      
      await file.delete();
      return true;
    } catch (error) {
      console.error('Error deleting from Google Cloud Storage:', error);
      return false;
    }
  }
}
