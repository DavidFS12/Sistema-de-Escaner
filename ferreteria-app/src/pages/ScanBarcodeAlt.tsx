import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { useState } from "react";

function ScanBarcodeAlt() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageDataUrl = ev.target?.result as string;
      setImagePreview(imageDataUrl);
      setLoading(true);

      const img = new Image();
      img.src = imageDataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setLoading(false);

        if (code) {
          setBarcode(code.data);
          navigate(`/add-product?barcode=${encodeURIComponent(code.data)}`);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-700 text-center">
          Escanner codigo de barras (modo camara)
        </h1>
        <label>
          Abrir camara
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>

        {loading && (
          <p className="mt-4 text-gray-500 text-center">
            Analizando imagen ...
          </p>
        )}
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Captura"
            className="w-full h-64 object-cover rounded-xl border"
          />
        )}

        {barcode && (
          <p className="mt-4 text-center text-gray-700">
            Codigo detectado: <span className="font-semibold">{barcode}</span>
          </p>
        )}
      </div>
      <button
        onClick={() => navigate("/")}
        className="size-4 bg-blue-400 hover:bg-blue-600 text-white"
      >
        Regresar
      </button>
    </div>
  );
}

export default ScanBarcodeAlt;
