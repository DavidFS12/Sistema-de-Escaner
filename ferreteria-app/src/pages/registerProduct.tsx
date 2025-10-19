import { useState } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  // 🖼️ Cargar la imagen en base64 para mostrar vista previa
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // 🔄 Convierte imagen a WebP comprimido
  async function convertToWebp(fileOrUrl: string | File): Promise<Blob> {
    let bitmap: ImageBitmap;
    try {
      if (typeof fileOrUrl === "string") {
        const response = await fetch(fileOrUrl);
        const blob = await response.blob();
        bitmap = await createImageBitmap(blob);
      } else {
        bitmap = await createImageBitmap(fileOrUrl);
      }

      const canvas = document.createElement("canvas");
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / bitmap.width);
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Error al obtener contexto del canvas");
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject("Error al crear WebP")),
          "image/webp",
          0.65
        );
      });

      return blob;
    } catch (err) {
      console.error("Error en convertToWebp:", err);
      throw err;
    }
  }

  // 🔄 Convierte Blob a Base64
  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode || !name || !price || !image) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      // 🔍 Validar código duplicado
      const q = query(
        collection(db, "products"),
        where("barcode", "==", barcode)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        alert("⚠️ El código ya está registrado");
        setLoading(false);
        return;
      }

      // 🗜️ Convertir imagen a WebP comprimido
      const webpBlob = await convertToWebp(image);
      if (webpBlob.size > 2 * 1024 * 1024) {
        alert("La imagen debe ser menor a 2MB");
        setLoading(false);
        return;
      }

      const base64Webp = await blobToBase64(webpBlob);

      // 💾 Guardar en Firestore
      await addDoc(collection(db, "products"), {
        barcode,
        name,
        price: Number(price),
        image: base64Webp,
        createdAt: serverTimestamp(),
      });

      alert("✅ Producto registrado con éxito");
      navigate("/");
    } catch (error) {
      console.error("Error al registrar el producto:", error);
      alert("❌ Error al registrar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-900 via-primary to-secondary min-h-screen relative overflow-hidden grid">
      <div className="fixed inset-0 -z-10 pointer-events-none">
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
        <div className="bg-white rounded-2xl flex flex-col items-center justify-center gap-5 px-5 py-10 relative">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 max-w-[300px]"
          >
            <h1 className="text-primary font-primary text-2xl font-bold text-center">
              REGISTRAR PRODUCTO
            </h1>

            {/* Código de barras */}
            <div>
              <label className="text-gray-600 text-md font-sans font-medium">
                Código de barras:
              </label>
              <div className="flex items-center gap-2 mt-1 border rounded-lg px-2 border-black">
                <Barcode size={20} />
                <input
                  type="number"
                  min="0"
                  placeholder="Ingresa el código de barras"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="bg-transparent outline-none text-black placeholder-gray-400 flex-1 py-2"
                />
              </div>
            </div>

            {/* Nombre */}
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

            {/* Precio */}
            <div>
              <label className="text-gray-600 text-md font-sans font-medium">
                Precio:
              </label>
              <div className="flex items-center gap-2 mt-1 border rounded-lg px-2 border-black">
                <Banknote size={20} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
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

            {/* Imagen */}
            <div
              className="mt-1 border-dashed border-2 border-gray-600 rounded-lg p-4 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center hover:border-primary hover:bg-[#fbf4ff]"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              {image ? (
                <img
                  src={image}
                  alt="Vista previa"
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <>
                  <CloudUpload size={60} className="text-primary-800 pb-2" />
                  <p className="text-md text-gray-500 font-primary-400">
                    Haz clic para subir una imagen
                  </p>
                </>
              )}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

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
