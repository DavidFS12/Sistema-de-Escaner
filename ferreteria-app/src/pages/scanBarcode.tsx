import { useRef, useState, useEffect } from "react";
import * as Quagga from "quagga";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { getProductRecommendations } from "../ai/productRecommender";

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
  const videoRef = useRef<HTMLDivElement>(null);
  const [barcode, setBarcode] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔹 Cargar recomendaciones cuando se detecta producto
  useEffect(() => {
    if (product) fetchRecommendations();
  }, [product]);

  // 🔹 Obtener todos los productos de Firestore
  async function getAllProductsFromDB(): Promise<Product[]> {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Product),
    }));
  }

  // 🔹 Generar recomendaciones basadas en similitud del nombre
  async function fetchRecommendations() {
    const allProducts = await getAllProductsFromDB();
    const recs = getProductRecommendations(product!, allProducts);
    setRecommendations(recs);
  }

  // 🔹 Inicializar cámara con Quagga
  useEffect(() => {
    if (!videoRef.current) return;
    let initialized = false;

    const onDetected = (data: any) => {
      if (data?.codeResult?.code) {
        const code = data.codeResult.code;
        console.log("Código detectado:", code);
        setBarcode(code);
        try {
          if (initialized && typeof (Quagga as any).stop === "function") {
            (Quagga as any).stop();
            initialized = false;
          }
        } catch (err) {
          console.warn("Error al detener Quagga:", err);
        }
      }
    };

    try {
      (Quagga as any).init(
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
            console.error("Error al iniciar cámara:", err);
            return;
          }
          (Quagga as any).onDetected(onDetected);
          (Quagga as any).start();
          initialized = true;
          console.log("📸 Cámara lista, escaneando...");
        }
      );
    } catch (err) {
      console.error("Error inicializando Quagga:", err);
    }

    return () => {
      try {
        if (initialized) {
          (Quagga as any).offDetected(onDetected);
          if (typeof (Quagga as any).stop === "function") {
            (Quagga as any).stop();
          }
          initialized = false;
        }
      } catch (err) {
        console.warn("Error en cleanup de Quagga:", err);
      }
    };
  }, []);

  // 🔹 Buscar producto en Firestore cuando se detecta código
  useEffect(() => {
    if (barcode) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const q = query(
            collection(db, "products"),
            where("barcode", "==", barcode)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            setProduct({ id: doc.id, ...(doc.data() as Product) });
          } else {
            setProduct(null);
          }
        } catch (error) {
          console.error("Error buscando el producto: ", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [barcode]);

  const handleRegister = () => navigate(`/register?barcode=${barcode}`);

  const handleRestart = () => {
    setBarcode("");
    setProduct(null);
    try {
      (Quagga as any).start();
    } catch (err) {
      console.warn("No se pudo reiniciar Quagga:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[url(/img/bg-scan.jpg)] flex flex-col items-center justify-center p-5">
      <div className="bg-white/30 backdrop-blur-sm w-full rounded-2xl flex flex-col items-center gap-10 p-4 max-w-[390px]">
        <h1 className="text-3xl text-center font-primary-400 font-bold mt-5 text-primary">
          Escanear Código de Barras
        </h1>

        {/* Vista de cámara */}
        <div
          ref={videoRef}
          className="bg-primary relative w-full max-w-md rounded-2xl overflow-hidden shadow-lg"
        >
          {!barcode && (
            <p className="text-center text-secondary-500 py-10">
              Activando cámara...
            </p>
          )}
        </div>

        {/* Botones principales */}
        <button
          disabled={loading}
          onClick={handleRestart}
          className="w-full px-6 py-3 rounded-4xl bg-white/50 backdrop-blur-xl border border-primary/80
              shadow-[inset_0_2px_2px_rgba(0,0,0,0.5),_0_4px_20px_rgba(24,40,255,0.5)]
              text-primary font-semibold tracking-tight transition-all duration-300 ease-out
              hover:scale-105 active:scale-95 hover:bg-black/20 hover:text-secondary"
        >
          Reintentar
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full px-6 py-3 rounded-4xl bg-white/50 backdrop-blur-xl border border-secondary/80
              shadow-[inset_0_2px_2px_rgba(0,0,0,0.2),_0_4px_40px_rgba(255,239,24,0.5)]
              text-primary font-semibold tracking-tight transition-all duration-300 ease-out
              hover:scale-105 active:scale-95 hover:bg-black/20 hover:text-secondary"
        >
          Regresar
        </button>

        {/* Resultado del escaneo */}
        {barcode && (
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg text-center py-5">
            <p className="text-gray-600">
              Código detectado: <span className="font-semibold">{barcode}</span>
            </p>

            {loading ? (
              <p className="text-primary">Buscando Producto ...</p>
            ) : product ? (
              <div className="flex flex-col mt-4 p-5 gap-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-52 object-cover rounded-2xl"
                />
                <h2 className="text-xl font-bold text-gray-800 mt-3">
                  {product.name}
                </h2>
                <p className="text-primary font-bold text-xl mt-1">
                  S/. {product.price.toFixed(2)}
                </p>

                {/* Productos similares */}
                {recommendations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-primary">
                      Productos similares
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="shadow rounded-lg p-2 hover:scale-105 transition cursor-pointer"
                        >
                          <img
                            src={rec.image}
                            alt={rec.name}
                            className="h-32 w-full object-contain"
                          />
                          <p className="text-sm font-medium mt-2">{rec.name}</p>
                          <p className="text-xs text-gray-500">
                            {rec.brand || "Sin marca"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleRestart}
                  className="w-full px-6 py-3 rounded-4xl bg-white/10 backdrop-blur-xl border border-white/20
                    shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
                    text-primary font-medium tracking-tight transition-all duration-300 ease-out
                    hover:scale-105 active:scale-95"
                >
                  Escanear de nuevo
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-6 py-4">
                <button
                  onClick={handleRegister}
                  className="px-6 py-3 rounded-4xl bg-white/10 backdrop-blur-xl border border-white/20
                    shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
                    text-primary font-medium tracking-tight transition-all duration-300 ease-out
                    hover:scale-105 active:scale-95"
                >
                  ➕ Registrar producto
                </button>
                <p className="text-red-500 font-medium">
                  ❌ Producto no encontrado
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
