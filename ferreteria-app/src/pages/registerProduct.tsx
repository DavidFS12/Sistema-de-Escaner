import { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

export default function AddProduct() {
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const barcodeFromScan = params.get("barcode") || "";

  const [barcode, setBarcode] = useState(barcodeFromScan);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("Ningunarchivo seleccionado");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      <h1>Toma la foto mrd</h1>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode || !name || !price || !image) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        barcode,
        name,
        price: Number(price),
        image,
        createdAt: serverTimestamp(),
      });

      alert("Producto registrado con éxito ✅");
      navigate("/");
    } catch (error) {
      console.error("Error al registrar el producto:", error);
      alert("Error al registrar el producto ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[url(/img/bg-register2.jpg)] p-4">
      <div className="bg-white/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold my-5 text-center text-primary">
          Registrar Producto
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Código de barras"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full p-3 font-sans rounded-4xl bg-white/50 backdrop-blur-2xl placeholder-white border border-white/50"
          />
          <input
            type="text"
            placeholder="Nombre del producto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 font-sans rounded-4xl bg-white/50 backdrop-blur-2xl placeholder-white border border-white/50"
          />
          <input
            type="number"
            placeholder="Precio"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full p-3 font-sans rounded-4xl bg-white/50 backdrop-blur-2xl placeholder-white border border-white/50"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="cursor-pointer file:w-2/3 file:p-3 file:text-white font-sans file:border file:border-white/50 file:rounded-4xl file:bg-white/50 file:backdrop-blur-md"
          />
          {image && (
            <img
              src={image}
              alt="Vista previa"
              className="w-full h-48 object-cover rounded-2xl mt-2 border border-white/50 bg-white"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full overflow-hidden px-6 py-3 rounded-4xl bg-primary/80 backdrop-blur-xl border border-white/20
                  shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
                  text-white font-medium tracking-tight transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-[inset_0_2px_2px_rgba(255,239,24,0.2),_0_4px_20px_rgba(24,40,255,0.5)]
                  active:scale-95
                "
          >
            {loading ? "Guardando..." : "Guardar button"}
          </button>
        </form>
        <div className="my-10">
          <button
            onClick={() => navigate("/")}
            className="relative w-full overflow-hidden px-6 py-3 rounded-4xl bg-secondary/80 backdrop-blur-xl border border-white/20
                  shadow-[inset_0_2px_2px_rgba(24,40,255,0.5),_0_4px_20px_rgba(255,239,24,0.2)]
                  text-white font-medium tracking-tight transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.6), _0_4px_20px_rgba(0,0,0,0.3)]
                  active:scale-95
                "
          >
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
}
