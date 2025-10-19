import {addDoc, collection} from "firebase/firestore";
import {faker} from "@faker-js/faker";

export async function loadTestProducts(){
  const { db } = await import("../firebase/config.js");
  const productsRef = collection(db, "products");
  console.log("Insertando productos de prueba ...");

  for(let i=0; i<1000; i++){
    const newProducto = {
      barcode: faker.number.int({min:1000000, max: 999999999999}),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price({min: 0.10, max: 5000.00})),
      image: faker.image.urlLoremFlickr({category: 'tools'}),
      createdAt: new Date(),
    };

    await addDoc(productsRef, newProducto);
  }

  console.log("1000 productos insertados correctamente");
}
