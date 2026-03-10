import React, { useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { CameraView as ExpoCameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorModal } from './ErrorModal';

interface CameraViewProps {
  onClose: () => void;
  /** onCapture receives the local URI of the captured/picked image. */
  onCapture: (imageUri: string) => void;
}

export function CameraView({ onClose, onCapture }: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashOn, setFlashOn] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [errorModal, setErrorModal] = useState<'camera' | 'generic' | null>(null);
  const cameraRef = useRef<ExpoCameraView>(null);
  const insets = useSafeAreaInsets();

  // ── Permission handling ─────────────────────────────────────────────────────
  if (!permission) {
    // Permission status loading
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Show the ErrorModal immediately for camera permission */}
        <ErrorModal
          visible
          type="camera"
          onClose={onClose}
          onRetry={requestPermission}
          onManualEntry={onClose}
        />
      </View>
    );
  }

  // ── Capture ─────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } catch (err) {
      setErrorModal('generic');
    } finally {
      setCapturing(false);
    }
  };

  // ── Gallery picker ──────────────────────────────────────────────────────────
  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorModal('camera');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onCapture(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ErrorModal
        visible={errorModal !== null}
        type={errorModal ?? 'generic'}
        onClose={() => setErrorModal(null)}
        onRetry={errorModal === 'generic' ? handleCapture : requestPermission}
        onManualEntry={onClose}
      />
      <ExpoCameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flashOn ? 'on' : 'off'}
      />

      {/* Viewfinder overlay: corner marks */}
      <View style={[StyleSheet.absoluteFillObject, styles.viewfinderContainer]} pointerEvents="none">
        <View style={styles.viewfinderCornerTL} />
        <View style={styles.viewfinderCornerTR} />
        <View style={styles.viewfinderCornerBL} />
        <View style={styles.viewfinderCornerBR} />
      </View>

      {/* Instruction */}
      <View style={[styles.instructionContainer, { top: Math.max(insets.top, 16) + 52 }]}>
        <Text style={styles.instructionText}>Point at your food</Text>
      </View>

      {/* Top Controls */}
      <View
        style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}
      >
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="x" size={24} color="white" />
        </Pressable>

        {/* Flip camera */}
        <Pressable
          onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="refresh-cw" size={20} color="white" />
        </Pressable>
      </View>

      {/* Bottom Controls */}
      <View
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        {/* Gallery */}
        <Pressable
          onPress={handleGallery}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="image" size={24} color="white" />
        </Pressable>

        {/* Capture Button */}
        <Pressable
          onPress={handleCapture}
          disabled={capturing}
          style={({ pressed }) => [
            styles.captureBtn,
            { opacity: pressed || capturing ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <View style={styles.captureBtnInner} />
        </Pressable>

        {/* Flash Toggle */}
        <Pressable
          onPress={() => setFlashOn(f => !f)}
          style={({ pressed }) => [
            styles.iconBtn,
            { opacity: pressed ? 0.7 : 1, backgroundColor: flashOn ? 'rgba(250,204,21,0.3)' : 'rgba(0,0,0,0.4)' },
          ]}
        >
          <Feather name="zap" size={24} color={flashOn ? '#fcd34d' : 'white'} />
        </Pressable>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = 'rgba(34,197,94,0.9)';

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 24, flexDirection: 'row',
    justifyContent: 'space-between', zIndex: 10,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 32, paddingTop: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10,
  },
  iconBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: 'white',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnInner: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'white',
  },
  instructionContainer: {
    position: 'absolute', left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  instructionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14, fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  viewfinderContainer: {
    alignItems: 'center', justifyContent: 'center',
  },
  viewfinderCornerTL: {
    position: 'absolute', top: '25%', left: '12%',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR, borderTopLeftRadius: 4,
  },
  viewfinderCornerTR: {
    position: 'absolute', top: '25%', right: '12%',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR, borderTopRightRadius: 4,
  },
  viewfinderCornerBL: {
    position: 'absolute', bottom: '25%', left: '12%',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR, borderBottomLeftRadius: 4,
  },
  viewfinderCornerBR: {
    position: 'absolute', bottom: '25%', right: '12%',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR, borderBottomRightRadius: 4,
  },
});
