// Mattheessen's - Main JavaScript

// Cart State
let cart = JSON.parse(localStorage.getItem('mattheessensCart')) || [];
let bundle = [];

// DOM Elements
const cartIcon = document.getElementById('cartIcon');
const cartCount = document.getElementById('cartCount');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const bundleModal = document.getElementById('bundleModal');
const bundleCount = document.getElementById('bundleCount');
const progressFill = document.getElementById('progressFill');
const bundleSelected = document.getElementById('bundleSelected');
const bundleSummary = document.getElementById('bundleSummary');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load cart from localStorage first
    const savedCart = localStorage.getItem('mattheessensCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    
    initMobileMenu();
    updateCartUI();
});

// Quantity Adjustment
function adjustQuantity(button, change) {
    const input = button.parentElement.querySelector('.qty-input');
    let newValue = parseInt(input.value) + change;
    const maxVal = parseInt(input.max) || 4;
    if (newValue < 1) newValue = 1;
    if (newValue > maxVal) newValue = maxVal;
    input.value = newValue;
}

// Add to Bundle with Quantity
function addToBundle(button) {
    const card = button.closest('.product-detail-card');
    const input = card.querySelector('.qty-input');
    const name = input.dataset.name;
    const price = parseFloat(input.dataset.price);
    const type = input.dataset.type;
    const quantityToAdd = parseInt(input.value);
    
    // Check if this item is already in the bundle
    const existingItem = bundle.find(item => item.name === name);
    
    // Calculate current total in bundle
    const currentTotal = bundle.reduce((sum, item) => sum + item.quantity, 0);
    
    // If item exists, calculate what the new total would be
    let newTotal;
    if (existingItem) {
        // Replace old quantity with new quantity
        newTotal = currentTotal - existingItem.quantity + quantityToAdd;
    } else {
        newTotal = currentTotal + quantityToAdd;
    }
    
    // Check if new total would exceed limit (4 for cookies, 3 for fudge)
    const maxItems = type === 'fudge' ? 3 : 4;
    if (newTotal > maxItems) {
        const remaining = maxItems - (currentTotal - (existingItem ? existingItem.quantity : 0));
        if (remaining <= 0) {
            alert(`Bundle is full! You can only have ${maxItems} items total.`);
            return;
        }
        alert(`You can only have ${maxItems} items total. Please adjust the quantity.`);
        input.value = remaining;
        return;
    }
    
    // Remove existing item if present
    if (existingItem) {
        bundle = bundle.filter(item => item.name !== name);
    }
    
    // Add to bundle with quantity
    bundle.push({ name, price, type, quantity: quantityToAdd });
    
    // Update button
    button.classList.add('selected');
    button.textContent = `✓ ${quantityToAdd} in Bundle`;
    button.style.background = '#4A7C59';
    
    updateBundleUI();
    
    // Show modal when bundle is complete (4 for cookies, 3 for fudge)
    if (newTotal === maxItems) {
        setTimeout(() => {
            showBundleModal();
        }, 300);
    }
}

function removeFromBundle(name) {
    const item = bundle.find(i => i.name === name);
    bundle = bundle.filter(item => item.name !== name);
    
    // Reset button state
    const inputs = document.querySelectorAll('.qty-input');
    inputs.forEach(input => {
        if (input.dataset.name === name) {
            const card = input.closest('.product-detail-card');
            const button = card.querySelector('.btn-add-bundle');
            if (button) {
                button.classList.remove('selected');
                button.textContent = 'Add to Bundle';
                button.style.background = '';
            }
            input.value = 1;
        }
    });
    
    updateBundleUI();
}

function updateBundleUI() {
    const totalItems = bundle.reduce((sum, item) => sum + item.quantity, 0);
    const bundleTotal = bundle.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Determine bundle type from first item
    const bundleType = bundle.length > 0 ? bundle[0].type : 'cookie';
    const maxItems = bundleType === 'fudge' ? 3 : 4;
    
    // Update count
    if (bundleCount) bundleCount.textContent = totalItems;
    
    // Update progress bar
    if (progressFill) progressFill.style.width = `${(totalItems / maxItems) * 100}%`;
    
    // Update selected items display (below progress bar)
    if (bundleSelected) {
        if (bundle.length === 0) {
            const emptyText = bundleType === 'fudge' 
                ? 'Select 3 fudge slices below to build your bundle' 
                : 'Select 4 cookies below to build your bundle';
            bundleSelected.innerHTML = `<p class="empty-bundle">${emptyText}</p>`;
        } else {
            bundleSelected.innerHTML = bundle.map(item => `
                <div class="bundle-item">
                    ${item.name} x${item.quantity}
                    <button onclick="removeFromBundle('${item.name}')">×</button>
                </div>
            `).join('');
        }
    }
    
    // Update modal summary - show just names without prices for both
    if (bundleSummary) {
        bundleSummary.innerHTML = bundle.map(item => `
            <div class="bundle-summary-item">
                <span>${item.name} x${item.quantity}</span>
            </div>
        `).join('');
    }
    
    // Update modal total display
    const modalTotal = document.querySelector('.bundle-total .total-price');
    if (modalTotal) {
        if (bundleType === 'fudge') {
            // Fudge is always $25
            modalTotal.textContent = '$25.00';
        } else {
            // Cookies show calculated total when complete
            if (totalItems === 4) {
                modalTotal.textContent = `Total: $${bundleTotal.toFixed(2)}`;
            } else {
                modalTotal.textContent = `${totalItems}/4 cookies selected`;
            }
        }
    }
}

function showBundleModal() {
    if (bundleModal) bundleModal.classList.add('active');
}

function closeBundleModal() {
    if (bundleModal) bundleModal.classList.remove('active');
}

function addBundleToCart() {
    const totalItems = bundle.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems !== 4) return;
    
    const bundleNames = bundle.map(item => `${item.name} x${item.quantity}`).join(', ');
    const bundleTotal = bundle.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const bundleItem = {
        id: Date.now(),
        name: 'Cookie Box',
        description: bundleNames,
        items: [...bundle],
        price: bundleTotal,
        type: 'bundle'
    };
    
    cart.push(bundleItem);
    saveCart();
    
    // Clear bundle
    bundle = [];
    document.querySelectorAll('.btn-add-bundle').forEach(btn => {
        btn.classList.remove('selected');
        btn.textContent = 'Add to Bundle';
        btn.style.background = '';
    });
    document.querySelectorAll('.qty-input').forEach(input => {
        input.value = 1;
    });
    
    updateBundleUI();
    closeBundleModal();
    updateCartUI();
    toggleCart();
}

function continueShopping() {
    closeBundleModal();
}

function emptyBox() {
    // Clear the bundle array
    bundle = [];
    
    // Reset all bundle UI elements
    document.querySelectorAll('.btn-add-bundle').forEach(btn => {
        btn.classList.remove('selected');
        btn.textContent = 'Add to Box';
        btn.style.background = '';
    });
    
    // Reset all quantity inputs to 1
    document.querySelectorAll('.qty-input').forEach(input => {
        input.value = 1;
    });
    
    // Update the bundle UI
    updateBundleUI();
    
    // Close the modal
    closeBundleModal();
}

// Add Fudge to Cart (3 slices for $25)
function addFudgeToCart() {
    const totalItems = bundle.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems !== 3) {
        alert('Please select exactly 3 fudge slices.');
        return;
    }
    
    const bundleNames = bundle.map(item => `${item.name} x${item.quantity}`).join(', ');
    
    const bundleItem = {
        id: Date.now(),
        name: 'Fudge Bundle',
        description: bundleNames,
        items: [...bundle],
        price: 25.00,
        type: 'fudge'
    };
    
    cart.push(bundleItem);
    saveCart();
    
    // Clear bundle
    bundle = [];
    document.querySelectorAll('.btn-add-bundle').forEach(btn => {
        btn.classList.remove('selected');
        btn.textContent = 'Add to Box';
        btn.style.background = '';
    });
    document.querySelectorAll('.qty-input').forEach(input => {
        input.value = 1;
    });
    
    updateBundleUI();
    closeBundleModal();
    updateCartUI();
    toggleCart();
}

// Regular Add to Cart
function addToCart(name, price, type) {
    const existingItem = cart.find(item => item.name === name && item.type === type);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            name: name,
            price: price,
            type: type,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    toggleCart();
}

// Auto-Adjust Macaroon Bundle Counts
function autoAdjustMacaroons(bundleSize, changedField) {
    const regularInput = document.getElementById(`macaroon${bundleSize}-regular`);
    const chocInput = document.getElementById(`macaroon${bundleSize}-choc`);
    const totalDisplay = document.getElementById(`macaroon${bundleSize}-total`);
    
    let regularCount = parseInt(regularInput.value) || 0;
    let chocCount = parseInt(chocInput.value) || 0;
    
    // Auto-adjust the other field to maintain total
    if (changedField === 'regular') {
        // User changed regular, adjust chocolate
        chocCount = bundleSize - regularCount;
        if (chocCount < 0) chocCount = 0;
        if (chocCount > bundleSize) chocCount = bundleSize;
        chocInput.value = chocCount;
    } else {
        // User changed chocolate, adjust regular
        regularCount = bundleSize - chocCount;
        if (regularCount < 0) regularCount = 0;
        if (regularCount > bundleSize) regularCount = bundleSize;
        regularInput.value = regularCount;
    }
    
    // Update total display
    const total = regularCount + chocCount;
    totalDisplay.textContent = total;
}

// Macaroon Bundle Functions
function addMacaroonBundle(size) {
    let price, description;
    
    if (size === 2) {
        const m1 = document.getElementById('macaroon2-1').value;
        const m2 = document.getElementById('macaroon2-2').value;
        price = 12.00; // $6 x 2 = $12 (no discount)
        description = `${m1} + ${m2}`;
    } else {
        const regularCount = parseInt(document.getElementById(`macaroon${size}-regular`).value) || 0;
        const chocCount = parseInt(document.getElementById(`macaroon${size}-choc`).value) || 0;
        
        if (regularCount + chocCount !== size) {
            alert(`Please select exactly ${size} macaroons.`);
            return;
        }
        
        if (size === 4) {
            price = 24.00; // $6 x 4 = $24 (no discount)
        } else {
            price = 48.00; // $6 x 8 = $48 (no discount)
        }
        description = `${regularCount} Regular, ${chocCount} Chocolate Dipped`;
    }
    
    const bundleItem = {
        id: Date.now(),
        name: `Macaroon Bundle (${size})`,
        description: description,
        price: price,
        type: 'macaroon-bundle',
        quantity: 1
    };
    
    cart.push(bundleItem);
    saveCart();
    updateCartUI();
    toggleCart();
}

// Cart Functions
function toggleCart() {
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    // Update count
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (cartCount) cartCount.textContent = count;
    
    // Update items
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        } else {
            cartItems.innerHTML = cart.map(item => {
                // Get description - either from item.description or build from item.items
                let description = '';
                if (item.description) {
                    description = item.description;
                } else if (item.items) {
                    description = item.items.map(i => `${i.name} x${i.quantity}`).join(', ');
                }
                
                return `
                <div class="cart-item">
                    <div class="cart-item-image">${getItemEmoji(item.type)}</div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        ${description ? `<p>${description}</p>` : ''}
                        ${item.quantity > 1 ? `<p>Qty: ${item.quantity}</p>` : ''}
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                        <button onclick="removeFromCart(${item.id})" class="remove-btn">×</button>
                    </div>
                </div>
            `}).join('');
        }
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
}

function getItemEmoji(type) {
    const emojis = {
        'cookie': '🍪',
        'fudge': '🍫',
        'macaroon': '🥥',
        'macaroon-bundle': '🥥',
        'bundle': '🍪',
        'gift-cert': '💳'
    };
    return emojis[type] || '🍪';
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('mattheessensCart', JSON.stringify(cart));
}

// Mobile Menu
function initMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');
    
    if (mobileBtn && navLinks) {
        // Only apply mobile behavior on small screens
        const isMobile = window.innerWidth <= 768;
        
        // Set initial state based on screen size
        if (isMobile) {
            navLinks.style.display = 'none';
        } else {
            navLinks.style.display = 'flex';
            navLinks.style.position = '';
            navLinks.style.flexDirection = '';
            navLinks.style.background = '';
            navLinks.style.padding = '';
            navLinks.style.boxShadow = '';
        }
        
        // Mobile dropdown toggle
        if (dropdownToggle && dropdown) {
            dropdownToggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
        
        mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinks.classList.toggle('active');
            
            if (isActive) {
                navLinks.style.display = 'flex';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '60px';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.flexDirection = 'column';
                navLinks.style.background = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                navLinks.style.zIndex = '99';
            } else {
                navLinks.style.display = 'none';
            }
        });
        
        // Close menu when clicking a link (but not dropdown toggle)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                // Don't close if clicking the dropdown toggle
                if (link.classList.contains('dropdown-toggle')) {
                    return;
                }
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                    navLinks.style.display = 'none';
                }
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !navLinks.contains(e.target) && 
                !mobileBtn.contains(e.target) &&
                navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                navLinks.style.display = 'none';
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('active');
                navLinks.style.display = 'flex';
                navLinks.style.position = '';
                navLinks.style.top = '';
                navLinks.style.left = '';
                navLinks.style.right = '';
                navLinks.style.flexDirection = '';
                navLinks.style.background = '';
                navLinks.style.padding = '';
                navLinks.style.boxShadow = '';
                navLinks.style.zIndex = '';
                // Reset dropdown on resize
                if (dropdown) dropdown.classList.remove('active');
            } else if (!navLinks.classList.contains('active')) {
                navLinks.style.display = 'none';
            }
        });
    }
}

// Close modal on overlay click
if (bundleModal) {
    bundleModal.addEventListener('click', (e) => {
        if (e.target === bundleModal) closeBundleModal();
    });
}

// Newsletter form
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input').value;
        alert(`Thanks for subscribing! We'll send updates to ${email}`);
        newsletterForm.reset();
    });
}
