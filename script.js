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

    let title = "";
    if (targetStage == 1) title = "Tahap 1: Setup Dasar Kencan";
    else if (targetStage == 2) title = "Tahap 2: Preferensi Detail Spesifik & Filter Asyik";
    else if (targetStage == 3) {
        title = "Tahap 3: Rencana Kencan Terbaik (Siap Cetak!)";
        generateMasterPlan(); 
    }
    document.getElementById('stage-title').textContent = title;
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

// =================== DATABASE PERENCANAAN YANG DIPERBANYAK ===================

const masterIdeas = [
    // Tambahan Glamour & Mewah
    { mood: "Glamour", budget: 3, duration: "Malam", time: "Malam", theme: "None", idea: "Cocktail Party Dress Up & Sky Bar Date", activity: "Kenakan pakaian terbaik, nikmati koktail mahal di rooftop bar dengan pemandangan kota. Wajib foto OOTD!", items: ["Pakaian rapih/dress code", "Uang tips", "Percakapan berkelas"], instagrammable: true, air: "Dingin" },
    
    // Tambahan Kreatif & Retro
    { mood: "Kreatif", budget: 2, duration: "Sedang", time: "Siang", theme: "Retro", idea: "Hunting Vinyl di Pasar Antik dan Dengerin Bareng", activity: "Kunjungi pasar loak/toko barang antik, cari piringan hitam/kaset lama. Pulang dan dengarkan sambil membuat daftar lagu kencan.", items: ["Uang tunai kecil", "Walkman/pemutar piringan hitam (jika punya)", "Rasa penasaran"], instagrammable: false, air: "Hangat" },
    
    // Tambahan Santai & Alam
    { mood: "Santai", budget: 1, duration: "Panjang", time: "Pagi", theme: "Alam", idea: "Piknik Santai di Kebun Raya / Taman Kota", activity: "Bawa bekal makanan dari rumah (low budget), nikmati alam, dan main tebak-tebakan hewan/tumbuhan.", items: ["Alas tikar", "Bekal makanan favorit", "Anti nyamuk"], instagrammable: true, air: "Hangat" },
    
    // Default Rencana Petualangan
    { mood: "Petualangan", budget: 2, duration: "Panjang", time: "Pagi", theme: "Alam", idea: "Mini Hiking ke Bukit Terdekat dan Brunch", activity: "Mendaki ringan saat udara masih segar, akhiri dengan brunch enak di kafe yang viewnya bagus.", items: ["Sepatu olahraga", "Air minum", "Handuk kecil"], instagrammable: true, air: "Dingin" },

    // Default Rencana Romantis
    { mood: "Romantis", budget: 3, duration: "Sedang", time: "Malam", theme: "Kuliner", idea: "Dinner Intim di Restoran Tersembunyi", activity: "Cari restoran yang tenang, punya pencahayaan redup, dan menu yang tidak biasa. Fokus pada percakapan mendalam.", items: ["Pakaian rapih", "Pastikan reservasi", "Topik pembicaraan non-kerja"], instagrammable: false, air: "Dingin" },
];

// =================== FUNGSI PERENCANAAN UTAMA ===================

function generateMasterPlan() {
    const data = {
        name: document.getElementById('dateName').value || "Kencan Misterius!",
        mood: document.getElementById('dateMood').value,
        budget: parseInt(document.getElementById('budgetLevel').value),
        duration: document.getElementById('dateDuration').value,
        theme: document.getElementById('dateTheme').value,
        time: document.getElementById('dateHour').value,
        foodAvoid: document.getElementById('foodAvoid').value.toLowerCase().split(',').map(s => s.trim()).filter(s => s),
        activityAvoid: document.getElementById('activityAvoid').value.toLowerCase().split(',').map(s => s.trim()).filter(s => s),
        petFriendly: document.getElementById('petFriendly').value,
        liveMusic: document.getElementById('liveMusic').value,
        photoOp: document.getElementById('photoOp').value,
        airQuality: document.getElementById('airQuality').value // NEW
    };

    const outputDiv = document.getElementById('dateOutput');
    let finalPlan = null;

    // 1. Filter Ide Kencan (Filter Ketat)
    let possiblePlans = masterIdeas.filter(plan => 
        plan.mood === data.mood &&
        plan.budget <= data.budget &&
        (data.theme === 'None' || plan.theme === data.theme) &&
        (data.photoOp === 'No' || plan.instagrammable === (data.photoOp === 'Yes')) &&
        (data.airQuality === plan.air)
    );
    
    // Fallback: Jika filter terlalu ketat, longgarkan filter tema dan waktu
    if (possiblePlans.length === 0) {
        possiblePlans = masterIdeas.filter(plan => 
            plan.mood === data.mood &&
            plan.budget <= data.budget
        );
    }
    
    // Final check dan pemilihan
    if (possiblePlans.length > 0) {
        const randomIndex = Math.floor(Math.random() * possiblePlans.length);
        finalPlan = possiblePlans[randomIndex];
    } else {
        // Error handling yang lebih baik
        outputDiv.innerHTML = `<div class="info-box" style="background-color: #f8d7da;">
            😭 **ERROR 404: DATE NOT FOUND.** Maaf, kombinasi preferensi Anda (terutama suhu/tema/foto) terlalu ketat. Coba **longgarkan filter** di Tahap 2!
        </div>`;
        return;
    }

    // 2. Hitung Skor Kualitas
    let score = calculateQualityScore(data, finalPlan); 

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
            <h4><i class="fas fa-list-check"></i> Checklist Wajib Bawa & Peringatan</h4>
            ${finalPlan.items.map(item => `<div class="checklist-item"><i class="far fa-circle"></i> ${item}</div>`).join('')}
            
            <p style="margin-top: 10px;">--- Filter Preferensi Anda ---</p>
            ${renderPreferenceWarnings(data)}
        </div>

        <div class="result-box" style="border-left: 4px solid var(--accent-color);">
            <h4><i class="fas fa-trophy"></i> Goal Kencan:</h4>
            <p>${finalPlan.activity}</p>
            
            <p style="margin-top: 15px;">**FITUR ASYIK TAMBAHAN:**</p>
            ${renderBonusFeature(data, finalPlan)}
        </div>
    `;
}

// Fungsi untuk menghitung kualitas perencanaan
function calculateQualityScore(data, plan) {
    let score = 70; 
    
    if (data.duration === plan.duration) score += 5;
    if (data.time === plan.time) score += 5;

    const planString = (plan.idea + plan.activity).toLowerCase();
    
    // Penalti Besar jika ada yang dihindari
    if (data.activityAvoid.some(avoid => planString.includes(avoid))) score -= 15;
    if (data.foodAvoid.length > 0 && plan.idea.toLowerCase().includes('kuliner')) score -= 5;
    
    // Bonus Fitur Asyik
    if (data.photoOp === 'Yes' && plan.instagrammable) score += 5; 
    if (data.airQuality === plan.air) score += 5; 

    score += Math.floor(Math.random() * 10); 

    return Math.min(score, 100); 
}

// Fungsi Fitur Asyik Tambahan: Memberi tugas atau "hukuman" lucu
function renderBonusFeature(data, plan) {
    const featureList = [];

    // Fitur 1: Tugas Berdasarkan Mood
    if (data.mood === 'Romantis') featureList.push(`<div style="color: purple;"><i class="fas fa-kiss-wink-heart"></i> **Tugas Intim:** Selama 5 menit, hanya bicara dengan **bisikan** tentang masa depan.</div>`);
    else if (data.mood === 'Kreatif') featureList.push(`<div style="color: darkgreen;"><i class="fas fa-feather-alt"></i> **Tugas Kreatif:** Ciptakan satu **pantun spontan** tentang hari ini.</div>`);
    else if (data.mood === 'Petualangan') featureList.push(`<div style="color: darkorange;"><i class="fas fa-running"></i> **Tugas Spontan:** Harus mencoba minimal satu **makanan/minuman yang belum pernah** kalian coba hari ini!</div>`);
    
    // Fitur 2: Hukuman/Reward Instagrammable
    if (data.photoOp === 'Yes' && plan.instagrammable) {
        featureList.push(`<div><i class="fas fa-star-of-life"></i> **Reward Foto:** Ambil foto yang **paling konyol**, dan jadikan wallpaper HP-nya selama 24 jam!</div>`);
    }

    return featureList.join('');
}

// Fungsi untuk merender peringatan preferensi
function renderPreferenceWarnings(data) {
    let warnings = [];
    if (data.foodAvoid.length > 0) warnings.push(`<div style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> **JANGAN ADA:** ${data.foodAvoid.join(', ')} (Wajib diperiksa di tempat makan!)</div>`);
    if (data.activityAvoid.length > 0) warnings.push(`<div style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> **HINDARI:** ${data.activityAvoid.join(', ')} (Pastikan Itinerary sesuai)</div>`);
    if (data.petFriendly === 'No') warnings.push(`<div><i class="fas fa-paw"></i> Pastikan lokasi **bukan** pet-friendly.</div>`);

    return warnings.length > 0 ? warnings.join('') : "<div><i class='fas fa-check-circle'></i> Tidak ada peringatan khusus yang diinput. Rencana aman terkendali.</div>";
}

// Mulai dari Stage 1 saat pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => navigateStage('1'));
