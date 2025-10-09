// Simple IndexedDB wrapper for products
const DB_NAME = 'ferreteria-db';
const STORE = 'products';
function openDb(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME,1);
    req.onupgradeneeded = ()=>{
      const db = req.result;
      if(!db.objectStoreNames.contains(STORE)){
        const os = db.createObjectStore(STORE,{keyPath:'barcode'});
        os.createIndex('name','name',{unique:false});
      }
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
}

async function addProduct(product){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,'readwrite');
    const store = tx.objectStore(STORE);
    const r = store.put(product);
    r.onsuccess = ()=>resolve(r.result);
    r.onerror = ()=>reject(r.error);
  });
}

async function getProduct(barcode){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,'readonly');
    const store = tx.objectStore(STORE);
    const r = store.get(barcode);
    r.onsuccess = ()=>resolve(r.result);
    r.onerror = ()=>reject(r.error);
  });
}

async function listProducts(){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,'readonly');
    const store = tx.objectStore(STORE);
    const r = store.getAll();
    r.onsuccess = ()=>resolve(r.result);
    r.onerror = ()=>reject(r.error);
  });
}

async function deleteProduct(barcode){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,'readwrite');
    const store = tx.objectStore(STORE);
    const r = store.delete(barcode);
    r.onsuccess = ()=>resolve(true);
    r.onerror = ()=>reject(r.error);
  });
}

async function clearProducts(){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,'readwrite');
    const store = tx.objectStore(STORE);
    const r = store.clear();
    r.onsuccess = ()=>resolve(true);
    r.onerror = ()=>reject(r.error);
  });
}
