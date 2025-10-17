import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";
import GooeyButton from "../components/GooeyButton";
import LiquidEther from "../components/LiquidEther";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  barcode: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [products, setProduct] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const fetchProdcuts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Product),
        }));
        setProduct(data);
      } catch (error) {
        console.error("Error al cargar productos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProdcuts();
  }, []);

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
      <div className="flex flex-col items-center justify-center m-5">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center gap-10 max-w-[390px] px-5 py-10">
          <h1 className="text-secondary font-primary text-4xl font-bold text-center">
            SISTEMA DE ESCANEO
          </h1>
          <img
            src="/img/logo2.png"
            alt="logo"
            className="max-h-4/12 rounded-2xl w-full relative"
          />
          <div className="flex flex-col w-full gap-10 py-10">
            <div className="rounded-4xl bg-gradient-to-br from-primary-950 via-primary-900 to-secondary/40">
              <GooeyButton
                label="Escanear"
                delayBeforeAction={800}
                onClick={() => navigate("/escanear-producto")}
              />
            </div>
            <div className="rounded-4xl bg-gradient-to-br from-primary-950 via-primary-900 to-secondary/70">
              <GooeyButton
                label="Registrar"
                delayBeforeAction={800}
                onClick={() => navigate("/registrar")}
              />
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        {loading ? (
          <p className="text-center text-primary-400 mt-20">
            Cargando productos...
          </p>
        ) : products.length === 0 ? (
          <p className="text-center text-primary-400 mt-20">
            No hay productos registrados aún.
          </p>
        ) : (
          <div className="flex flex-col gap-10 p-4 font-primary-400">
            {/*
            <h1 className="text-center text-primary text-4xl font-bold">
              Catálogo
            </h1>
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col bg-black/80 rounded-2xl shadow-md overflow-hidden"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-52 object-cover"
                />
                <div className="flex flex-col px-4 py-2">
                  <div>
                    <h2 className="text-lg text-white">
                      Código:{" "}
                      <span className="font-medium">{product.barcode}</span>
                    </h2>
                  </div>
                  <div className="flex justify-between">
                    <h2 className="text-lg text-white">{product.name}</h2>
                    <p className="text-white font-medium text-xl">
                      S/. {product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
              */}
          </div>
        )}
      </div>
    </div>
  );
}
