import productLaptop from "@/assets/product-laptop.jpg";
import productBag from "@/assets/product-bag.jpg";
import productGuitar from "@/assets/product-guitar.jpg";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  additionalValue?: number;
  images: string[];
  location: string;
  owner: {
    name: string;
    avatar: string;
    rating: number;
  };
  category: string;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    title: "MacBook Pro 16\" M2 Pro",
    description: "Laptop en excelente estado, 1 año de uso. Incluye cargador original y funda protectora. Busco intercambio por cámara profesional o consola gaming.",
    price: 1800,
    additionalValue: 200,
    images: [productLaptop, productLaptop, productLaptop],
    location: "Quito",
    owner: {
      name: "María García",
      avatar: avatar1,
      rating: 4.8,
    },
    category: "Tech",
  },
  {
    id: "2",
    title: "Bolso Mensajero Cuero Vintage",
    description: "Bolso de cuero genuino hecho a mano. Perfecto para trabajo o universidad. Acepto intercambio por mochila de calidad o accesorios tech.",
    price: 120,
    images: [productBag, productBag, productBag],
    location: "Guayaquil",
    owner: {
      name: "Carlos Mendez",
      avatar: avatar2,
      rating: 4.9,
    },
    category: "Moda",
  },
  {
    id: "3",
    title: "Guitarra Eléctrica Gibson Les Paul",
    description: "Guitarra profesional con amplificador incluido. Perfecta para músicos serios. Busco intercambio por equipo de DJ o instrumentos de teclado.",
    price: 950,
    additionalValue: 50,
    images: [productGuitar, productGuitar, productGuitar],
    location: "Cuenca",
    owner: {
      name: "Ana López",
      avatar: avatar3,
      rating: 4.7,
    },
    category: "Música",
  },
];
