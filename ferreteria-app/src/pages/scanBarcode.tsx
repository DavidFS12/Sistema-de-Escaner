import { useRef, useState, useEffect } from "react";
import * as Quagga from "quagga";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { getProductRecommendations } from "../ai/productRecommender";
import { Input } from "../components/ui/input";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  barcode: string;
  brand?: string;
}

export default function ScanBarcode() {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (product) fetchRecommendations();
  }, [product]);

  async function getAllProductsFromDB(): Promise<Product[]> {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Product),
    }));
  }

  async function fetchRecommendations() {
    const allProducts = await getAllProductsFromDB();
    const recs = getProductRecommendations(product!, allProducts);
    setRecommendations(recs);
  }

  // =============================
  // 🎥 Iniciar cámara y escáner
  // =============================
  useEffect(() => {
    if (!videoRef.current) return;

    let initialized = false;
    let detections: Record<string, number> = {};
    let lastDetected = "";

    const onDetected = (data: any) => {
      const code = data?.codeResult?.code;
      if (!code) return;

      detections[code] = (detections[code] || 0) + 1;

      // Confirmar solo si se detecta 3 veces seguidas el mismo código
      if (detections[code] >= 3 && code !== lastDetected) {
        console.log("✅ Código confirmado:", code);
        lastDetected = code;
        setBarcode(code);
        Quagga.stop();
        initialized = false;
      }
    };

    try {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: videoRef.current,
            constraints: { facingMode: "environment" },
          },
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
              "code_128_reader",
            ],
          },
          locate: true,
        },
        (err: any) => {
          if (err) {
            console.error("❌ Error al iniciar cámara:", err);
            return;
          }
          Quagga.onDetected(onDetected);
          Quagga.start();
          initialized = true;
          console.log("📸 Cámara lista, escaneando...");
        }
      );
    } catch (err) {
      console.error("Error inicializando Quagga:", err);
    }

    // Limpieza
    return () => {
      try {
        Quagga.offDetected(onDetected);
        Quagga.stop();
      } catch (err) {
        console.warn("Error en cleanup de Quagga:", err);
      }
    };
  }, []);

  // =============================
  // 🔎 Buscar producto escaneado
  // =============================
  useEffect(() => {
    if (!barcode) return;
    fetchProduct(barcode);
  }, [barcode]);

  const fetchProduct = async (codigo: string) => {
    setLoading(true);
    setNotFound(false);
    setProduct(null);

    try {
      const q = query(
        collection(db, "products"),
        where("barcode", "==", codigo)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setProduct({ ...(doc.data() as Product), id: doc.id });
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error buscando producto:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // 🧾 Input manual
  // =============================
  const handleManualSearch = () => {
    if (manualCode.trim() === "") return;
    setBarcode(manualCode.trim());
  };

  // =============================
  // 🧭 Acciones UI
  // =============================
  const handleRegister = () => navigate(`/register?barcode=${barcode}`);

  const handleRestart = () => {
    setBarcode("");
    setProduct(null);
    setNotFound(false);
    setRecommendations([]);
    try {
      Quagga.start();
    } catch (err) {
      console.warn("No se pudo reiniciar Quagga:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[url(/img/bg-scan.jpg)] flex flex-col items-center justify-center p-5">
      <div className="bg-white/30 backdrop-blur-sm w-full rounded-2xl flex flex-col p-4 max-w-[390px]">
        <div className="flex flex-col gap-5 py-10 border-b-2 border-white">
          <h1 className="text-3xl text-center font-primary-400 font-bold text-primary">
            Buscar por Escaner
          </h1>
          <div
            ref={videoRef}
            className="bg-black relative w-full h-52 rounded-2xl overflow-hidden shadow-lg"
          >
            {!barcode && <div></div>}
          </div>
          <button
            onClick={handleRestart}
            className="w-full relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-gradient-to-r from-primary-800 to-secondary-800 animate-gradient shadow-lg border-[1px] border-white/70"
          >
            <span className="relative z-10">✨ Volver a Escanear</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-transparent to-white/20 blur-xl opacity-70 animate-gradient"></div>
          </button>
        </div>
        {/* Input manual */}
        <div className="w-full flex flex-col gap-5 py-10 border-b-2 border-white">
          <h1 className="text-3xl text-center font-primary-400 font-bold text-primary">
            Buscar por Codigo
          </h1>
          <Input
            type="number"
            placeholder="Codigo"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="rounded-4xl p-6 bg-black text-white placeholder-white border-white border-2"
          />
          <button
            onClick={handleManualSearch}
            className="w-full relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-gradient-to-r from-primary-800 to-secondary-800 animate-gradient shadow-lg border-[1px] border-white/70"
          >
            <span className="relative z-10">✨ Buscar</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-transparent to-white/20 blur-xl opacity-70 animate-gradient"></div>
          </button>
        </div>
        <div className="py-10">
          <button
            onClick={() => navigate("/")}
            className="w-full relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-gradient-to-r from-black via-gray-600 to-black animate-gradient shadow-lg border-[1px] border-white/70"
          >
            <span className="relative z-10">✨ Regresar</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-transparent to-white/20 blur-xl opacity-70 animate-gradient"></div>
          </button>
        </div>

        {/* Resultado */}
        {loading ? (
          <p className="text-primary">Buscando producto...</p>
        ) : product ? (
          <div>
            <h3 className="text-3xl font-bold text-primary font-primary-400 mb-2">
              Resultado
            </h3>
            <div className="w-full bg-black/80 rounded-2xl shadow-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-52 object-cover"
              />
              <div className="flex flex-col px-4 py-2">
                <h2 className="text-lg text-white">
                  Código: <span className="font-medium">{product.barcode}</span>
                </h2>
                <div className="flex justify-between">
                  <h2 className="text-lg text-white">{product.name}</h2>
                  <p className="text-white font-medium text-xl">
                    S/. {product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recomendaciones */}
            {recommendations.length > 0 && (
              <div className="mt-10">
                <h3 className="text-3xl font-bold text-primary font-primary-400">
                  Productos similares
                </h3>
                <div className="flex flex-col gap-5 m-3">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="shadow rounded-2xl overflow-hidden bg-black/50"
                    >
                      <img
                        src={rec.image}
                        alt={rec.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="flex flex-col px-4 py-2">
                        <h2 className="text-md text-white">
                          Código:{" "}
                          <span className="font-medium">{rec.barcode}</span>
                        </h2>
                        <div className="flex justify-between text-lg">
                          <h2 className="text-white">{rec.name}</h2>
                          <p className="text-white font-medium">
                            S/. {rec.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : notFound ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center my-2">
            <p className="text-red-600 font-bold mb-3">
              Producto no encontrado
            </p>
            <button
              onClick={handleRegister}
              className="w-full relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-gradient-to-r from-primary-800 to-secondary-800 animate-gradient shadow-lg border-[1px] border-white/70"
            >
              <span className="relative z-10">✨ Registrar</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-transparent to-white/20 blur-xl opacity-70 animate-gradient"></div>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
