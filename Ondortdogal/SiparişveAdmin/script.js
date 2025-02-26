// Google Sheets API URL'si - Bu URL'yi Google Apps Script'ten aldığınız URL ile değiştirin
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbw4vJIbfBRwrYKA1sXLWcBe2Dp2tusCvymJV5gSnESBowU-tlhwhITe-B8OMLaBfqzOuA/exec';

let cart = []; // Sepet başlangıçta boş
let totalPrice = 0;

// Sayfa yüklendiğinde çalışacak kodlar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sayfa yüklendi'); // Kontrol için

    const cartItems = document.querySelector('#cart-items');
    const totalPriceElement = document.querySelector('#total-price');
    const orderButton = document.querySelector('#submit-order');
    const ordersTable = document.querySelector("#orders-table");

    // Ürün butonlarına tıklama olaylarını ekle
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Butona tıklandı!'); // Kontrol için
            const name = button.getAttribute('data-name');
            const price = parseInt(button.getAttribute('data-price'));
            
            // Fiyat kontrolü
            if (!isNaN(price) && price > 0) {
                addToCart(name, price);
                updateCartDisplay();
                updateTotalPrice();
            } else {
                console.error('Geçersiz fiyat:', price);
            }
        });
    });
    


    // Mobil cihazlar için dokunmatik olayları ekle
    document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("touchstart", (e) => {
            e.target.style.opacity = "0.7";
        });

        button.addEventListener("touchend", (e) => {
            e.target.style.opacity = "1";
        });
    });

    // Admin sayfasındaysa siparişleri yükle
    if (ordersTable) {
        loadOrders();
    }

    // Sipariş butonu işlemi
    if (orderButton) {
        orderButton.addEventListener('click', async () => {
            const nameInput = document.querySelector('#customer-name');
            const phoneInput = document.querySelector('#customer-phone');
            const addressInput = document.querySelector('#customer-address');

            // Form elementlerinin varlığını kontrol et
            if (!nameInput || !phoneInput || !addressInput) {
                console.error('Form elementleri bulunamadı!');
                return;
            }

            const customerName = nameInput.value.trim();
            const customerPhone = phoneInput.value.trim();
            const customerAddress = addressInput.value.trim();

            if (!customerName || !customerPhone || !customerAddress) {
                alert('Lütfen tüm bilgileri doldurun!');
                return;
            }

            if (cart.length === 0) {
                alert('Sepetiniz boş!');
                return;
            }

            const success = await submitOrder(customerName, customerPhone, customerAddress);
            if (success) {
                const message = `*Yeni Sipariş*\n\nMüşteri: ${customerName}\nTelefon: ${customerPhone}\nAdres: ${customerAddress}\n\nSipariş:\n${cart.map(item => `${item.name} - ${item.price}₺`).join('\n')}\n\nToplam: ${totalPrice}₺`;
                const whatsappUrl = `https://wa.me/905053479798?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                alert('Siparişiniz alındı!');
                
                // Formu temizle
                nameInput.value = '';
                phoneInput.value = '';
                addressInput.value = '';
                
                // Sepeti temizle
                cart = [];
                totalPrice = 0;
                updateCartDisplay();
                updateTotalPrice();
            } else {
                alert('Sipariş gönderilirken bir hata oluştu!');
            }
        });
    }

    // Login form kontrolü
    const loginForm = document.querySelector('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            if (username === 'admin' && password === 'admin') {
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
                loadProducts(); // Ürünleri yükle
                loadOrders();  // Siparişleri yükle
            } else {
                alert('Kullanıcı adı veya şifre hatalı!');
            }
        });
    }

    // Admin panelindeki ürün tablosunu yükle
    const productsTable = document.querySelector("#products-table tbody");
    if (productsTable) {
        loadProducts();
    }
    
    // Ana sayfada ürünleri localStorage'dan al
    if (document.querySelector(".product-list")) {
        const products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
        // Ürün fiyatlarını güncelle
        products.forEach(product => {
            const priceElement = document.querySelector(`[data-product="${product.name}"] .price`);
            if (priceElement) {
                priceElement.textContent = `${product.price}₺`;
            }
        });
    }

    // Ürün ekleme formunu kontrol et
    const addProductForm = document.querySelector('#add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const productName = document.querySelector('#product-name').value.trim();
            const productPrice = parseInt(document.querySelector('#product-price').value.trim());
            
            if (!productName || isNaN(productPrice) || productPrice <= 0) {
                alert('Lütfen geçerli bir ürün adı ve fiyatı girin!');
                return;
            }

            // Yeni ürünü localStorage'a ekle
            const products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
            products.push({ name: productName, price: productPrice });
            localStorage.setItem('products', JSON.stringify(products));
            
            alert(`${productName} ürünü ${productPrice}₺ olarak eklendi!`);
            
            // Formu temizle
            document.querySelector('#product-name').value = '';
            document.querySelector('#product-price').value = '';
            
            // Ürünleri güncelle
            loadProducts();
        });
    }

    // Eğer sipariş sayfasındaysak ürünleri yükle
    if (document.querySelector('.product-list')) {
        loadProductsToOrderPage();
    }
});

// Siparişleri yükleme fonksiyonu
async function loadOrders() {
    try {
        const response = await fetch(SHEET_API_URL);
        const orders = await response.json();
        
        const ordersTableBody = document.querySelector("#orders-table tbody");
        ordersTableBody.innerHTML = "";
        
        orders.forEach((order, index) => {
            ordersTableBody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${order['Müşteri Adı'] || 'Belirtilmemiş'}</td>
                    <td>${order['Telefon'] || 'Belirtilmemiş'}</td>
                    <td>${order['Adres'] || 'Belirtilmemiş'}</td>
                    <td>${order['Sipariş Detayı'] || 'Belirtilmemiş'}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Siparişler yüklenemedi:', error);
        console.log('Hata detayı:', error);
        alert('Siparişler yüklenemedi!');
    }
}

// Ürünleri yükleme fonksiyonu
function loadProducts() {
    const productsTable = document.querySelector("#products-table tbody");
    if (!productsTable) return;
    
    productsTable.innerHTML = ""; // Tabloyu temizle
    
    const products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
    products.forEach(product => {
        productsTable.innerHTML += `
            <tr data-product-name="${product.name}">
                <td>${product.name}</td>
                <td>${product.price}₺</td>
                <td>
                    <input type="number" class="new-price" value="${product.price}">
                </td>
                <td>
                    <button onclick="updatePrice('${product.name}')" class="update-btn">Güncelle</button>
                    <button onclick="deleteProduct('${product.name}')" class="delete-btn">Sil</button>
                </td>
            </tr>
        `;
    });
}

// Fiyat güncelleme fonksiyonu
function updatePrice(productName) {
    const row = document.querySelector(`tr[data-product-name="${productName}"]`);
    const newPrice = row.querySelector('.new-price').value;
    
    if (newPrice && newPrice > 0) {
        const products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
        const updatedProducts = products.map(product => {
            if (product.name === productName) {
                return { ...product, price: parseInt(newPrice) };
            }
            return product;
        });
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        alert(`${productName} fiyatı ${newPrice}₺ olarak güncellendi!`);
        loadProducts(); // Tabloyu yenile
    } else {
        alert('Lütfen geçerli bir fiyat girin!');
    }
}

// Ürün silme fonksiyonu
function deleteProduct(productName) {
    const products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
    const updatedProducts = products.filter(product => product.name !== productName);
    
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    loadProducts(); // Tabloyu yenile
    alert(`${productName} ürünü silindi!`);
}

// Varsayılan ürünler (ilk kez için)
const defaultProducts = [
    { name: "Antep Fıstığı", price: 700 },
    { name: "Maraş Sucuğu", price: 350 },
    { name: "Badem", price: 600 },
    { name: "Fındık", price: 600 },
    { name: "Kivi Kurusu", price: 450 },
    { name: "Hindistan Cevizi Kurusu", price: 450 },
    { name: "Yer Fıstığı", price: 150 },
    { name: "Kaju", price: 650 },
    { name: "Kurutulmuş Pamelo", price: 400 },
    { name: "Kurutulmuş Ananas", price: 400 },
    { name: "Kurutulmuş Kavun", price: 400 },
    { name: "Kurutulmuş Zencefil", price: 400 },
    { name: "Guava", price: 400 },
    { name: "Zeytinyağı", price: 400 }
];

// Sepete ürün ekleme fonksiyonu
function addToCart(name, price) {
    cart.push({ name, price });
    console.log(`Ürün eklendi: ${name} - ${price}₺`);
    console.log(cart); // Sepet durumu
}

// Sepeti güncelleme fonksiyonu
function updateCartDisplay() {
    const cartItems = document.querySelector('#cart-items');
    if (!cartItems) return;

    cartItems.innerHTML = '';
    cart.forEach(item => {
        cartItems.innerHTML += `
            <li class="cart-item">
                ${item.name} - ${item.price}₺
            </li>
        `;
    });
}

// Toplam fiyatı güncelleme fonksiyonu
function updateTotalPrice() {
    const totalPriceElement = document.querySelector('#total-price');
    if (!totalPriceElement) return;

    totalPrice = cart.reduce((total, item) => total + item.price, 0);
    totalPriceElement.textContent = `Toplam: ${totalPrice}₺`;
}

// Ürünleri sipariş sayfasına yükleme fonksiyonu
function loadProductsToOrderPage() {
    const products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
    const productList = document.querySelector('.product-list');

    if (productList) {
        productList.innerHTML = ''; // Mevcut ürünleri temizle
        products.forEach(product => {
            productList.innerHTML += `
                <div class="product" data-product="${product.name}">
                    <h3>${product.name}</h3>
                    <p class="price">${product.price}₺</p>
                    <button class="add-to-cart" data-name="${product.name}" data-price="${product.price}">Sepete Ekle</button>
                </div>
            `;
        });
    }
}

// ... diğer fonksiyonlar ve kodlar ...