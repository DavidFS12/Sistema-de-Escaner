import { useRef, useState, useEffect } from "react";
import * as Quagga from "quagga";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { getProductRecommendations } from "../ai/productRecommender";
import { Input } from "../components/ui/input";
import GooeyButton from "../components/GooeyButton";
import LiquidEther from "../components/LiquidEther";

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
  const handleRegister = () => navigate(`/registrar?barcode=${barcode}`);

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
    <div className="bg-black min-h-screen relative overflow-hidden grid">
      <div className="fixed inset-0 -z-10pointer-events-none">
        <LiquidEther
          colors={["#2818FF", "#5A8BFF", "#FFF14D", "#131753"]}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.1}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>
      <div className="flex flex-col items-center justify-center m-5 relative">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center max-w-[390px] px-5 py-10">
          <div className="flex flex-col gap-5 pb-10 w-full items-center">
            <h1 className="text-3xl text-center font-primary-400 font-bold text-secondary">
              Buscar por Escaner
            </h1>
            <div
              ref={videoRef}
              className="bg-black max-w-[320px] h-52 rounded-2xl overflow-hidden shadow-lg "
            >
              {!barcode && <div></div>}
            </div>
            {/* Input manual */}
            <Input
              type="number"
              placeholder="Ingresar Código"
              value={manualCode}
              defaultValue={barcode}
              onChange={(e) => setManualCode(e.target.value)}
              className="rounded-4xl p-6 border-black border-2 bg-white"
            />
            <button
              onClick={handleManualSearch}
              className="w-full relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-primary-900 animate-gradient shadow-lg border-2 border-white"
            >
              <span className="relative z-10">Buscar</span>
            </button>
          </div>
          {/* Resultado */}
          {loading ? (
            <p className="text-primary">Buscando producto...</p>
          ) : product ? (
            <div>
              <h3 className="text-4xl font-bold text-center text-white font-primary-400 py-10">
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
                    Código:{" "}
                    <span className="font-medium">{product.barcode}</span>
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
                  <h3 className="text-3xl font-bold text-secondary font-primary-400 py-5">
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
              <p className="text-priamry font-bold mb-3">{barcode}</p>
              <button
                onClick={handleRegister}
                className="w-full relative px-8 py-3 font-semibold text-white rounded-full bg-primary overflow-hidden shadow-lg border-2 border-white"
              >
                <span className="relative z-10">Registrar</span>
              </button>
            </div>
          ) : null}
          <div className="py-10 w-full">
            <div className="rounded-4xl bg-gradient-to-br from-primary-950 via-primary-900 to-secondary/40">
              <GooeyButton
                label="Regresar"
                delayBeforeAction={800}
                onClick={() => navigate("/")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
