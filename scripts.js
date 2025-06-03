const sheetID = '1P5GubM5SpR_NVo3QRZMNQQxWMatUQVz8UIbKREHFu9w'; // <-- tu ID
const sheetName = 'Carta';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${sheetName}`;
const categoryView = document.getElementById('categoryButtons');
const homeView = document.getElementById('homeView');
const menuView = document.getElementById('menuView');
let allData = [];
let isDataLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
  fetch(base)
    .then(res => res.text())
    .then(rep => {
      const json = JSON.parse(rep.substring(47).slice(0, -2));
      const data = json.table.rows.map(row => ({
        categoria: row.c[0]?.v || '',
        nombre: row.c[1]?.v || '',
        descripcion: row.c[2]?.v || '',
        precio: row.c[3]?.v || '',
        imagen: convertirGoogleDriveURL(row.c[4]?.v || ''),
      }));

      allData = data;
      isDataLoaded = true;
      loadCategories();

      const firstCategoria = data[0]?.categoria || '';
      if (location.hash) {
        handleHashOnLoad(location.hash); // <- Nueva función para restaurar vista
      } else {
        showPlatosDeCategoria(firstCategoria, false);
      }

      // Activar búsqueda
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.trim().toLowerCase();
          filterDishes(query);
        });
      }
    });

  loadPromos();
});


function renderButtons(data) {
  const uniqueCats = [...new Set(data.map(p => p.categoria))];
  const nav = document.getElementById('categoryButtons');
  nav.innerHTML = '';

  uniqueCats.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.onclick = () => showCategory(cat);
    nav.appendChild(btn);
  });
}

function filterDishes(query) {
  const container = document.getElementById('menuView');
  container.innerHTML = '';

  const resultados = allData.filter(p =>
    p.nombre.toLowerCase().includes(query) ||
    p.descripcion?.toLowerCase().includes(query)
  );

  if (resultados.length === 0) {
    container.innerHTML = '<p>No se encontraron platos.</p>';
    return;
  }

  resultados.forEach(plato => {
    const dish = document.createElement('div');
    dish.className = 'dish';
    dish.onclick = () => showDishDetails(plato);
    dish.innerHTML = `
      <img src="${plato.imagen}" alt="${plato.nombre}" />
      <div class="dish-info">
        <h3>${plato.nombre}</h3>
        <p>S/ ${plato.precio}</p>
      </div>
    `;

    container.appendChild(dish);
  });
  homeView.classList.remove('active');
  menuView.classList.add('active');
  if (location.hash !== '#search') {
    history.pushState(null, '', location.pathname + '#search');
  }
}

function showDishDetails(plato) {
  // Ocultar todas las vistas
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  // Mostrar solo la vista de detalle
  document.getElementById('dishDetailView').classList.add('active');

  // Llenar los datos
  document.getElementById('detailName').textContent = plato.nombre;
  document.getElementById('detailImage').src = plato.imagen;
  document.getElementById('detailImage').alt = plato.nombre;
  document.getElementById('detailDescription').textContent = plato.descripcion;
  document.getElementById('detailPrice').textContent = `S/ ${plato.precio}`;

  if (history.state?.detail !== plato.nombre) {
    history.pushState({ detail: plato.nombre }, '', `#detalle-${plato.nombre}`);
  }
}

function goBackToMenu() {
  history.back();
}

const promoSheetID = '1P5GubM5SpR_NVo3QRZMNQQxWMatUQVz8UIbKREHFu9w';
const promoSheetName = 'PROMOS';
const promoURL = `https://docs.google.com/spreadsheets/d/${promoSheetID}/gviz/tq?sheet=${promoSheetName}`;

let currentPromoIndex = 0;
let promoCount = 0;
let promoInterval;

function convertirGoogleDriveURL(url) {
  if (!url || typeof url !== 'string') {
    // Si url es null, undefined o no es string, devuelve cadena vacía
    return '';
  }
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return url;
}

function loadPromos() {
  fetch(promoURL)
    .then(res => res.text())
    .then(rep => {
      const json = JSON.parse(rep.substring(47).slice(0, -2));
      const rows = json.table.rows;

      const promoContainer = document.getElementById('promoContainer');
      promoContainer.innerHTML = '';

      rows.forEach(row => {
        const imgUrlOriginal = row.c[1]?.v;
        const imgUrl = convertirGoogleDriveURL(imgUrlOriginal);
        if (imgUrl) {
          const img = document.createElement('img');
          img.src = imgUrl;
          img.alt = row.c[0]?.v || 'Promoción'; // Columna PROMO
          promoContainer.appendChild(img);
        }
      });

      promoCount = rows.length;
      currentPromoIndex = 0;
      updatePromoPosition();

      // Iniciar el bucle automático
      if (promoInterval) clearInterval(promoInterval);
      promoInterval = setInterval(() => {
        currentPromoIndex = (currentPromoIndex + 1) % promoCount;
        updatePromoPosition();
      }, 5000);
    });
}

function updatePromoPosition() {
  const container = document.getElementById('promoContainer');
  const offset = -currentPromoIndex * window.innerWidth;
  container.style.transform = `translateX(${offset}px)`;
}

function slidePromos(direction) {
  currentPromoIndex += direction;
  if (currentPromoIndex < 0) currentPromoIndex = promoCount - 1;
  if (currentPromoIndex >= promoCount) currentPromoIndex = 0;
  updatePromoPosition();

  // Reiniciar el intervalo para que espere 5 segundos después de interacción manual
  clearInterval(promoInterval);
  promoInterval = setInterval(() => {
    currentPromoIndex = (currentPromoIndex + 1) % promoCount;
    updatePromoPosition();
  }, 5000);
}

const categoriasSheetName = 'CATEGORIAS';
const categoriasURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${categoriasSheetName}`;

function loadCategories() {
  fetch(categoriasURL)
    .then(res => res.text())
    .then(rep => {
      const json = JSON.parse(rep.substring(47).slice(0, -2));
      const rows = json.table.rows;

      const nav = document.getElementById('categoryButtons');
      nav.innerHTML = '';

      rows.forEach(row => {
        const nombre = row.c[0]?.v || '';
        const imagenOriginal = row.c[1]?.v || '';
        const imagen = convertirGoogleDriveURL(imagenOriginal);

        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.onclick = () => {
          if (location.hash !== `#${nombre}`) {
            history.pushState({ category: nombre }, '', `#${nombre}`);
          }

          showPlatosDeCategoria(nombre);
        };

        btn.innerHTML = `
          <div class="cat-img-container">
            <img src="${imagen}" alt="${nombre}" />
          </div>
          <div class="cat-name">${nombre}</div>
        `;

        nav.appendChild(btn);
      });
      showCategoryButtons();
    });
}

function showCategoryButtons() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  homeView.classList.add('active');
  //menuView.classList.remove('active');
  menuView.innerHTML = '';
}

function showPlatosDeCategoria(categoria, addToHistory = true) {
  homeView.classList.remove('active');
  menuView.classList.add('active');
  dishDetailView.classList.remove('active'); // Oculta la vista de detalle si está visible
  menuView.innerHTML = '';

  // Crear botón volver
  const backButton = document.createElement('button');
  backButton.textContent = '⬅ Volver';
  backButton.className = 'back-btn';
  backButton.onclick = () => history.back();

  menuView.appendChild(backButton);

  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.width = '100%';

  const title = document.createElement('h2');
  title.textContent = categoria;
  title.style.textAlign = 'center';
  title.style.width = '100%';
  wrapper.appendChild(title);

  const grid = document.createElement('div');
  grid.style.display = 'flex';
  grid.style.flexWrap = 'wrap';
  grid.style.justifyContent = 'center';
  grid.style.gap = '10px';
  grid.style.width = '100%';

  const platos = allData.filter(p => p.categoria === categoria);
  platos.forEach(plato => {
    const btn = document.createElement('button');
    btn.className = 'dish-btn';
    btn.onclick = () => showDishDetails(plato);

    btn.innerHTML = `
      <div class="dish-img-container">
        <img src="${plato.imagen}" alt="${plato.nombre}" />
      </div>
      <div class="dish-info">
        <div class="dish-name">${plato.nombre}</div>
        <div class="dish-price">S/ ${plato.precio}</div>
      </div>
    `;
    grid.appendChild(btn);
  });

  wrapper.appendChild(grid);
  menuView.appendChild(wrapper);

  if (addToHistory && history.state?.category !== categoria) {
    history.pushState({ category: categoria }, '', `#${categoria}`);
  }
}

function handleHashOnLoad(hash) {
  if (!isDataLoaded) return;

  if (hash.startsWith('#detalle-')) {
    const nombre = decodeURIComponent(hash.replace('#detalle-', ''));
    const plato = allData.find(p => p.nombre === nombre);
    if (plato) {
      showDishDetails(plato);
    } else {
      showCategoryButtons(); // Si no lo encuentra, va al home
    }
  } else if (hash.startsWith('#')) {
    const categoria = decodeURIComponent(hash.replace('#', ''));
    const existe = allData.some(p => p.categoria === categoria);
    if (existe) {
      showPlatosDeCategoria(categoria, false);
    } else {
      showCategoryButtons();
    }
  } else {
    showCategoryButtons();
  }
}

window.addEventListener('popstate', (event) => {
  if (!isDataLoaded) return;

  const hash = location.hash;
  handleHashOnLoad(hash);
});


