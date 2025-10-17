import { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import GooeyButton from "../components/GooeyButton";
import LiquidEther from "../components/LiquidEther";
import { Banknote, Barcode, CloudUpload, Hammer } from "lucide-react";

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
  const [focus, setFocus] = useState(false);

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
      <div className="flex flex-col justify-center items-center">
        <div className="bg-white rounded-2xl flex flex-col items-center justify-center gap-5 max-w-[390px] px-5 py-10 relative">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 px-5 w-full"
          >
            <h1 className="text-primary font-primary text-2xl font-bold text-center">
              REGISTRAR PRODUCTO
            </h1>
            <div>
              <label className="text-gray-600 text-md font-sans font-medium">
                Código de barras:
              </label>
              <div className="flex items-center gap-2 mt-1 border rounded-lg px-2 border-black">
                <Barcode size={20} />
                <input
                  type="number"
                  placeholder="Ingresa el código de barras"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="bg-transparent outline-none text-black placeholder-gray-400 flex-1 py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-600 text-md font-sans font-medium">
                Nombre:
              </label>
              <div className="flex items-center gap-2 mt-1 border rounded-lg px-2 border-black">
                <Hammer size={20} />
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent outline-none text-black placeholder-gray-400 flex-1 py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-600 text-md font-sans font-medium">
                Precio:
              </label>
              <div className="flex items-center gap-2 mt-1 border rounded-lg px-2 border-black">
                <Banknote size={20} />
                <input
                  type="number"
                  placeholder="Precio"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="bg-transparent outline-none text-black placeholder-gray-400 flex-1 py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-600 text-md font-sans font-medium">
                Imagen del producto
              </label>
              <div className="mt-1 border-dashed border-2 border-gray-600 rounded-lg p-8 cursor-pointer transition-all duration-300 items-center justify-center flex flex-col hover:border-primary hover:bg-[#fbf4ff]">
                <CloudUpload size={60} className="text-primary-800 pb-2" />
                <p className="text-md text-gray-500 font-primary-400">
                  Haz clic para subir una imagen
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="display-none opacity-0 cursor-pointer"
                />
              </div>
            </div>

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
              className="w-full relative p-4 font-semibold text-white rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary hover:to-primary-900 hover:translate-y-[-2px] hover:shadow-2xl mt-4"
            >
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </form>
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
