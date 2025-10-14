import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";

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
    <div className="bg-[url(/img/bg-home-of.avif)] flex justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center m-5">
        <div className="g-white/30 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center gap-10 max-w-[390px] px-5 py-10">
          <img
            src="/img/logo.png"
            alt="logo"
            className="max-h-4/12 rounded-2xl w-full"
          />
          <button
            onClick={() => navigate("/scan")}
            className="w-full relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-gradient-to-r from-primary-800 to-secondary-800 animate-gradient shadow-lg border-[1px] border-white/70"
          >
            <span className="relative z-10">✨ Escanear</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-transparent to-white/20 blur-xl opacity-70 animate-gradient"></div>
          </button>
          <button
            onClick={() => navigate("/register")}
            className="w-full relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-gradient-to-r from-primary-800 to-secondary-800 animate-gradient shadow-lg border-[1px] border-white/70"
          >
            <span className="relative z-10">✨ Registrar</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-transparent to-white/20 blur-xl opacity-70 animate-gradient"></div>
          </button>
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
