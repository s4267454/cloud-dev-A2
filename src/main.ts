import './style.css';

const navbarDiv = document.getElementById('navbar');
const productDetailDiv = document.getElementById('product-detail');
const menuDiv = document.getElementById('menu');
const cartRootDiv = document.getElementById('cart-root');

type Product = {
  productId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
};

type CartItem = { product: Product; quantity: number };

type ApiProduct = {
  product_id: string;
  product_name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
};

type ProductsApiResponse = {
  product_item_arr: ApiProduct[];
};

const IMAGE_BASE_PATH = '../images/';

let products: Product[] = [];
let productsLoading = true;
let productsError = '';


let productsRequestId = 0;


async function fetchProducts(category: string = activeCategory, keyword: string = searchTerm): Promise<void> {
  const requestId = ++productsRequestId;

  productsLoading = true;
  productsError = '';
  renderProductGrid();

  const url =
    category === 'All drinks'
      ? 'https://bdb25p8n26.execute-api.us-east-1.amazonaws.com/Prod/get_all_products'
      : `https://bdb25p8n26.execute-api.us-east-1.amazonaws.com/Prod/get_products_by_category?category=${encodeURIComponent(category)}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: ProductsApiResponse = await response.json();

    if (!Array.isArray(data.product_item_arr)) {
      throw new Error(
        'product_item_arr is not filled'
      );
    }

    if (requestId !== productsRequestId) return;

    products = data.product_item_arr.map((item): Product => ({
      productId: item.product_id,
      name: item.product_name,
      category: item.category,
      description: item.description,
      price: Number(item.price),
      image: item.image,
      stock: Number(item.stock),
    }));

    if (category === 'All drinks' && keyword) {
      products = products.filter(product =>
        product.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  } catch (error) {
    if (requestId !== productsRequestId) return;

    productsError =
      error instanceof Error
        ? error.message
        : 'Failed to load products';

    console.error('Failed to fetch products:', error);
  } finally {
    if (requestId === productsRequestId) {
      productsLoading = false;
      renderMenu();
    }
  }
}

const categories = ['All drinks', 'Milk Tea', 'Fruit Tea', 'Specialty', 'Matcha'];
let cart: CartItem[] = [];
let searchTerm = '';
let activeCategory = 'All drinks';
let currentProductId = '';
let cartOpen = false;
let name = '';
let email = '';
let detailQuantity = 1;
const money = (price: number) => `$${price.toFixed(2)}`;

function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, classes: string[] = [], text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (classes.length > 0) element.classList.add(...classes);
  if (text !== undefined) element.textContent = text;
  return element;
}

function createButton(text: string, classes: string[], onClick: () => void, type: 'button' | 'submit' = 'button') {
  const button = createElement('button', classes, text);
  button.type = type; button.addEventListener('click', onClick);
  return button;
}

function createLink(text: string, href: string, classes: string[] = []) {
  const link = createElement('a', classes, text);
  link.href = href;
  return link;
}

function createImage(src: string, alt: string, classes: string[] = []) {
  const image = createElement('img', classes);
  image.src = src; image.alt = alt; image.loading = 'lazy';
  return image;
}

function createText(tagName: 'p' | 'span' | 'small' | 'strong' | 'h1' | 'h2' | 'h3', text: string, classes: string[] = []) {
  return createElement(tagName, classes, text);
}

function getProductImage(product: Product) {
  return `${IMAGE_BASE_PATH}${product.image}`;
}

function createBrand() {
  const brand = createLink('', '#/', ['flex', 'items-center', 'gap-3', 'shrink-0', 'no-underline', 'text-tea-1']);
  const mark = createElement('span', ['grid', 'place-items-center', 'w-11', 'h-11', 'rounded-full', 'bg-tea-2', 'text-cream', 'font-display', 'text-3xl']);
  mark.append(document.createTextNode('M'));
  const brandCopy = createElement('span', ['flex', 'flex-col']);
  brandCopy.append(
    createText('span', 'Milkteaism', ['font-display', 'text-2xl', 'leading-none']),
    createText('small', 'A milktea shop', ['mt-1', 'text-[10px]', 'tracking-[2px]', 'text-stone-500'])
  );
  brand.append(mark, brandCopy);
  return brand;
}

function renderHeader() {
  if (!navbarDiv) return;
  navbarDiv.replaceChildren();
  const header = createElement('header', ['flex', 'min-h-[82px]', 'items-center', 'justify-between', 'gap-5', 'border-b', 'border-stone-200', 'bg-cream/85', 'px-5', 'py-3', 'md:px-10', 'lg:px-16']);
  const nav = createElement('nav', ['hidden', 'items-center', 'gap-7', 'md:flex']);
  const actions = createElement('div', ['flex', 'items-center', 'gap-3']);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartButton = createButton('Cart', ['flex', 'items-center', 'gap-2', 'rounded-full', 'bg-tea-2', 'px-4', 'py-3', 'text-sm', 'font-semibold', 'text-white', 'hover:bg-tea-1'], () => { cartOpen = true; renderCart(); });
  cartButton.append(createElement('span', ['grid', 'h-5', 'min-w-5', 'place-items-center', 'rounded-full', 'bg-white/20', 'px-1', 'text-xs'], String(cartQuantity)));
  actions.append(cartButton);
  header.append(createBrand(), nav, actions);
  navbarDiv.append(header);
}

function getVisibleProducts() {
  return products.filter(product => activeCategory === 'All drinks' || product.category === activeCategory);
}

function createProductCard(product: Product) {
  const card = createElement('article', ['group', 'min-w-0']);
  const imageLink = createLink('', `#/product/${product.productId}`, ['product-image', 'relative', 'block', 'overflow-hidden', 'bg-[#f0e9dd]']);
  const image = createImage(getProductImage(product), product.name, ['drink-illustration', 'transition-transform', 'duration-300', 'group-hover:scale-105']);
  imageLink.append(image);
  const badge = createText('span', product.category.toUpperCase(), ['absolute', 'left-3', 'top-3', 'bg-white/90', 'px-2', 'py-1.5', 'text-[9px]', 'tracking-wider', 'text-tea-2']);
  imageLink.append(badge);
  const details = createElement('div', ['pt-4']);
  const title = createLink(product.name, `#/product/${product.productId}`, ['font-display', 'text-lg', 'text-tea-1', 'hover:text-tea-3', 'sm:text-xl']);
  const description = createText('p', product.description, ['mt-2', 'min-h-10', 'text-xs', 'leading-5', 'text-stone-500']);
  const bottom = createElement('div', ['mt-4', 'flex', 'items-center', 'justify-between', 'gap-2']);
  bottom.append(createText('strong', money(product.price), ['text-sm', 'font-bold', 'text-tea-1']));
  details.append(title, description, bottom);
  card.append(imageLink, details);
  return card;
}


function renderFilters() {
  const controls = createElement('section', ['mb-8']);
  const searchForm = createElement('form', ['mb-5', 'flex', 'w-full', 'max-w-lg', 'gap-2']);
  const searchInput = createElement('input', ['min-w-0', 'flex-1', 'rounded-full', 'border', 'border-stone-200', 'bg-white', 'px-4', 'py-3', 'text-sm', 'outline-none', 'focus:border-tea-3']);
  searchInput.type = 'search';
  searchInput.placeholder = 'Search drinks';
  searchInput.value = searchTerm;
  searchInput.setAttribute('aria-label', 'Search drinks');

  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value;
  });

  const searchButton = createButton('Search', ['rounded-full', 'bg-tea-2', 'px-5', 'py-3', 'text-sm', 'font-semibold', 'text-white', 'hover:bg-tea-1', 'disabled:cursor-not-allowed', 'disabled:opacity-50'], () => { });
  searchButton.type = 'submit';
  searchButton.disabled = productsLoading;

  searchForm.append(searchInput, searchButton);

  searchForm.addEventListener('submit', event => {
    event.preventDefault();

    if (productsLoading) return;

    searchTerm = searchInput.value.trim();

    const route = activeCategory === 'All drinks'
      ? '#/'
      : `#/category/${encodeURIComponent(activeCategory)}`;

    const hash = searchTerm
      ? `${route}?keyword=${encodeURIComponent(searchTerm)}`
      : route;

    if (window.location.hash === hash) {
      void fetchProducts(activeCategory, searchTerm);
    } else {
      window.location.hash = hash;
    }
  });

  const row = createElement('div', ['flex', 'flex-wrap', 'gap-2',]);

  for (const category of categories) {
    const classes = ['rounded-full', 'border', 'px-4', 'py-2.5', 'text-xs', 'transition-colors',];

    if (activeCategory === category) {
      classes.push('border-tea-2', 'bg-tea-2', 'text-white',);
    } else {
      classes.push('border-stone-200', 'bg-white', 'text-stone-600', 'hover:border-tea-3',);
    }

    row.append(
      createButton(category, classes, () => {
        if (activeCategory === category) return;
        activeCategory = category;

        const route = category === 'All drinks'
          ? '#/'
          : `#/category/${encodeURIComponent(category)}`;

        const hash = searchTerm
          ? `${route}?keyword=${encodeURIComponent(searchTerm)}`
          : route;

        if (window.location.hash === hash) {
          void fetchProducts(category, searchTerm);
          renderMenu();
        } else {
          window.location.hash = hash;
        }
      }),
    );
  }

  controls.append(searchForm, row);
  return controls;
}

function renderProductGrid() {
  const gridContainer = document.getElementById('product-grid');
  if (!gridContainer) return;
  gridContainer.replaceChildren();

  if (productsLoading) {
    gridContainer.append(createText('p', 'Loading drinks...', ['col-span-full', 'py-16', 'text-center', 'text-sm', 'text-stone-500',]));
    return;
  }

  if (productsError) {
    const errorMessage = createElement('div', ['col-span-full', 'py-16', 'text-center',]);

    errorMessage.append(
      createText('h3', 'Unable to load drinks', ['font-display', 'text-2xl', 'text-tea-1',]),
      createText('p', productsError, ['mt-2', 'text-sm', 'text-stone-500',]),
      createButton('Try again', ['mt-5', 'rounded-sm', 'bg-tea-2', 'px-5', 'py-3', 'text-sm', 'text-white',], () => { void fetchProducts(); })
    );

    gridContainer.append(errorMessage);
    return;
  }

  const visible = getVisibleProducts();
  if (visible.length === 0) {
    const empty = createElement('div', ['col-span-full', 'py-16', 'text-center']);
    empty.append(createText('h3', 'No drinks found', ['font-display', 'text-2xl', 'text-tea-1']), createText('p', 'Try changing your search or filters.', ['mt-2', 'text-sm', 'text-stone-500']), createButton('Clear filters', ['mt-5', 'rounded-sm', 'bg-tea-2', 'px-5', 'py-3', 'text-sm', 'text-white'], () => { activeCategory = 'All drinks'; void fetchProducts('All drinks'); renderMenu(); }));
    gridContainer.append(empty);
    return;
  }
  for (const product of visible) gridContainer.append(createProductCard(product));
}

function renderMenu() {
  if (!menuDiv) return;
  menuDiv.replaceChildren();
  const section = createElement('section', ['mx-auto', 'max-w-7xl', 'px-6', 'py-16', 'md:px-12', 'md:py-20', 'lg:px-16']);
  const heading = createElement('div', ['mb-8', 'flex', 'flex-col', 'gap-3', 'sm:flex-row', 'sm:items-end', 'sm:justify-between']);
  const headingCopy = createElement('div');
  headingCopy.append(createText('h2', 'Menu', ['font-display', 'text-4xl', 'text-tea-1', 'sm:text-5xl']));
  const count = createText('p', '', ['text-xs', 'text-stone-500']); count.id = 'result-count';
  heading.append(headingCopy, count);
  const filters = renderFilters();
  const grid = createElement('div', ['grid', 'grid-cols-2', 'gap-x-4', 'gap-y-10', 'sm:grid-cols-3', 'sm:gap-x-6', 'lg:grid-cols-4', 'lg:gap-x-7', 'lg:gap-y-12']);
  grid.id = 'product-grid';
  section.append(heading, filters, grid);
  menuDiv.append(section);
  renderProductGrid();
}

function createQuantityControl(quantity: number, onDecrease: () => void, onIncrease: () => void, large = false) {
  const control = createElement('div', ['flex', 'items-center', 'rounded-sm', 'border', 'border-stone-200', 'bg-white']);
  const buttonClasses = large ? ['h-11', 'w-10', 'text-lg', 'text-tea-2', 'hover:bg-tea-4'] : ['h-7', 'w-7', 'text-base', 'text-tea-2', 'hover:bg-tea-4'];
  control.append(createButton('−', buttonClasses, onDecrease), createElement('span', ['min-w-7', 'text-center', 'text-xs', 'font-semibold'], String(quantity)), createButton('+', buttonClasses, onIncrease));
  return control;
}

function addToCart(product: Product, quantity = 1) {
  const item = cart.find(cartItem => cartItem.product.productId === product.productId);
  if (item) item.quantity = Math.min(product.stock, item.quantity + quantity);
  else cart.push({ product, quantity: Math.min(product.stock, quantity) });
  renderHeader();
  if (cartOpen) renderCart();
}

function changeCartQuantity(productId: string, amount: number) {
  const item = cart.find(cartItem => cartItem.product.productId === productId);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(cartItem => cartItem.product.productId !== productId);
  else item.quantity = Math.min(item.product.stock, item.quantity);
  renderHeader(); renderCart();
}

function renderCart() {
  if (!cartRootDiv) return;
  cartRootDiv.replaceChildren();
  if (!cartOpen) return;

  const backdrop = createElement('div', ['cart-backdrop']); backdrop.addEventListener('click', () => { cartOpen = false; renderCart(); });

  const panel = createElement('aside', ['cart-panel', 'flex', 'flex-col', 'p-6', 'sm:p-8']);
  panel.setAttribute('aria-label', 'Shopping cart');

  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const heading = createElement('div', ['flex', 'items-start', 'justify-between', 'border-b', 'border-stone-200', 'pb-5']);
  const headingText = createElement('div');
  headingText.append(createText('h2', `Your cart (${quantity})`, ['font-display', 'text-2xl', 'text-tea-1']));
  heading.append(headingText, createButton('×', ['grid', 'h-9', 'w-9', 'place-items-center', 'rounded-full', 'bg-tea-4', 'text-2xl', 'text-tea-2'], () => { cartOpen = false; renderCart(); }));
  panel.append(heading);

  if (cart.length === 0) {
    const empty = createElement('div', ['my-auto', 'py-12', 'text-center']);
    empty.append(createText('h3', 'Your cart is currently empty.', ['font-display', 'text-2xl', 'text-tea-1']));
    panel.append(empty);
  } else {
    const items = createElement('div', ['flex-1', 'overflow-y-auto', 'py-3']);

    for (const item of cart) {
      const row = createElement('div', ['grid', 'grid-cols-[72px_1fr_auto]', 'items-start', 'gap-3', 'border-b', 'border-stone-100', 'py-4']);
      row.append(createImage(getProductImage(item.product), item.product.name, ['h-[78px]', 'w-[72px]', 'rounded-sm', 'bg-[#f0e9dd]', 'object-cover']));

      const info = createElement('div', ['flex', 'flex-col', 'items-start', 'gap-2']);
      info.append(
        createLink(item.product.name, `#/product/${item.product.productId}`, ['font-display', 'text-base', 'text-tea-1']),
        createText('small', `${money(item.product.price)} each`, ['text-[10px]', 'text-stone-500']),
        createQuantityControl(item.quantity, () => changeCartQuantity(item.product.productId, -1), () => changeCartQuantity(item.product.productId, 1))
      );
      row.append(info, createText('strong', money(item.product.price * item.quantity), ['pt-1', 'text-xs', 'text-tea-1']));
      items.append(row);
    }

    const form = createElement('form', ['border-t', 'border-stone-200', 'pt-5']);
    const nameLabel = createElement('label', ['mb-2', 'block', 'text-xs', 'font-semibold', 'text-tea-1'], 'Your name');
    nameLabel.htmlFor = 'customer-name';

    const nameInput = createElement('input', ['mb-4', 'w-full', 'rounded-sm', 'border', 'border-stone-200', 'bg-white', 'px-3', 'py-3', 'text-sm', 'outline-none', 'focus:border-tea-3']);
    nameInput.id = 'customer-name'; nameInput.type = 'text'; nameInput.name = 'name'; nameInput.placeholder = 'Your name'; nameInput.autocomplete = 'name'; nameInput.required = false; nameInput.value = name;
    nameInput.addEventListener('input', () => { name = nameInput.value; });

    const emailLabel = createElement('label', ['mb-2', 'block', 'text-xs', 'font-semibold', 'text-tea-1'], 'Email for your receipt');
    emailLabel.htmlFor = 'receipt-email';

    const emailInput = createElement('input', ['w-full', 'rounded-sm', 'border', 'border-stone-200', 'bg-white', 'px-3', 'py-3', 'text-sm', 'outline-none', 'focus:border-tea-3']);
    emailInput.id = 'receipt-email'; emailInput.type = 'text'; emailInput.name = 'email'; emailInput.placeholder = 'you@example.com'; emailInput.autocomplete = 'email'; emailInput.required = false; emailInput.value = email;
    emailInput.addEventListener('input', () => { email = emailInput.value; });

    form.append(nameLabel, nameInput, emailLabel, emailInput);

    const totalRow = createElement('div', ['mt-5', 'flex', 'items-center', 'justify-between', 'border-t', 'border-stone-200', 'pt-5']);

    totalRow.append(
      createText('span', 'Total', ['text-sm', 'text-stone-600']),
      createText('strong', money(total), ['text-xl', 'text-tea-1'])
    );

    const submit = createElement('button', ['mt-5', 'flex', 'w-full', 'items-center', 'justify-between', 'rounded-sm', 'bg-tea-2', 'px-5', 'py-4', 'text-sm', 'font-semibold', 'text-white', 'hover:bg-tea-1']);

    submit.type = 'submit';
    submit.append(document.createTextNode('Place order'), createText('span', '→', ['text-lg', 'text-orange-200']));

    form.append(totalRow, submit);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (cart.length === 0) return;

      const orderPayload = {
        customer_name: name.trim(),
        email: email.trim(),
        order_list: cart.map(item => ({
          product_id: item.product.productId,
          product_name: item.product.name,
          category: item.product.category,
          quantity: item.quantity,
        })),
      };
      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Placing order...';
      }
      let responseStatus = '';
      try {
        const response = await fetch(
          'https://bdb25p8n26.execute-api.us-east-1.amazonaws.com/Prod/add_order',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderPayload),
          }
        );
        responseStatus = String(response.status);
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Order failed (${responseStatus}): ${errorBody}`
          );
        }

      } catch (error) {
        console.error('Failed to place order:', error);
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        alert(`Could not place your order. ${message}`);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Place order';
        }
        if (responseStatus === "200") {
          alert(`Order successful (${responseStatus}): Check your email at ${email}`);
          name = ''; email = ''; cart = [];
          renderHeader();
          renderCart();
        }
      }
    });
    panel.append(items, form);
  }

  cartRootDiv.append(backdrop, panel);
}

function renderProductDetail(product: Product) {
  if (!productDetailDiv) return;
  productDetailDiv.replaceChildren();

  const page = createElement('section', ['mx-auto', 'max-w-7xl', 'px-6', 'py-8', 'md:px-12', 'md:py-12', 'lg:px-16']);
  const breadcrumb = createElement('div', ['mb-7', 'flex', 'flex-wrap', 'items-center', 'gap-2', 'text-xs', 'text-stone-500']);
  breadcrumb.append(createLink('Shop', '#/', ['hover:text-tea-2']), createText('span', '/', []), createText('span', product.category), createText('span', '/', []), createText('span', product.name, ['text-tea-2']));

  const layout = createElement('div', ['grid', 'items-start', 'gap-8', 'md:grid-cols-2', 'md:gap-14', 'lg:gap-20']);
  const imageWrap = createElement('div', ['relative', 'overflow-hidden', 'rounded-sm', 'bg-[#f0e9dd]']);
  imageWrap.append(createImage(getProductImage(product), product.name, ['aspect-square', 'w-full', 'object-cover']));

  const copy = createElement('div', ['py-2', 'md:py-5']);
  copy.append(createText('p', product.category.toUpperCase(), ['mb-4', 'text-[10px]', 'font-bold', 'tracking-[2px]', 'text-tea-3']), createText('h1', product.name, ['font-display', 'text-4xl', 'leading-tight', 'text-tea-1', 'sm:text-5xl']), createText('p', money(product.price), ['mt-5', 'text-2xl', 'font-bold', 'text-tea-1']), createText('p', product.description, ['mt-5', 'text-sm', 'leading-7', 'text-stone-600']), createText('p', `${product.stock} available`, ['mt-5', 'text-xs', 'text-tea-3']));

  const divider = createElement('div', ['my-6', 'h-px', 'bg-stone-200']);
  const quantityLabel = createText('p', 'Quantity', ['mb-3', 'text-xs', 'font-semibold', 'text-tea-1']);
  const buyRow = createElement('div', ['flex', 'gap-3']);
  const quantityWrap = createElement('div', ['flex', 'items-center']);
  const quantityControl = createQuantityControl(detailQuantity, () => { detailQuantity = Math.max(1, detailQuantity - 1); renderProductDetail(product); }, () => { detailQuantity = Math.min(product.stock, detailQuantity + 1); renderProductDetail(product); }, true);
  quantityWrap.append(quantityControl);

  const addButton = createButton('', ['flex', 'flex-1', 'items-center', 'justify-between', 'rounded-sm', 'bg-tea-2', 'px-5', 'py-4', 'text-sm', 'font-semibold', 'text-white', 'hover:bg-tea-1'], () => { addToCart(product, detailQuantity); window.location.hash = '#/'; });
  addButton.append(document.createTextNode('Add to cart'), createText('span', money(product.price * detailQuantity), ['text-orange-200']));
  buyRow.append(quantityWrap, addButton);
  copy.append(divider, quantityLabel, buyRow);
  layout.append(imageWrap, copy);
  page.append(breadcrumb, layout);
  productDetailDiv.append(page);
}

function renderRoute() {
  const hash = window.location.hash || '#/';
  const [route, queryString] = hash.split('?');
  const params = new URLSearchParams(queryString || '');
  searchTerm = params.get('keyword') || '';

  const productMatch = route.match(/^#\/product\/(P\d+)$/);
  const categoryMatch = route.match(/^#\/category\/(.+)$/);
  currentProductId = productMatch?.[1] || '';

  if (categoryMatch) {
    try { activeCategory = decodeURIComponent(categoryMatch[1]); } catch { activeCategory = 'All drinks'; }
    if (!categories.includes(activeCategory)) activeCategory = 'All drinks';
  } else if (!productMatch) activeCategory = 'All drinks';

  renderHeader();

  if (productMatch) {
    const product = products.find(item => item.productId === currentProductId);
    if (product) renderProductDetail(product);
    else {
      productDetailDiv?.replaceChildren();
      const notFound = createElement('section', ['px-6', 'py-24', 'text-center']);
      notFound.append(createText('h1', 'We couldn’t find that drink.', ['font-display', 'text-3xl', 'text-tea-1']), createLink('Back to all drinks', '#/', ['mt-5', 'inline-block', 'text-sm', 'text-tea-2', 'underline']));
      productDetailDiv?.append(notFound);
    }
  } else {
    productDetailDiv?.replaceChildren();
    renderMenu();
  }
}

function init() {
  if (!navbarDiv || !productDetailDiv || !menuDiv || !cartRootDiv) {
    return;
  }

  renderRoute();

  void fetchProducts();

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    const [route, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');
    searchTerm = params.get('keyword') || '';

    if (route.startsWith('#/category/')) {
      let category: string;

      try {
        category = decodeURIComponent(
          route.replace('#/category/', '')
        );
      } catch {
        category = 'All drinks';
      }

      activeCategory = categories.includes(category)
        ? category
        : 'All drinks';

      void fetchProducts(activeCategory, searchTerm);
    } else if (route.startsWith('#/product/')) {
      const productMatch = route.match(/^#\/product\/(P\d+)$/);
      const productId = productMatch?.[1];

      if (productId && !products.some(p => p.productId === productId)) {
        void fetchProducts('All drinks', '');
      }
    } else {
      activeCategory = 'All drinks';
      void fetchProducts('All drinks', searchTerm);
    }

    renderRoute();
  });
}
window.addEventListener('load', init);
