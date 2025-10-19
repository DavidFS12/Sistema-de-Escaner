import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ScanBarcode from "./pages/scanBarcode";
import RegisterProduct from "./pages/registerProduct";
import EscanearProducto from "./pages/pruebas";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/escanear-producto" element={<ScanBarcode />} />
        <Route path="/registrar" element={<RegisterProduct />} />
        <Route path="/test" element={<EscanearProducto />} />
      </Routes>
    </Router>
  );
}

export default App;
