import { useRef, useState, useEffect } from "react";
import * as Quagga from "quagga";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { getProductRecommendations } from "../ai/productRecommender";
import { Input } from "../components/ui/input";
import GooeyButton from "../components/GooeyButton";
import LiquidEther from "../components/LiquidEther";
import SplitText from "../components/SplitText";
import { Barcode } from "lucide-react";

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
    <div className="bg-gradient-to-br from-primary-900 via-primary to-secondary min-h-screen relative overflow-hidden grid">
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
        <div className="bg-white rounded-2xl flex flex-col items-center justify-center max-w-[390px] px-5 py-10 gap-5">
          <div className="flex flex-col gap-5 w-full items-center">
            <h1 className="text-primary font-primary text-2xl font-bold text-center">
              REGISTRAR PRODUCTO
            </h1>
            <div
              ref={videoRef}
              className="bg-black max-w-[320px] h-52 rounded-2xl overflow-hidden shadow-lg "
            >
              {!barcode && <div></div>}
            </div>
            <div className="flex items-center gap-2 mt-1 border rounded-lg px-2 border-black w-full">
              <Barcode size={20} />
              <input
                type="number"
                placeholder="Ingresar Código"
                value={manualCode}
                defaultValue={barcode}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-transparent outline-none text-black placeholder-gray-400 flex-1 py-2"
              />
            </div>
            <button
              onClick={handleManualSearch}
              className="w-full relative p-4 font-semibold text-white rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary hover:to-primary-900 hover:translate-y-[-2px] hover:shadow-2xl"
            >
              <span className="relative z-10">Buscar</span>
            </button>
          </div>
          {/* Resultado */}
          {loading ? (
            <p className="text-primary">Buscando producto...</p>
          ) : product ? (
            <div className="w-full flex flex-col items-center gap-2 py-5">
              <h3 className="text-2xl font-bold text-center text-primary">
                Resultado
              </h3>
              <div className="w-full bg-primary rounded-lg shadow-lg overflow-hidden">
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
                <div className="pt-5 w-full">
                  <h3 className="text-2xl font-bold text-center text-primary pb-2">
                    Productos similares
                  </h3>
                  <div className="flex flex-col gap-5">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="shadow rounded-2xl overflow-hidden bg-primary-700"
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
              <p className="text-2xl font-bold text-center text-red-500 pb-2">
                Producto no encontrado
              </p>
              <p className="text-priamry font-bold mb-3">{barcode}</p>
              <button
                onClick={handleRegister}
                className="w-full relative p-4 font-semibold text-white rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary hover:to-primary-900 hover:translate-y-[-2px] hover:shadow-2xl mt-4"
              >
                <span className="relative z-10">Registrar</span>
              </button>
            </div>
          ) : null}
          <div className="w-full">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-950">
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
