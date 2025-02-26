function searchFunction() {
    // Arama kutusundan değeri al
    let input = document.getElementById("searchInput").value.toLowerCase();
    
    // Tüm ürün kutularını seç
    let boxes = document.getElementsByClassName("box");
    
    // Her ürün kutusunu kontrol et
    for (let i = 0; i < boxes.length; i++) {
        let boxHead = boxes[i].querySelector(".box-head");
        let productName = boxHead.querySelector("h3").textContent.toLowerCase();
        let productCategory = boxHead.querySelector(".urun-katagori").textContent.toLowerCase();
        
        // Eğer arama metni ürün adında veya kategorisinde varsa göster, yoksa gizle
        if (productName.includes(input) || productCategory.includes(input)) {
            boxes[i].style.display = "";
        } else {
            boxes[i].style.display = "none";
        }
    }
}

// Arama butonuna tıklandığında input'u göster/gizle
document.querySelector('#search-btn').onclick = () => {
    document.querySelector('#searchInput').classList.toggle('active');
}

// Menü butonunu ve container'ı seç
const menuBtn = document.getElementById('menu-btn');
const menuContainer = document.querySelector('.menu-container');

// Menü linklerini seç
const menuLinks = document.querySelectorAll('.menu a');

// Menü butonuna tıklandığında
menuBtn.addEventListener('click', () => {
    menuContainer.classList.toggle('active');
});

// Her menü linkine tıklandığında
menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        menuContainer.classList.remove('active'); // Menüyü kapat
    });
});

// Sayfa herhangi bir yerine tıklandığında menüyü kapat
document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !menuContainer.contains(e.target)) {
        menuContainer.classList.remove('active');
    }
});

// WhatsApp numarasını güncelle
const whatsappNumber = "05053479798"; // Yeni WhatsApp numarası

// WhatsApp'a yönlendirme yap
const whatsappLink = `https://wa.me/05053479798`; // WhatsApp yönlendirme linki
