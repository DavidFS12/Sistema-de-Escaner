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
    <div className="bg-[url(/img/bg-home.jpg)]">
      <div className="bg-white/30 backdrop-blur-md rounded-2xl flex flex-col items-center">
        <div className="flex flex-col items-center justify-center min-h-screen gap-10 border-b-4 p-10 max-w-[390px]">
          {/*section hero*/}
          <img
            src="/img/logo.png"
            alt="logo"
            className="max-h-4/12 rounded-2xl w-full"
          />
          <button
            onClick={() => navigate("/scan")}
            className="relative w-full overflow-hidden px-6 py-3 rounded-4xl bg-white/10 backdrop-blur-xl border border-white/20
              shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
              text-white font-medium tracking-tight transition-all duration-300 ease-out
              hover:scale-105 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.6), _0_4px_20px_rgba(0,0,0,0.3)]
              active:scale-95
            "
          >
            Escanear
          </button>
          <button
            onClick={() => navigate("/register")}
            className="relative w-full overflow-hidden px-6 py-3 rounded-4xl bg-white/10 backdrop-blur-xl border border-white/20
              shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
              text-white font-medium tracking-tight transition-all duration-300 ease-out
              hover:scale-105 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.6), _0_4px_20px_rgba(0,0,0,0.3)]
              active:scale-95
            "
          >
            Registrar
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
          <div className="flex flex-col gap-10 p-4">
            <h1 className="text-center text-white text-4xl font-bold">
              Catálogo
            </h1>
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col bg-white rounded-2xl shadow-md overflow-hidden"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-52 object-cover"
                />
                <div className="flex justify-between px-6 py-4">
                  <h2 className="text-xl font-semibold text-primary">
                    {product.name}
                  </h2>
                  <p className="text-primary font-bold text-2xl">
                    S/. {product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
