import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

import { env } from "~/env";
import { type SharedResponse, SharedResponseSchema } from "~/types/share";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export async function saveSharedResponse(data: SharedResponse): Promise<string> {
  const validatedData = SharedResponseSchema.parse(data);
  const storageRef = ref(storage, `shared-responses/${validatedData.id!}.json`);
  await uploadString(storageRef, JSON.stringify(validatedData, null, 2));
  return validatedData.id!;
}

export async function getSharedResponse(id: string): Promise<SharedResponse | null> {
  try {
    const storageRef = ref(storage, `shared-responses/${id}.json`);
    const downloadURL = await getDownloadURL(storageRef);
    const response = await fetch(downloadURL);
    if (!response.ok) {
      console.error("Failed to fetch shared response:", response.statusText);
      return null;
    }
    const data = await response.json() as unknown;
    return SharedResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'storage/object-not-found') {
      return null;
    }
    console.error("Error getting shared response:", error);
    return null;
  }
}
