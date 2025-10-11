import { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  barcode: string;
}

export default function ScanBarcode() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barcode, setBarcode] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const navigate = useNavigate();

  // Inicializar cámara
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        console.error("❌ Error al acceder a la cámara:", err);
      }
    };
    initCamera();
  }, []);

  // Función para capturar foto y leer texto
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Tomar captura
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    setLoading(true);

    try {
      const result = await Tesseract.recognize(canvas, "eng", {
        tessedit_char_whitelist: "0123456789",
      });

      const text = result.data.text.replace(/\D/g, ""); // solo números
      setBarcode(text);

      if (text) {
        const q = query(
          collection(db, "products"),
          where("barcode", "==", text)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setProduct({ id: doc.id, ...(doc.data() as Product) });
        } else {
          setProduct(null);
        }
      }
    } catch (error) {
      console.error("❌ Error procesando imagen:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate(`/register?barcode=${barcode}`);
  };

  return (
    <div className="min-h-screen bg-[url(/img/bg-scan.jpg)] flex flex-col items-center justify-center p-5">
      <div className="bg-white/30 backdrop-blur-sm w-full rounded-2xl flex flex-col items-center gap-10 p-4 max-w-[390px]">
        <h1 className="text-3xl text-center font-bold mt-5 text-primary">
          Escanear Código de Barras
        </h1>

        {/* Vista de cámara */}
        <div className="bg-primary relative w-full max-w-md rounded-2xl overflow-hidden shadow-lg">
          {!cameraReady && (
            <p className="text-center text-secondary-500 py-10">
              Activando cámara...
            </p>
          )}
          <video
            ref={videoRef}
            className="w-full rounded-xl"
            autoPlay
            playsInline
            muted
          ></video>
        </div>

        {/* Botón capturar */}
        <button
          onClick={handleCapture}
          disabled={loading}
          className="relative w-full overflow-hidden px-6 py-3 rounded-4xl bg-white/10 backdrop-blur-xl border border-white/20
            shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
            text-white font-medium tracking-tight transition-all duration-300 ease-out
            hover:scale-105 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.6), _0_4px_20px_rgba(0,0,0,0.3)]
            active:scale-95
          "
        >
          {loading ? "Procesando..." : "📷 Capturar código"}
        </button>
        <button
          onClick={() => navigate("/")}
          className="relative w-full overflow-hidden px-6 py-3 rounded-4xl bg-white/10 backdrop-blur-xl border border-white/20
            shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
            text-white font-medium tracking-tight transition-all duration-300 ease-out
            hover:scale-105 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.6), _0_4px_20px_rgba(0,0,0,0.3)]
            active:scale-95
          "
        >
          Regresar
        </button>

        {/* Canvas oculto */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Resultado */}
        {barcode && (
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg text-center py-5">
            <p className="text-gray-600">
              Código detectado: <span className="font-semibold">{barcode}</span>
            </p>

            {product ? (
              <div className="flex flex-col mt-4 p-10 gap-10">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-52 object-cover rounded-2xl"
                />
                <h2 className="text-xl font-bold text-gray-800 mt-3">
                  {product.name}
                </h2>
                <p className="text-primary-600 font-bold text-xl mt-1">
                  S/. {product.price.toFixed(2)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-red-500 font-medium">
                  ❌ Producto no encontrado
                </p>
                <button
                  onClick={handleRegister}
                  className="relative w-full overflow-hidden px-6 py-3 rounded-4xl bg-white/10 backdrop-blur-xl border border-white/20
                    shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
                    text-white font-medium tracking-tight transition-all duration-300 ease-out
                    hover:scale-105 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.6), _0_4px_20px_rgba(0,0,0,0.3)]
                    active:scale-95
                  "
                >
                  ➕ Registrar producto
                </button>
              </div>
            )}
          </div>
        )}

        <div>
          <h1 className="text-primary text-3xl font-bold text-center">
            Productos similares
          </h1>
          <p>Se listara producto con el mismo nombre </p>
        </div>
      </div>
    </div>
  );
}
