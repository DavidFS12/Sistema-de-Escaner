import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ScanBarcode from "./pages/scanBarcode";
import RegisterProduct from "./pages/registerProduct";
import ScanBarcodeAlt from "./pages/ScanBarcodeAlt";
import BirdButtons from "./pages/diseñoButton";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<ScanBarcode />} />
        <Route path="/register" element={<RegisterProduct />} />
        <Route path="/scan-alt" element={<ScanBarcodeAlt />} />
        <Route path="/button" element={<BirdButtons />} />
      </Routes>
    </Router>
  );
}

export default App;
