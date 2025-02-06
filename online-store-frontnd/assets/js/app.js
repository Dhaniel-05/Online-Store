let shoppingCart;
let products = []; // Variable global para almacenar productos

async function renderProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        products = await response.json(); // Almacena los productos en la variable global
        
        const container = document.getElementById('products-container');
        container.innerHTML = products.map(product => {
            const imageSource = product.image 
                ? `data:${product.imageType};base64,${product.image}`
                : 'path/to/default-image.jpg';

            return `
            <div class="product-card">
                <img src="${imageSource}" alt="${product.name}" class="product-image">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div class="product-buttons">
                    <button class="btn btn-primary" onclick="shoppingCart.addItem(${product.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="showProductModal(${product.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="openProductModal(${product.id})">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

async function saveProduct(event) {
    event.preventDefault();
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const price = document.getElementById('product-price').value;
    const description = document.getElementById('product-description').value;
    const imageFile = document.getElementById('product-image').files[0];

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);
    if (imageFile) formData.append('image', imageFile);

    try {
        const url = id 
            ? `http://localhost:5000/api/products/${id}` 
            : 'http://localhost:5000/api/products';
        
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            body: formData
        });

        const responseData = await response.json();

        if (response.ok) {
            closeProductManagementModal();
            renderProducts(); // Recargar productos
            console.log('Producto guardado:', responseData);
        } else {
            console.error('Error al guardar:', responseData);
            alert('No se pudo guardar el producto: ' + responseData.error);
        }
    } catch (error) {
        console.error('Error guardando producto:', error);
        alert('Error al guardar el producto');
    }
}
// Funciones para el carrito
function toggleCart() {
    const cartModal = document.getElementById('cart-modal');
    const overlay = document.getElementById('overlay');
    cartModal.classList.toggle('active');
    overlay.classList.toggle('active');
}

function checkout() {
    if (shoppingCart.cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    const total = shoppingCart.getTotal();
    alert(`¡Gracias por tu compra! Total: $${total.toFixed(2)}`);
    shoppingCart.clearCart();
    toggleCart();
}

// Funciones para el modal de producto
function showProductModal(productId) {
    const product = products.find(p => p.id === productId);
    const modal = document.getElementById('product-modal');
    const modalContent = document.getElementById('modal-product-details');

    modalContent.innerHTML = `
        <img src="${product.image ? `data:image/jpeg;base64,${product.image}` : 'path/to/default-image.jpg'}" alt="${product.name}" class="modal-product-image">
        <h2 class="modal-product-title">${product.name}</h2>
        <p class="modal-product-price">$${product.price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p class="modal-product-description">${product.description}</p>
        <button class="btn btn-primary" onclick="shoppingCart.addItem(${product.id}); hideProductModal();">
            Agregar al carrito
        </button>
    `;


    modal.style.display = 'block';
}

function hideProductModal() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
}

// Funciones para la búsqueda
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/products/search?query=${searchTerm}`);
            const filteredProducts = await response.json();

            if (filteredProducts.length > 0) {
                searchResults.innerHTML = filteredProducts.map(product => `
                    <div class="search-result-item" onclick="handleSearchResultClick(${product.id})">
                        ${product.name} - $${product.price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                `).join('');
                searchResults.style.display = 'block';
            } else {
                searchResults.innerHTML = '<div class="search-result-item">No se encontraron resultados</div>';
                searchResults.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    });

    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
}


function handleSearchResultClick(productId) {
    showProductModal(productId);
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('search-input').value = '';
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    shoppingCart = new ShoppingCart();
    renderProducts();
    setupSearch();

    // Event listener para cerrar el modal
    const closeModal = document.querySelector('.close-modal');
    const modal = document.getElementById('product-modal');
    
    closeModal.onclick = hideProductModal;
    modal.onclick = (e) => {
        if (e.target === modal) hideProductModal();
    };
});

// Funciones para manejo de productos en app.js
async function openProductModal(productId = null) {
    const modal = document.getElementById('product-management-modal');
    const form = document.getElementById('product-form');
    const saveBtn = document.getElementById('save-product-btn');

    if (productId) {
        // Modo edición
        const product = products.find(p => p.id === productId);
        document.getElementById('product-id').value = productId;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-description').value = product.description;
        saveBtn.textContent = 'Actualizar Producto';
    } else {
        // Modo creación
        form.reset();
        saveBtn.textContent = 'Crear Producto';
    }

    modal.style.display = 'block';
}

function closeProductManagementModal() {
    document.getElementById('product-management-modal').style.display = 'none';
}

async function deleteProduct(productId) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        try {
            const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                renderProducts(); // Recargar productos
            }
        } catch (error) {
            console.error('Error eliminando producto:', error);
        }
    }
}

// Añadir event listener al formulario
document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    productForm.addEventListener('submit', saveProduct);
});
