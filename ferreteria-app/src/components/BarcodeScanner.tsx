import React, { useRef, useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import Tesseract from "tesseract.js";

const BarcodeScanner: React.FC<{ onResult: (code: string) => void }> = ({
  onResult,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("Activa la cámara para comenzar");

  // 🔹 Activar la cámara
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
      setMessage("Cámara lista. Apunta al código o toma una foto.");
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setMessage("No se pudo acceder a la cámara.");
    }
  };

  // 🔹 Detener la cámara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setMessage("Cámara detenida");
    }
  };

  // 🔹 Tomar una foto y procesarla
  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    setMessage("Procesando imagen...");

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");

    try {
      // 1️⃣ Intentar leer con ZXing
      const codeReader = new BrowserMultiFormatReader();
      const result = await codeReader.decodeFromImageUrl(imageData);
      if (result && result.getText()) {
        const code = result.getText().trim();
        setMessage(`Código detectado: ${code}`);
        onResult(code);
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.warn("ZXing no pudo leer el código. Intentando OCR...");
    }

    // 2️⃣ Si ZXing falla, usar Tesseract.js
    try {
      const result = await Tesseract.recognize(imageData, "eng", {
        tessedit_char_whitelist: "0123456789",
      });
      const text = result.data.text.replace(/\D/g, ""); // Solo números
      if (text) {
        setMessage(`Código detectado (OCR): ${text}`);
        onResult(text);
      } else {
        setMessage("No se pudo detectar ningún código.");
      }
    } catch (err) {
      console.error("Error en OCR:", err);
      setMessage("Error al procesar la imagen.");
    }

    setIsProcessing(false);
  };

  // 🔹 Limpiar cámara al desmontar
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col items-center text-center gap-4 p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-lg border border-gray-400 max-w-full"
        style={{ width: "100%", maxWidth: "400px", height: "auto" }}
      />
      <p className="text-sm text-gray-300">{message}</p>

      <div className="flex gap-3">
        {!stream ? (
          <button
            onClick={startCamera}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Activar cámara
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Detener cámara
          </button>
        )}

        <button
          onClick={handleCapture}
          disabled={!stream || isProcessing}
          className={`px-4 py-2 rounded-md ${
            isProcessing ? "bg-gray-500" : "bg-yellow-500 hover:bg-yellow-600"
          } text-black`}
        >
          {isProcessing ? "Procesando..." : "Tomar foto"}
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
