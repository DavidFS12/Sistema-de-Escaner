import BarcodeScanner from "../components/BarcodeScanner";

export default function EscanearProducto() {
  const handleDetect = (value) => {
    alert("Producto detectado: " + value);
    // Aquí puedes hacer fetch o registrar el producto en tu backend
  };

  return <BarcodeScanner onDetect={handleDetect} />;
}
