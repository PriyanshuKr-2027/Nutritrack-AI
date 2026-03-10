import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import OCR from "rn-mlkit-ocr";
import { lookupBarcode } from "../lib/barcodeScanner";
import { parseNutritionLabel } from "../lib/ocrParser";
import { LabelData } from "./LabelResultView";

interface ScanLabelViewProps {
  onClose: () => void;
  onComplete: (data: LabelData, source: "openfoodfacts" | "ocr", uri?: string) => void;
}

export function ScanLabelView({ onClose, onComplete }: ScanLabelViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const handleBarcodeScanned = async (result: { data: string }) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const barcode = result.data;
      const data = await lookupBarcode(barcode);
      if (data) {
        onComplete(data, "openfoodfacts");
      } else {
        Alert.alert("Not Found", "Product not in database. Scan nutrition label instead.");
        setTimeout(() => setIsProcessing(false), 2000); // Prevent spamming
      }
    } catch (e) {
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const handleScanLabel = async () => {
    if (isProcessing || !cameraRef.current) return;
    setIsProcessing(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) throw new Error("Failed to capture image");
      
      const recognized = await (OCR as any).recognize(photo.uri);
      // Combine all lines into a single text block
      const rawText = recognized.map((b: any) => b.text).join("\n");
      
      const parsed = parseNutritionLabel(rawText);
      const data: LabelData = {
        servingSize: parsed.servingSize || "",
        calories: parsed.calories || "",
        protein: parsed.protein || "",
        carbs: parsed.carbs || "",
        fat: parsed.fat || "",
        sodium: parsed.sodium || "",
        sugar: parsed.sugar || "",
      };

      onComplete(data, "ocr", photo.uri);
    } catch (err) {
      console.error("[OCR error]", err);
      Alert.alert("Error", "Could not read label. Try again.");
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-black w-full relative overflow-hidden">
      {/* Camera Feed - Full Screen */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
        }}
        onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
      />

      {/* Dark overlay for scanning frame */}
      <View style={StyleSheet.absoluteFillObject} className="bg-black/30" />

      {/* UI Overlay */}
      <View
        className="flex-1 z-10"
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        {/* Top Controls */}
        <View className="flex-row justify-between items-center p-4">
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.9 : 1 }] }]}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center backdrop-blur-sm"
          >
            <Feather name="x" size={24} color="white" />
          </Pressable>

          <Pressable
            onPress={() => setFlashOn(!flashOn)}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.9 : 1 }] }]}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center backdrop-blur-sm"
          >
            <Feather name={flashOn ? "zap" : "zap-off"} size={24} color={flashOn ? "#fef08a" : "white"} />
          </Pressable>
        </View>

        {/* Primary Instruction */}
        <View className="items-center mt-2 px-6">
          <View className="bg-black/60 px-4 py-2 rounded-full">
            <Text className="text-white text-base font-medium text-center">
              Point at barcode or nutrition label
            </Text>
          </View>
        </View>

        {/* Scanning Frame Area */}
        <View className="flex-1 items-center justify-center relative px-8 py-4">
          {/* The Frame - a transparent cutout effect can be faked with border */}
          <View className="w-full max-w-[280px] aspect-[3/4] rounded-3xl border border-green-500 bg-transparent flex items-center justify-center">
             {/* Scanner styling lines */}
             <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-3xl" />
             <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-3xl" />
             <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-3xl" />
             <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-3xl" />
             
             {isProcessing && (
                <View className="absolute bg-black/50 rounded-2xl p-4 flex-row items-center">
                  <ActivityIndicator size="small" color="#22c55e" className="mr-2" />
                  <Text className="text-white font-medium">Processing...</Text>
                </View>
             )}
          </View>

          {/* Secondary Instruction */}
          <Text className="mt-6 text-white text-sm font-medium shadow-sm shadow-black text-center max-w-[240px]">
            Align the label clearly inside the frame and tap scan to read text
          </Text>
        </View>

        {/* Bottom Controls */}
        <View className="p-8 pb-12 items-center justify-center mt-auto">
          {/* Scan Label Button */}
          <Pressable
            onPress={handleScanLabel}
            disabled={isProcessing}
            style={({ pressed }) => [{ transform: [{ scale: pressed && !isProcessing ? 0.95 : 1 }] }]}
            className={`w-full max-w-[240px] py-4 rounded-full items-center justify-center flex-row shadow-lg ${
              isProcessing ? "bg-zinc-800" : "bg-green-500 shadow-green-500/30"
            }`}
          >
            <Feather name="maximize" size={20} color={isProcessing ? "#71717a" : "black"} className="mr-2" />
            <Text className={`text-lg font-bold ${isProcessing ? "text-zinc-500" : "text-black"}`}>
              Scan Label
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
