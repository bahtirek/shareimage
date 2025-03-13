// screens/SenderScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { CameraView, CameraCapturedPicture, Camera, CameraMode,
  CameraType, } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../context/AppContext';
import { sendImageToReceiver, mockSendImageToReceiver } from '../services/ImageService';

export default function SenderScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<CameraCapturedPicture | null>(null);
  const [receiverId, setReceiverId] = useState<string>('');
  const [isCameraVisible, setIsCameraVisible] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);
  const { setImageData } = useAppContext();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async (): Promise<void> => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if(!photo) return;
        setCapturedImage(photo);
        setIsCameraVisible(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const retakePicture = (): void => {
    setCapturedImage(null);
    setIsCameraVisible(true);
  };

  const pickImageFromLibrary = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library');
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0] as unknown as CameraCapturedPicture);
        setIsCameraVisible(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const sendImage = async (): Promise<void> => {
    if (!capturedImage) {
      Alert.alert('Error', 'Please take a picture first');
      return;
    }

    if (!receiverId.trim()) {
      Alert.alert('Error', 'Please enter receiver ID');
      return;
    }

    try {
      setIsSending(true);
      const result = await sendImageToReceiver(capturedImage.uri, receiverId);
      
      if (result.success) {
        Alert.alert('Success', 'Image sent successfully');
        // Reset state after successful send
        setCapturedImage(null);
        setReceiverId('');
        setIsCameraVisible(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to send image');
      }
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setIsSending(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {isCameraVisible ? (
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            ref={cameraRef} 
            mode={mode}
            facing={facing}
            mute={false}
            responsiveOrientationWhenOrientationLocked
          >
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={takePicture}>
                <Text style={styles.text}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={pickImageFromLibrary}>
                <Text style={styles.text}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          {capturedImage && (
            <Image
              source={{ uri: capturedImage.uri }}
              style={styles.previewImage}
            />
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Receiver ID"
              value={receiverId}
              onChangeText={setReceiverId}
            />
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={retakePicture}>
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isSending && styles.disabledButton]}
              onPress={sendImage}
              disabled={isSending}>
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Image</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  inputContainer: {
    marginVertical: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#4a90e2',
    flex: 1,
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dddddd',
    flex: 1,
    marginRight: 10,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  text: {
    fontSize: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#4a4a4a',
    fontSize: 16,
  },
});