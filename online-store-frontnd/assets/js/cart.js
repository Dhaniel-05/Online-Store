class ShoppingCart {
    constructor() {
        this.cart = this.loadCart();
        this.updateUI();
    }

    loadCart() {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    addItem(productId) {
        const product = products.find(p => p.id === productId); // Busca el producto en la variable global
        if (!product) return; // Si no se encuentra el producto, salir

        const cartItem = this.cart.find(item => item.id === productId);

        if (cartItem) {
            cartItem.quantity++;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateUI();
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateUI();
    }

    updateQuantity(productId, change) {
        const cartItem = this.cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity += change;
            if (cartItem.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateUI();
            }
        }
    }

    getTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateUI();
    }

    updateUI() {
        const cartItems = document.getElementById('cart-items');
        const cartCount = document.querySelector('.cart-count');
        const cartTotal = document.getElementById('cart-total');
    
        // Actualizar contador
        cartCount.textContent = this.cart.reduce((total, item) => total + item.quantity, 0);
    
        // Actualizar items del carrito
        cartItems.innerHTML = this.cart.map(item => {
            // Manejar imagen base64 o usar imagen por defecto
            const imageSource = item.image 
                ? `data:image/jpeg;base64,${item.image}` // Asegúrate de que esto sea correcto
                : 'path/to/default-image.jpg';
    
            return `
                <div class="cart-item">
                    <img src="${imageSource}" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p>$${item.price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <div class="item-quantity">
                            <button class="quantity-btn" onclick="shoppingCart.updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="shoppingCart.updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    
        // Actualizar total
        cartTotal.textContent = `${this.getTotal().toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
