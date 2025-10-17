import { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import GooeyButton from "../components/GooeyButton";
import LiquidEther from "../components/LiquidEther";

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
    <div className="bg-black min-h-screen relative overflow-hidden grid">
      <div className="fixed inset-0 -z-10pointer-events-none">
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center gap-10 max-w-[390px] px-5 py-10 relative">
          <h1 className="text-white font-bold font-primary-400 text-4xl">
            Registrar Producto
          </h1>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 px-5 w-full"
          >
            <input
              type="text"
              placeholder="Código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full p-3 font-sans rounded-4xl bg-white backdrop-blur-2xl placeholder-black/50 border border-black
              shadow-[inset_0_0px_0px_rgb(255,255,255,0.1),_0px_0px_10px_10px_rgba(0,0,0,0.3)]
            "
            />
            <input
              type="text"
              placeholder="Nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 font-sans rounded-4xl bg-white backdrop-blur-2xl placeholder-black/50 border border-black
              shadow-[inset_0_0px_0px_rgb(255,255,255,0.1),_0px_0px_10px_10px_rgba(0,0,0,0.3)]
            "
            />
            <input
              type="number"
              placeholder="Precio"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full p-3 font-sans rounded-4xl bg-white backdrop-blur-2xl placeholder-black/50 border border-black
              shadow-[inset_0_0px_0px_rgb(255,255,255,0.1),_0px_0px_10px_10px_rgba(0,0,0,0.3)]
            "
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer file:w-2/3 file:p-3 file:text-black/50 font-sans file:border file:border-black file:rounded-4xl file:bg-white file:backdrop-blur-md"
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
              className="w-full relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-gradient-to-r from-black via-black/20 to-black animate-gradient shadow-lg border-[1px] border-white/70"
            >
              {loading ? "Guardando..." : "Guardar Producto"}
              <div className="absolute inset-0 rounded-full animate-gradient"></div>
            </button>
          </form>
          <div className="pt-10 w-full">
            <GooeyButton
              label="Regresar"
              delayBeforeAction={800}
              onClick={() => navigate("/")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
