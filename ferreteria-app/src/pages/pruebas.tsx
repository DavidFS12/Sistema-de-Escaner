import BarcodeScanner from "../components/BarcodeScanner";

function EscanearProducto() {
  const handleResult = (codigo: string) => {
    console.log("Código detectado:", codigo);
    // Aquí llamas tu función para buscar el producto en Firebase
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <BarcodeScanner onResult={handleResult} />
    </div>
  );
}

export default EscanearProducto;
