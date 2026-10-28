const API = "https://d3e6htiiul5ek9.cloudfront.net/prod";
const HERE = { lat: -32.4103, lng: -63.2436 };
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

const statusNode = document.querySelector("#status");
const resultsNode = document.querySelector("#results");
const storesNode = document.querySelector("#stores");
const storesTitle = document.querySelector("#stores-title");
const storeList = document.querySelector("#store-list");
const basketNode = document.querySelector("#basket");
const basketItems = document.querySelector("#basket-items");
const totalsNode = document.querySelector("#totals");

const basket = new Map();
const storeCache = new Map();

function localStore(store) {
  const city = (store.localidad || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return city.includes("villa maria") || city.includes("villa nueva");
}

function priceOf(store) {
  const value = store.preciosProducto && store.preciosProducto.precioLista;
  return typeof value === "number" ? value : null;
}

async function getJson(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error("La consulta a Precios Claros no respondió.");
  return response.json();
}

async function storesFor(productId) {
  if (storeCache.has(productId)) return storeCache.get(productId);
  const data = await getJson(
    `/producto?id_producto=${encodeURIComponent(productId)}&lat=${HERE.lat}&lng=${HERE.lng}&limit=40`,
  );
  const stores = (data.sucursales || []).filter(localStore).filter((store) => priceOf(store) != null);
  storeCache.set(productId, stores);
  return stores;
}

function renderBasket() {
  basketNode.hidden = basket.size === 0;
  basketItems.replaceChildren();
  for (const item of basket.values()) {
    const row = document.createElement("li");
    row.className = "line";
    row.textContent = item.nombre;
    const remove = document.createElement("button");
    remove.className = "ghost";
    remove.type = "button";
    remove.textContent = "Quitar";
    remove.addEventListener("click", () => {
      basket.delete(item.id);
      renderBasket();
    });
    row.append(remove);
    basketItems.append(row);
  }
  renderTotals();
}

async function renderTotals() {
  totalsNode.replaceChildren();
  if (basket.size === 0) return;
  const byStore = new Map();
  for (const item of basket.values()) {
    const stores = await storesFor(item.id);
    for (const store of stores) {
      const current = byStore.get(store.id) || {
        name: `${store.banderaDescripcion} · ${store.sucursalNombre}`,
        address: store.direccion,
        prices: {},
      };
      current.prices[item.id] = priceOf(store);
      byStore.set(store.id, current);
    }
  }
  const complete = [...byStore.values()]
    .filter((store) => Object.keys(store.prices).length === basket.size)
    .map((store) => ({
      ...store,
      total: Object.values(store.prices).reduce((sum, value) => sum + value, 0),
    }))
    .sort((a, b) => a.total - b.total);

  if (complete.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Ninguna sucursal de la ciudad publicó precio para todos los productos de la canasta.";
    totalsNode.append(empty);
    return;
  }
  complete.forEach((store, index) => {
    const row = document.createElement("li");
    row.className = index === 0 ? "total total--best" : "total";
    const name = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = store.name;
    const address = document.createElement("span");
    address.className = "meta";
    address.textContent = store.address;
    name.append(title, document.createElement("br"), address);
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = money.format(store.total);
    row.append(name, price);
    totalsNode.append(row);
  });
}

async function showStores(product) {
  statusNode.textContent = "Buscando sucursales…";
  const stores = await storesFor(product.id);
  storesTitle.textContent = product.nombre;
  storeList.replaceChildren();
  storesNode.hidden = false;
  if (stores.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Ninguna sucursal de Villa María o Villa Nueva publicó este producto.";
    storeList.append(empty);
  }
  for (const store of stores.sort((a, b) => priceOf(a) - priceOf(b))) {
    const row = document.createElement("li");
    row.className = "store";
    const name = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = `${store.banderaDescripcion} · ${store.sucursalNombre}`;
    const address = document.createElement("span");
    address.className = "meta";
    address.textContent = store.direccion;
    name.append(title, document.createElement("br"), address);
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = money.format(priceOf(store));
    row.append(name, price);
    storeList.append(row);
  }
  statusNode.textContent = "";
}

async function searchProducts(query) {
  const data = await getJson(
    `/productos?string=${encodeURIComponent(query)}&lat=${HERE.lat}&lng=${HERE.lng}&limit=8`,
  );
  return data.productos || [];
}

document.querySelector("#search").addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = new FormData(event.currentTarget).get("q").toString().trim();
  statusNode.textContent = "Buscando…";
  resultsNode.replaceChildren();
  storesNode.hidden = true;
  try {
    const products = await searchProducts(query);
    statusNode.textContent = products.length ? "" : "Precios Claros no devolvió productos para esa búsqueda.";
    for (const product of products) {
      const row = document.createElement("li");
      row.className = "result";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = product.nombre;
      const detail = document.createElement("span");
      detail.className = "meta";
      detail.textContent = `${product.marca} · ${product.presentacion}`;
      copy.append(title, document.createElement("br"), detail);
      const actions = document.createElement("div");
      actions.className = "tag";
      const range = document.createElement("div");
      range.className = "price";
      range.textContent = `${money.format(product.precioMin)} – ${money.format(product.precioMax)}`;
      const add = document.createElement("button");
      add.type = "button";
      add.textContent = "Sumar a la canasta";
      add.addEventListener("click", async () => {
        basket.set(product.id, product);
        await showStores(product);
        renderBasket();
      });
      actions.append(range, add);
      row.append(copy, actions);
      resultsNode.append(row);
    }
  } catch (error) {
    statusNode.textContent = error.message;
  }
});

const opening = new URLSearchParams(location.search);
if (opening.get("q")) {
  document.querySelector("#query").value = opening.get("q");
  document.querySelector("#search").requestSubmit();
}
if (opening.get("vista") === "sucursales" && opening.get("q")) {
  searchProducts(opening.get("q")).then((products) => {
    if (products[0]) showStores(products[0]);
  });
}
if (opening.get("vista") === "canasta") {
  Promise.all([searchProducts("yerba"), searchProducts("leche")]).then(async ([yerba, leche]) => {
    for (const product of [yerba[0], leche[0]].filter(Boolean)) {
      basket.set(product.id, product);
    }
    renderBasket();
  });
}
