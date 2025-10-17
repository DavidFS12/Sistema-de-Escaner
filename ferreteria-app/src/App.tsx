import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ScanBarcode from "./pages/scanBarcode";
import RegisterProduct from "./pages/registerProduct";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/escanear-producto" element={<ScanBarcode />} />
        <Route path="/registrar" element={<RegisterProduct />} />
      </Routes>
    </Router>
  );
}

export default App;
