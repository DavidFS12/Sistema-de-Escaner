// App logic: scanning, showing product, registering
const scanBtn = document.getElementById('scanBtn');
const registerBtn = document.getElementById('registerBtn');
const scannerSection = document.getElementById('scannerSection');
const registerSection = document.getElementById('registerSection');
const scanResult = document.getElementById('scanResult');
const scannerElem = document.getElementById('scanner');
const stopScanBtn = document.getElementById('stopScanBtn');
const listBtn = document.getElementById('listBtn');
const clearListBtn = document.getElementById('clearListBtn');
const productList = document.getElementById('productList');

const registerForm = document.getElementById('registerForm');
const barcodeInput = document.getElementById('barcodeInput');
const nameInput = document.getElementById('nameInput');
const priceInput = document.getElementById('priceInput');
const registerMessage = document.getElementById('registerMessage');
const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');

const video = document.getElementById('video');
const photoCanvas = document.getElementById('photoCanvas');
const takePhotoBtn = document.getElementById('takePhotoBtn');

let currentStream = null;
let quaggaActive = false;
let quaggaProcessing = false; // debounce detections

scanBtn.addEventListener('click', async ()=>{
  scannerSection.classList.remove('hidden');
  registerSection.classList.add('hidden');
  scanResult.textContent = 'Iniciando cámara...';
  await startQuagga();
});

stopScanBtn.addEventListener('click', ()=>{
  stopQuagga();
  scanResult.textContent = '';
  scannerSection.classList.add('hidden');
});

listBtn.addEventListener('click', async ()=>{
  await refreshProductList();
});

clearListBtn.addEventListener('click', async ()=>{
  if(!confirm('¿Vaciar todos los productos? Esto borra los datos localmente.')) return;
  await clearProducts();
  await refreshProductList();
});

registerBtn.addEventListener('click', async ()=>{
  scannerSection.classList.add('hidden');
  registerSection.classList.remove('hidden');
  registerMessage.textContent = '';
  registerMessage.textContent = 'Iniciando cámara para foto...';
  const ok = await startCamera();
  if(!ok){
    registerMessage.innerHTML = 'No se pudo iniciar la cámara. Verifica permisos del navegador. Si usas un iPhone o Safari, sirve la app por HTTPS (ej. ngrok) y vuelve a intentar.';
  }else{
    registerMessage.textContent = 'Cámara lista. Pulsa "Tomar foto" para capturar.';
  }
});

cancelRegisterBtn.addEventListener('click', ()=>{
  registerSection.classList.add('hidden');
  stopCamera();
});

registerForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const product = {
    barcode: barcodeInput.value.trim(),
    name: nameInput.value.trim(),
    price: parseFloat(priceInput.value),
    image: photoCanvas.toDataURL('image/png'),
    createdAt: Date.now()
  };
  try{
    await addProduct(product);
    registerMessage.textContent = 'Producto guardado.';
    registerForm.reset();
    stopCamera();
  }catch(err){
    console.error(err);
    registerMessage.textContent = 'Error guardando: ' + (err && err.message ? err.message : err);
  }
});

takePhotoBtn.addEventListener('click', ()=>{
  if(!currentStream){
    registerMessage.textContent = 'Cámara no iniciada. Pulsa registrar para iniciar la cámara.';
    return;
  }
  takePhoto();
});

async function startCamera(){
  if(currentStream) return true;
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    console.error('getUserMedia no soportado');
    return false;
  }
  try{
    const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false});
    currentStream = s;
    video.srcObject = s;
    await video.play();
    return true;
  }catch(err){
    console.error('Camera error', err);
    return false;
  }
}

async function refreshProductList(){
  try{
    const items = await listProducts();
    renderProductList(items);
  }catch(err){
    productList.textContent = 'Error leyendo productos: ' + err;
  }
}

function renderProductList(items){
  if(!items || items.length === 0){
    productList.innerHTML = '<em>No hay productos guardados.</em>';
    return;
  }
  const html = items.map(p=>{
    return `<div class="product" data-barcode="${p.barcode}">
      <div><strong>${p.name}</strong> — ${p.barcode} — S/. ${Number(p.price).toFixed(2)}</div>
      <div>${p.image ? `<img src="${p.image}" style="height:80px;border-radius:6px"/>` : ''}</div>
      <div><button class="deleteBtn" data-barcode="${p.barcode}">Eliminar</button></div>
    </div>`;
  }).join('');
  productList.innerHTML = html;
  // attach delete handlers
  productList.querySelectorAll('.deleteBtn').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      const bc = btn.dataset.barcode;
      if(!confirm('Eliminar producto ' + bc + '?')) return;
      await deleteProduct(bc);
      await refreshProductList();
    });
  });
}

function stopCamera(){
  if(currentStream){
    currentStream.getTracks().forEach(t=>t.stop());
    currentStream = null;
  }
  video.pause();
  video.srcObject = null;
}

function takePhoto(){
  if(!currentStream){
    registerMessage.textContent = 'No hay cámara activa.';
    return;
  }
  const w = video.videoWidth || 320;
  const h = video.videoHeight || 240;
  photoCanvas.width = w;
  photoCanvas.height = h;
  const ctx = photoCanvas.getContext('2d');
  ctx.drawImage(video,0,0,w,h);
  // show a small preview by temporarily unhiding canvas
  photoCanvas.classList.remove('hidden');
}

async function startQuagga(){
  if(quaggaActive) return; // already running
  if(!window.Quagga){
    scanResult.textContent = 'QuaggaJS no está disponible.';
    return false;
  }
  // Check getUserMedia availability
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    scanResult.textContent = 'getUserMedia no disponible en este navegador. Prueba con Chrome/Edge/Firefox o usa ngrok (HTTPS).';
    return false;
  }
  // Check secure context (HTTPS or localhost)
  if(location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1'){
    scanResult.textContent = 'El escáner necesita un contexto seguro (HTTPS). Usa ngrok o sirve desde localhost para habilitar la cámara.';
    return false;
  }
  try{
    await new Promise((resolve, reject)=>{
      Quagga.init({
        inputStream: {
          type: 'LiveStream',
          target: scannerElem,
          constraints: { facingMode: 'environment' }
        },
        decoder: { readers: ['ean_reader','ean_8_reader','code_128_reader','upc_reader'] }
      }, (err)=>{
        if(err){ return reject(err); }
        resolve();
      });
    });
    Quagga.start();
    quaggaActive = true;
    scanResult.textContent = 'Escaneando...';
    Quagga.onDetected(handleQuaggaDetected);
    return true;
  }catch(err){
    console.error('Quagga init error', err);
    scanResult.textContent = 'Error iniciando Quagga: ' + (err && err.message ? err.message : err);
    return false;
  }
}

async function handleQuaggaDetected(data){
  if(quaggaProcessing) return; // debounce
  quaggaProcessing = true;
  setTimeout(()=>{ quaggaProcessing = false; }, 1200);
  const code = data && data.codeResult && data.codeResult.code;
  if(!code) return;
  scanResult.textContent = 'Código detectado: ' + code;
  try{ Quagga.pause(); }catch(e){}
  const prod = await getProduct(code);
  if(prod){
    scanResult.innerHTML = `<strong>Producto:</strong> ${prod.name} — S/. ${prod.price.toFixed(2)}`;
  }else{
    scanResult.innerHTML = `Producto no encontrado. <button id="registerFromScan">Registrar</button>`;
    document.getElementById('registerFromScan').addEventListener('click', async ()=>{
      barcodeInput.value = code;
      registerSection.classList.remove('hidden');
      scannerSection.classList.add('hidden');
      await startCamera();
    });
  }
}

function stopQuagga(){
  try{ Quagga.stop(); }catch(e){}
  quaggaActive = false;
}
