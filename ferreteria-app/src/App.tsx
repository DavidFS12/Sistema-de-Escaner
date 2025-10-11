import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ScanBarcode from "./pages/scanBarcode";
import RegisterProduct from "./pages/registerProduct";
import ScanBarcodeAlt from "./pages/ScanBarcodeAlt";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<ScanBarcode />} />
        <Route path="/register" element={<RegisterProduct />} />
        <Route path="/scan-alt" element={<ScanBarcodeAlt />} />
      </Routes>
    </Router>
  );
}

export default App;
