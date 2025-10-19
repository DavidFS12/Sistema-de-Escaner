import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = {
  onDetect?: (value: string) => void;
  className?: string;
};

export default function BarcodeScanner({ onDetect, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const deteccionesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setScanning(true);

    const start = async () => {
      try {
        // 🔹 Forzar uso de cámara trasera con facingMode
        await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" }, // 👈 fuerza cámara trasera
            },
          },
          videoRef.current as HTMLVideoElement,
          (result, error) => {
            if (result && result.getText()) {
              const value = result.getText();
              const cnts = deteccionesRef.current;
              cnts[value] = (cnts[value] ?? 0) + 1;

              if (cnts[value] >= 5) {
                console.log("✅ Código detectado:", value);
                deteccionesRef.current = {};
                onDetect?.(value); // envía el valor al padre
              }
            }
          }
        );
      } catch (err) {
        console.error("Error iniciando cámara:", err);
        setScanning(false);
      }
    };

    start();

    return () => {
      stopCamera();
    };
  }, [onDetect]);

  const stopCamera = () => {
    const reader = readerRef.current as any;
    if (reader) {
      if (typeof reader.reset === "function") reader.reset();
      if (typeof reader.stopContinuousDecode === "function")
        reader.stopContinuousDecode();
      if (typeof reader.stop === "function") reader.stop();
    }

    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (video) {
      video.srcObject = null;
    }
    setScanning(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div>
        <video
          ref={videoRef}
          className="rounded-lg max-w-full"
          autoPlay
          muted
          playsInline
          style={{ width: "100%", maxWidth: "400px", height: "auto" }}
        />
      </div>
    </div>
  );
}
