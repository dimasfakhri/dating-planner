document.getElementById('generatePlan').addEventListener('click', generateDatePlan);

// Database Ide Kencan yang Ditingkatkan: kini mempertimbangkan Mood, Budget, Durasi, dan Tema
const dateIdeas = [
    // Santai & Hemat
    { mood: "Santai", budget: 1, duration: "Pendek", theme: "None", idea: "Ngopi santai di kafe dengan kursi malas. Tantangan: Harus membahas 3 hal absurd yang kalian lihat di medsos.", item: "Buku/Jurnal kecil untuk menulis hal-hal absurd." },
    { mood: "Santai", budget: 1, duration: "Sedang", theme: "Indoor", idea: "Kencan di rumah, membuat dessert dari 2 bahan saja (misalnya pisang dan cokelat). Tantangan: Membuatnya seestetik mungkin untuk foto.", item: "Dua bahan rahasia dan kamera HP." },
    // Petualangan & Sedang
    { mood: "Petualangan", budget: 2, duration: "Panjang", theme: "Outdoor", idea: "Keliling kota mencari 3 mural/seni jalanan paling tersembunyi. Tantangan: Berpose aneh di depan setiap mural.", item: "Sepatu nyaman dan air minum yang banyak." },
    { mood: "Petualangan", budget: 2, duration: "Pendek", theme: "Retro", idea: "Kunjungi rental game PS2/warnet jadul. Tantangan: Main game lama yang belum pernah kalian coba dan siapa kalah bayar. 😂", item: "Uang koin/receh dan rasa malu yang minimal." },
    // Romantis & Mewah
    { mood: "Romantis", budget: 3, duration: "Panjang", theme: "KulinerInternasional", idea: "Dinner di restoran fine dining Italia, pura-pura jadi kritikus makanan yang sedang menyamar. Tantangan: Harus menggunakan aksen asing saat memesan.", item: "Pakaian formal dan kosakata kuliner yang kompleks." },
    { mood: "Romantis", budget: 3, duration: "Sedang", theme: "Indoor", idea: "Pesan layanan pijat couple atau spa premium. Tantangan: Harus diam selama 10 menit tanpa bicara sama sekali (sulit!).", item: "Uang tips dan ketenangan jiwa." },
    // Kreatif & Sedang
    { mood: "Kreatif", budget: 2, duration: "Pendek", theme: "Indoor", idea: "Membeli kit DIY membuat sabun/lilin aromaterapi. Tantangan: Berikan nama yang paling romantis (atau paling konyol) untuk kreasimu.", item: "Apron, jika kamu ceroboh." },
    { mood: "Kreatif", budget: 2, duration: "Panjang", theme: "Retro", idea: "Pergi ke pasar loak, beli barang bekas misterius (maksimal Rp 50k). Tantangan: Ciptakan cerita latar yang paling lucu untuk barang itu.", item: "Uang tunai dan imajinasi liar." },
    // Tema Khusus - Kuliner Internasional
    { mood: "Santai", budget: 2, duration: "Sedang", theme: "KulinerInternasional", idea: "Kencan 'Keliling Dunia': Kunjungi 3 kedai makanan dari 3 negara berbeda dalam satu sore (misalnya taco, dimsum, kebab).", item: "Tisu basah dan perut yang lapang." },
    // Tema Khusus - Outdoor
    { mood: "Petualangan", budget: 3, duration: "Panjang", theme: "Outdoor", idea: "Glamping mewah di area pinggiran kota. Tantangan: Coba menyalakan api unggun tanpa korek (jika gagal, pakai korek saja).", item: "Senter, jaket tebal, dan marshmallow." }
];

// Ramalan Suasana Kencan Lucu
const moodRamalan = [
    "Kencan ini 90% akan berjalan lancar, 10% sisanya akan diisi dengan perdebatan tentang siapa yang lebih tua. 🧐",
    "Bintang meramalkan: **Kejutan kecil** di tengah kencan. Mungkin kamu akan menemukan dompet yang jatuh, atau dia akan menemukan cinta sejatinya (yaitu kamu, tentunya!).",
    "Sangat dinamis! Kalian akan **mengubah rencana 3 kali** dalam 1 jam pertama, tapi berakhir di tempat yang jauh lebih baik.",
    "Persiapkan mental: akan ada momen canggung lucu ketika kalian **bertemu mantan** (milik salah satu dari kalian). Bersikaplah heroik!",
    "Ramalan Kesiapan: **Sangat Romantis**, tapi ada kemungkinan besar salah satu dari kalian akan melupakan kunci rumah. 🔑",
    "Kencan ini akan menjadi sejarah! Kalian akan membuat **inside joke** baru yang akan kalian gunakan sampai tua. 😂",
    "Peringatan: Kalian mungkin akan **terlalu fokus** mendokumentasikan kencan ini di medsos sampai lupa menikmati momen. Taruh ponselmu sebentar!"
];

function generateDatePlan() {
    const dateMood = document.getElementById('dateMood').value;
    const budgetLevel = parseInt(document.getElementById('budgetLevel').value);
    const dateDuration = document.getElementById('dateDuration').value;
    const dateTheme = document.getElementById('dateTheme').value;
    const outputDiv = document.getElementById('dateOutput');
    const resultSection = document.querySelector('.result-section');

    // 1. Filter Ide Kencan (Lebih Kompleks)
    let possibleIdeas = dateIdeas.filter(idea => 
        idea.mood === dateMood &&
        idea.budget <= budgetLevel &&
        idea.duration === dateDuration
    );

    // Filter berdasarkan Tema jika tema dipilih (bukan 'None')
    if (dateTheme !== 'None') {
        const themeIdeas = dateIdeas.filter(idea => idea.theme === dateTheme);
        // Gabungkan ide yang sesuai mood/budget/durasi DENGAN ide bertema
        possibleIdeas = [...possibleIdeas, ...themeIdeas].filter((v, i, a) => 
            a.findIndex(t => (t.idea === v.idea)) === i // Hapus duplikat
        );
    }
    
    // Fallback: Jika tidak ada ide yang cocok, cari ide yang paling mendekati mood & budget.
    if (possibleIdeas.length === 0) {
        possibleIdeas = dateIdeas.filter(idea => idea.mood === dateMood && idea.budget <= budgetLevel);
        if (possibleIdeas.length === 0) {
            outputDiv.innerHTML = `<div class="result-box" style="background-color: #f8d7da; border-left-color: #dc3545;">
                😢 **Oops!** Kombinasi mood/budget/durasi/tema terlalu unik. Coba **longgarkan budget** atau pilih **mood yang berbeda**!
            </div>`;
            resultSection.classList.remove('hidden');
            resultSection.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }


    // 2. Pilih Ide Kencan Acak
    const randomIndex = Math.floor(Math.random() * possibleIdeas.length);
    const chosenIdea = possibleIdeas[randomIndex];

    // 3. Pilih Ramalan Lucu Acak & Hitung Score Kesiapan
    const randomRamalan = moodRamalan[Math.floor(Math.random() * moodRamalan.length)];
    const readinessScore = calculateReadinessScore(budgetLevel, dateDuration, dateTheme);
    
    // 4. Hitung Perkiraan Biaya
    let estimatedCost;
    if (chosenIdea.budget === 1) estimatedCost = "Rp 50.000 - Rp 150.000";
    else if (chosenIdea.budget === 2) estimatedCost = "Rp 150.000 - Rp 500.000";
    else estimatedCost = "Rp 500.000 - Rp 2.000.000+";

    // 5. Tampilkan Hasil
    outputDiv.innerHTML = `
        <div class="result-box">
            <h4>💡 Ide Kencan Utama:</h4>
            <p><i class="fas fa-calendar-check"></i> **${chosenIdea.idea}**</p>
        </div>
        
        <div class="result-box">
            <h4>🎯 Tantangan Kencan Spesial:</h4>
            <p class="date-challenge"><i class="fas fa-hand-rock"></i> ${chosenIdea.item} (Tips: Selalu lakukan tantangan!)</p>
        </div>
        
        <div class="result-box">
            <h4>💰 Budget & Durasi:</h4>
            <p>Perkiraan Biaya: **${estimatedCost}** | Ideal Durasi: **${dateDuration}**</p>
        </div>
        
        <div class="result-box">
            <h4>🔮 Ramalan Suasana Kencan:</h4>
            <p class="mood-ramalan"><i class="fas fa-bahai"></i> ${randomRamalan}</p>
        </div>
        
        <div class="readiness-score">
            <i class="fas fa-star"></i> Tingkat Kesiapan (Fun Score): **${readinessScore}/100** <i class="fas fa-star"></i>
        </div>
    `;

    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Fungsi untuk membuat skor kesiapan yang dinamis dan lucu
function calculateReadinessScore(budget, duration, theme) {
    let score = 50; // Base score
    
    // Tambahkan poin berdasarkan pilihan
    if (budget === 3) score += 15; // Mewah = Happy
    if (duration === "Panjang") score += 10; // Durasi Panjang = Lebih banyak kesempatan seru
    if (theme !== "None") score += 10; // Ada tema = Usaha lebih keras

    // Elemen kejutan/random
    score += Math.floor(Math.random() * 20); // Tambahkan random 0-19 poin

    // Batasi skor 
    if (score > 100) score = 100;
    
    return score;
}
