import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ScanBarcode from "./pages/scanBarcode";
import RegisterProduct from "./pages/registerProduct";
import Demo from "./pages/pruebas";
import Boton from "./pages/bottones-new";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/escanear-producto" element={<ScanBarcode />} />
        <Route path="/registrar" element={<RegisterProduct />} />
        <Route path="/pruebas" element={<Demo />} />
        <Route path="/Boton" element={<Boton />} />
      </Routes>
    </Router>
  );
}

export default App;
