import { storageGet, storageSet } from './storage.js';

export const defaultMenu = {
  categories: [
    {
      id: "smashburgers", name: "Smashburgers", icon: "🍔", color: "#f5820d",
      items: [
        { id: "clasica", name: "Clásica", price: 11000, description: "Medallón 120gr, chédar, cebolla morada, lechuga y tomate", image: null, hasDouble: true, doublePrice: 13000, hasTriple: false, triplePrice: 0 },
        { id: "cheese", name: "Cheese Burger", price: 9000, description: "Medallón 120gr y doble chédar", image: null, hasDouble: true, doublePrice: 11000, hasTriple: false, triplePrice: 0 },
        { id: "bacon", name: "Bacon", price: 12000, description: "Medallón 120gr, chédar y doble bacón crujiente", image: null, hasDouble: true, doublePrice: 14000, hasTriple: false, triplePrice: 0 },
        { id: "onion", name: "Onion Crispy", price: 12000, description: "Medallón 120gr, bacón crujiente, cebolla crispy y chédar", image: null, hasDouble: true, doublePrice: 14000, hasTriple: false, triplePrice: 0 },
        { id: "oklahoma", name: "Oklahoma", price: 12000, description: "Medallón 120gr, hilos de cebollas y chédar", image: null, hasDouble: true, doublePrice: 14000, hasTriple: false, triplePrice: 0 },
        { id: "philly", name: "Philly Cheese", price: 15000, description: "Carne cortada a cuchillo, cebolla y morrón salteado, queso chédar y queso dámbo", image: null, hasDouble: false, hasTriple: false },
      ]
    },
    {
      id: "panchos", name: "Super Panchos", icon: "🌭", color: "#e63946",
      items: [
        { id: "bacon-cheddar", name: "Bacon y Cheddar", price: 8000, description: "Salchicha alemana, cheddar y bacon", image: null, hasDouble: false, hasTriple: false },
        { id: "calabresa", name: "Calabresa", price: 8000, description: "Salchicha alemana, salsa de tomate, queso y calabresa", image: null, hasDouble: false, hasTriple: false },
      ]
    },
    {
      id: "bebidas", name: "Bebidas", icon: "🥤", color: "#1d9e75",
      items: [
        { id: "agua", name: "Agua Saborizada", price: 2300, description: "Naranja o Manzana — 500ml", image: null, hasDouble: false, hasTriple: false },
        { id: "gaseosa", name: "Gaseosa", price: 3000, description: "Sprite, Fanta, Coca Cola — 500ml", image: null, hasDouble: false, hasTriple: false },
        { id: "cerveza", name: "Cerveza", price: 4000, description: "Imperial IPA o Lager — 475ml", image: null, hasDouble: false, hasTriple: false },
      ]
    },
    {
      id: "postres", name: "Postres", icon: "🍮", color: "#f5c518",
      items: [
        { id: "flan", name: "Flan", price: 5000, description: "Flan casero con dulce de leche y crema", image: null, hasDouble: false, hasTriple: false },
        { id: "copa-cindor", name: "Copa Cindor", price: 5000, description: "Postre de chocolate con crema chantilly", image: null, hasDouble: false, hasTriple: false },
        { id: "brownie", name: "Brownie", price: 5000, description: "Brownie con dulce de leche y crema", image: null, hasDouble: false, hasTriple: false },
      ]
    },
    {
      id: "extras", name: "Extras", icon: "🍟", color: "#f5c518",
      items: [
        { id: "papas", name: "Papas Fritas", price: 1500, description: "Papas fritas crujientes", image: null, hasDouble: false, hasTriple: false },
      ]
    }
  ]
};

export async function loadMenu() {
  const saved = await storageGet('menu');
  return saved || defaultMenu;
}

export async function saveMenu(menu) {
  return await storageSet('menu', menu);
}
