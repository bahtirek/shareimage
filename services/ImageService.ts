// services/ImageService.ts
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getDatabase, ref, push, set, onValue, off } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBQZ04QUu7sCT329KS2oAPGNofSp-QHODg",
  authDomain: "smenacamera.firebaseapp.com",
  projectId: "smenacamera",
  storageBucket: "smenacamera.firebasestorage.app",
  messagingSenderId: "392925329207",
  appId: "1:392925329207:web:e930ed49ce6092e2a38cb2",
  measurementId: "G-PRGN5BTEEJ",
  databaseURL: "https://smenacamera-default-rtdb.firebaseio.com/",
};

/* 
{
  "rules": {
    ".read": "now < 1744344000000",  // 2025-4-11
    ".write": "now < 1744344000000",  // 2025-4-11
  }
} */

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const db = getDatabase();
const storage = getStorage();

// For a real implementation, you would want to implement proper authentication
// and secure rules in Firebase. This is a simplified example.

interface SendResult {
  success: boolean;
  message?: string;
}

// Mock version if you don't want to set up Firebase yet
export const mockSendImageToReceiver = async (
  imageUri: string, 
  receiverId: string
): Promise<SendResult> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Mock success
      resolve({ success: true });
    }, 1500);
  });
};

// Actual implementation using Firebase
export const sendImageToReceiver = async (
  imageUri: string, 
  receiverId: string
): Promise<SendResult> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Generate a unique file name
    const filename = `${receiverId}/${Date.now()}.jpg`;
    const imageRef = storageRef(storage, filename);
    
    // Upload to Firebase Storage
    await uploadBytes(imageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(imageRef);
    
    // Store the reference in Realtime Database
    const imageData = {
      url: downloadURL,
      timestamp: Date.now(),
      sender: 'anonymous' // You could add user authentication later
    };
    
    const receiverRef = ref(db, `receivers/${receiverId}/images`);
    await push(receiverRef, imageData);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending image:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// A reference to store the current listener so we can remove it later
let currentListener: any = null;

// Start listening for new images
export const listenForImages = (receiverId: string): void => {
  const imagesRef = ref(db, `receivers/${receiverId}/images`);
  
  // Remove any existing listener
  if (currentListener) {
    stopListening();
  }
  
  // Set up new listener
  currentListener = onValue(imagesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Get the most recent image
      const entries = Object.entries(data);
      if (entries.length > 0) {
        // Sort by timestamp (newest first)
        entries.sort((a: any, b: any) => b[1].timestamp - a[1].timestamp);
        const mostRecentImage = entries[0][1] as { url: string };
        
        // Dispatch to app context or use a callback
        // This part needs to be implemented according to your app's state management
        // For example, you might use:
        // AppContext.setImageData(mostRecentImage.url);
      }
    }
  });
};

// Stop listening for new images
export const stopListening = (): void => {
  if (currentListener) {
    off(currentListener);
    currentListener = null;
  }
};

// For testing and development without Firebase, you can use FileSystem
export const mockPeerToPeerSend = async (imageUri: string, receiverId: string): Promise<boolean> => {
  try {
    // In a real app, you would implement WebRTC or a similar technology
    // This is just a mock that copies the file locally
    const destinationUri = FileSystem.documentDirectory + 'shared_images/' + Date.now() + '.jpg';
    
    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + 'shared_images/',
      { intermediates: true }
    );
    
    // Copy the file
    await FileSystem.copyAsync({
      from: imageUri,
      to: destinationUri
    });
    
    console.log(`Mock: Image shared to ${receiverId} at ${destinationUri}`);
    return true;
  } catch (error) {
    console.error('Error in mock peer-to-peer send:', error);
    return false;
  }
};