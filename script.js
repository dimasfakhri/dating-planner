document.querySelectorAll('.next-stage-btn').forEach(button => {
    button.addEventListener('click', (e) => navigateStage(e.target.dataset.target));
});

document.querySelectorAll('.back-stage-btn').forEach(button => {
    button.addEventListener('click', (e) => navigateStage(e.target.dataset.target));
});

function navigateStage(targetStage) {
    document.querySelectorAll('.planner-stage, .result-section').forEach(stage => {
        stage.classList.add('hidden');
    });

    const targetElement = document.getElementById(`stage-${targetStage}`);
    targetElement.classList.remove('hidden');

    // Update Header Title
    let title = "";
    if (targetStage == 1) title = "Tahap 1: Setup Dasar Kencan";
    else if (targetStage == 2) title = "Tahap 2: Preferensi Detail Spesifik";
    else if (targetStage == 3) {
        title = "Tahap 3: Rencana Kencan Terbaik (Siap Cetak!)";
        generateMasterPlan(); // Panggil fungsi perencanaan saat mencapai Stage 3
    }
    document.getElementById('stage-title').textContent = title;
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas setiap pindah stage
}

// =================== DATABASE PERENCANAAN ===================

const masterIdeas = [
    // Rencana Santai
    { mood: "Santai", budget: 1, duration: "Sedang", time: "Siang", theme: "None", idea: "Kencan Board Game & Ngopi Santai", activity: "Habiskan 4 jam di board game café, mencoba 2-3 game baru. Dilanjutkan ngopi di kafe terdekat.", items: ["Uang koin/receh untuk biaya game", "Topik ringan untuk dibahas di sela permainan"], itinerary: ["11:00 - 15:00: Main Board Game & Lunch ringan", "15:00 - 16:00: Pindah ke Kafe, Deep Talk Santai"] },
    // Rencana Petualangan
    { mood: "Petualangan", budget: 2, duration: "Panjang", time: "Pagi", theme: "Alam", idea: "Penjelajahan Kota Tua dan Hunting Foto", activity: "Mulai dengan sarapan khas, keliling area bersejarah, cari landmark tersembunyi, akhiri dengan sunset di spot terbaik.", items: ["Sepatu nyaman", "Kamera/HP", "Topi/Payung", "Peta/GPS"], itinerary: ["08:00 - 09:00: Sarapan tradisional", "09:00 - 15:00: Eksplorasi Kota Tua & Museum", "15:00 - 18:00: Istirahat & Cari Sunset Spot"] },
    // Rencana Romantis
    { mood: "Romantis", budget: 3, duration: "Malam", time: "Malam", theme: "Kuliner", idea: "Dinner Romantis & Jazz Akustik", activity: "Dinner di rooftop/restoran intim, dilanjutkan menikmati musik jazz/akustik di bar yang tenang.", items: ["Pakaian rapih/formal", "Reservasi sudah dipastikan", "Sebutkan 3 pujian tulus"], itinerary: ["19:00 - 21:00: Fine Dining", "21:00 - Selesai: Nikmati Live Music Romantis"] },
    // Rencana Kreatif
    { mood: "Kreatif", budget: 2, duration: "Sedang", time: "Siang", theme: "Seni", idea: "Workshop Membuat Keramik dan Gelato Date", activity: "Ikut kelas kerajinan (keramik/lukis/tenun). Fokus pada proses, bukan hasil. Setelah itu, nikmati gelato unik.", items: ["Baju yang tidak takut kotor", "Uang lebih untuk beli hasil karya", "Rasa humor"], itinerary: ["13:00 - 16:00: Workshop Seni", "16:00 - 17:00: Ngobrol dan Ngemil Gelato"] },
    // Rencana Premium Pagi
    { mood: "Petualangan", budget: 3, duration: "Panjang", time: "Pagi", theme: "Alam", idea: "Sunrise Bromo/Spot Alam dengan Sarapan Mewah", activity: "Perjalanan ke spot alam (di luar kota) untuk menikmati matahari terbit, dilanjutkan sarapan premium/hotel. (Ideal untuk weekend)", items: ["Jaket tebal", "Kamera DSLR (jika ada)", "Power bank"], itinerary: ["03:00 - 06:00: Perjalanan & Sunrise Watching", "07:00 - 09:00: Sarapan Mewah", "09:00 - 12:00: Perjalanan Pulang/Aktivitas Santai"] },
];


// =================== FUNGSI PERENCANAAN UTAMA ===================

function generateMasterPlan() {
    const data = {
        name: document.getElementById('dateName').value || "Kencan Tanpa Nama (Misterius!)",
        mood: document.getElementById('dateMood').value,
        budget: parseInt(document.getElementById('budgetLevel').value),
        duration: document.getElementById('dateDuration').value,
        theme: document.getElementById('dateTheme').value,
        time: document.getElementById('dateHour').value,
        foodAvoid: document.getElementById('foodAvoid').value.toLowerCase().split(',').map(s => s.trim()).filter(s => s),
        activityAvoid: document.getElementById('activityAvoid').value.toLowerCase().split(',').map(s => s.trim()).filter(s => s),
        petFriendly: document.getElementById('petFriendly').value,
        liveMusic: document.getElementById('liveMusic').value
    };

    const outputDiv = document.getElementById('dateOutput');
    let finalPlan = null;
    let score = 0;

    // 1. Filter Ide Kencan Terbaik
    let possiblePlans = masterIdeas.filter(plan => 
        plan.mood === data.mood &&
        plan.budget <= data.budget &&
        (data.theme === 'None' || plan.theme === data.theme)
    );
    
    // 2. Terapkan Filter Tambahan (Preferensi Tahap 2)
    // Kriteria Romantis vs Ramai: Jika Romantis, prioritaskan No Live Music
    if (data.mood === 'Romantis' && data.liveMusic === 'No') {
        // Hanya ambil rencana yang lebih tenang
        possiblePlans = possiblePlans.filter(plan => 
            plan.idea.toLowerCase().indexOf('jazz') === -1 && 
            plan.idea.toLowerCase().indexOf('bar') === -1
        );
    }

    // Ambil rencana terbaik/terdekat dari hasil filter
    if (possiblePlans.length > 0) {
        // Pilih rencana acak dari yang paling cocok
        const randomIndex = Math.floor(Math.random() * possiblePlans.length);
        finalPlan = possiblePlans[randomIndex];
        score = calculateQualityScore(data, finalPlan); // Hitung Skor Kualitas
    } else {
        // Fallback jika tidak ada yang cocok sempurna (Ambil dari mood & budget saja)
        const fallbackPlans = masterIdeas.filter(plan => plan.mood === data.mood && plan.budget <= data.budget);
        if (fallbackPlans.length > 0) {
            finalPlan = fallbackPlans[Math.floor(Math.random() * fallbackPlans.length)];
            score = calculateQualityScore(data, finalPlan) - 10; // Kurangi skor karena tidak ideal
        } else {
            outputDiv.innerHTML = `<div class="info-box" style="background-color: #f8d7da;">
                😭 **ERROR 404: DATE NOT FOUND.** Kombinasi Anda terlalu unik! Coba kurangi budget atau ubah mood.
            </div>`;
            return;
        }
    }


    // 3. Render Hasil Rencana Terbaik
    outputDiv.innerHTML = `
        <div class="result-box" style="background-color: #e6e6fa;">
            <h2>⭐ Rencana Utama: **${finalPlan.idea}**</h2>
            <p><strong>Dibuat untuk:</strong> ${data.name}</p>
            <p><strong>Skor Kualitas Perencanaan:</strong> <span style="color: var(--secondary-color); font-weight: 700;">${score}/100</span> (Sangat direkomendasikan!)</p>
        </div>

        <div class="result-box">
            <h4><i class="fas fa-route"></i> Itinerary Kencan Dasar</h4>
            ${finalPlan.itinerary.map(step => `<div class="itinerary-step">${step}</div>`).join('')}
        </div>

        <div class="result-box">
            <h4><i class="fas fa-list-check"></i> Checklist Wajib Bawa</h4>
            ${finalPlan.items.map(item => `<div class="checklist-item"><i class="far fa-circle"></i> ${item}</div>`).join('')}
            
            <p style="margin-top: 10px;">Tambahan dari Preferensi Anda (Hati-hati!):</p>
            ${renderPreferenceWarnings(data)}
        </div>

        <div class="result-box" style="border-left: 4px solid var(--accent-color);">
            <h4><i class="fas fa-trophy"></i> Goal Kencan:</h4>
            <p>${finalPlan.activity}</p>
        </div>
    `;
}

// Fungsi untuk menghitung kualitas perencanaan
function calculateQualityScore(data, plan) {
    let score = 70; // Base score
    
    // Cek kecocokan preferensi
    if (data.duration === plan.duration) score += 5;
    if (data.time === plan.time) score += 5;

    // Cek penghindaran
    const planString = (plan.idea + plan.activity).toLowerCase();
    
    // Jika rencana mengandung sesuatu yang dihindari, kurangi skor
    if (data.activityAvoid.some(avoid => planString.includes(avoid))) score -= 15;
    
    // Jika tidak ada penghindaran makanan (asumsi plan makanan aman), tambahkan sedikit
    if (data.foodAvoid.length === 0) score += 5;

    // Tambahkan elemen kejutan
    score += Math.floor(Math.random() * 10); 

    return Math.min(score, 100); // Batasi maksimal 100
}

// Fungsi untuk merender peringatan preferensi
function renderPreferenceWarnings(data) {
    let warnings = [];
    if (data.foodAvoid.length > 0) warnings.push(`<div style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> **JANGAN ADA:** ${data.foodAvoid.join(', ')} (Pastikan tempat makan aman!)</div>`);
    if (data.activityAvoid.length > 0) warnings.push(`<div style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> **HINDARI:** ${data.activityAvoid.join(', ')}</div>`);
    if (data.petFriendly === 'No') warnings.push(`<div><i class="fas fa-paw"></i> Pastikan lokasi **bukan** pet-friendly.</div>`);

    return warnings.length > 0 ? warnings.join('') : "<div><i class='fas fa-check-circle'></i> Tidak ada peringatan khusus yang diinput.</div>";
}

// Mulai dari Stage 1 saat pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => navigateStage('1'));
