// screens/ReceiverScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ActivityIndicator, FlatList } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Crypto from 'expo-crypto';
import { listenForImages, stopListening, mockPeerToPeerSend } from '../services/ImageService';
import { useAppContext } from '../context/AppContext';

interface ReceivedImage {
  id: string;
  uri: string;
  timestamp: number;
  saved: boolean;
}

export default function ReceiverScreen() {
  const [receiverId, setReceiverId] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [hasLibraryPermission, setHasLibraryPermission] = useState<boolean | null>(null);
  const [receivedImages, setReceivedImages] = useState<ReceivedImage[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { imageData, setImageData, setConnectedUser } = useAppContext();

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasLibraryPermission(status === 'granted');
    })();

    // Generate a unique receiver ID
    generateReceiverId();

    return () => {
      // Clean up listener when component unmounts
      if (isListening) {
        stopListening();
        setIsListening(false);
      }
    };
  }, []);

  // Handle incoming images
  useEffect(() => {
    if (imageData && isListening) {
      const newImage: ReceivedImage = {
        id: Date.now().toString(),
        uri: imageData,
        timestamp: Date.now(),
        saved: false
      };
      
      setReceivedImages(prev => [newImage, ...prev]);
      setImageData(null); // Reset the image data
    }
  }, [imageData]);

  const generateReceiverId = async (): Promise<void> => {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(4);
      const hexString = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      setReceiverId(hexString);
    } catch (error) {
      console.error('Error generating ID:', error);
      setReceiverId(Math.random().toString(36).substring(2, 8));
    }
  };

  const startReceiving = (): void => {
    if (!receiverId) {
      Alert.alert('Error', 'Receiver ID cannot be empty');
      return;
    }

    setIsListening(true);
    setConnectedUser(receiverId);
    listenForImages(receiverId);
    Alert.alert('Listening', `Ready to receive images. Your ID: ${receiverId}`);
  };

  const stopReceiving = (): void => {
    stopListening();
    setIsListening(false);
    setConnectedUser(null);
  };

  const saveImageToGallery = async (imageUri: string, index: number): Promise<void> => {
    if (!hasLibraryPermission) {
      Alert.alert('Permission denied', 'You need to grant permission to save photos');
      return;
    }

    if (!FileSystem.documentDirectory) {
      Alert.alert('Error', 'Cannot access device storage');
      return;
    }

    try {
      setIsSaving(true);
      
      // Create the local filename
      const filename = FileSystem.documentDirectory + Date.now() + '.jpg';
      
      // Copy the image to local file
      await FileSystem.copyAsync({
        from: imageUri,
        to: filename
      });
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(filename);
      await MediaLibrary.createAlbumAsync('ImageSharingApp', asset, false);
      
      // Update the image as saved
      setReceivedImages(prev => 
        prev.map((img, idx) => 
          idx === index ? { ...img, saved: true } : img
        )
      );
      
      Alert.alert('Success', 'Image saved to gallery');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.receiverIdContainer}>
        <Text style={styles.receiverIdLabel}>Your Receiver ID:</Text>
        <Text style={styles.receiverId}>{receiverId}</Text>
        <TouchableOpacity style={styles.idButton} onPress={generateReceiverId}>
          <Text style={styles.idButtonText}>Generate New ID</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.controlsContainer}>
        {!isListening ? (
          <TouchableOpacity
            style={styles.listenButton}
            onPress={startReceiving}>
            <Text style={styles.listenButtonText}>Start Receiving</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.listenButton, styles.stopButton]}
            onPress={stopReceiving}>
            <Text style={styles.listenButtonText}>Stop Receiving</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.imagesContainer}>
        <Text style={styles.imagesTitle}>
          {receivedImages.length > 0 ? 'Received Images' : 'No images received yet'}
        </Text>
        
        {isListening && receivedImages.length === 0 && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.waitingText}>Waiting for images...</Text>
          </View>
        )}
        
        <FlatList
          data={receivedImages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.imageItem}>
              <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              <View style={styles.imageInfo}>
                <Text style={styles.imageTimestamp}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
                {!item.saved ? (
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => saveImageToGallery(item.uri, index)}
                    disabled={isSaving}>
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.saveButton, styles.savedButton]}>
                    <Text style={styles.savedButtonText}>Saved</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  receiverIdContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  receiverIdLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  receiverId: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  idButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  idButtonText: {
    color: '#4a4a4a',
  },
  controlsContainer: {
    marginBottom: 20,
  },
  listenButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#e25f4a',
  },
  listenButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagesContainer: {
    flex: 1,
  },
  imagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666666',
  },
  imageItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  thumbnail: {
    width: 100,
    height: 100,
  },
  imageInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  imageTimestamp: {
    fontSize: 14,
    color: '#666666',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
    alignSelf: 'flex-end',
    width: 100,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  savedButton: {
    backgroundColor: '#82c91e',
  },
  savedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});