document.getElementById('generatePlan').addEventListener('click', generateDatePlan);

// Database Ide Kencan (Lengkap dan Lucu)
const dateIdeas = {
    Santai: [
        { idea: "Maraton film dengan selimut dan 🍿 Popcorn buatan sendiri. Keuntungan: Tidak perlu ganti celana.", budget: 1 },
        { idea: "Mencoba resep kue/masakan viral TikTok yang kemungkinan besar akan gagal, lalu tertawa bersama. 😂", budget: 2 },
        { idea: "Pergi ke toko buku bekas, belikan pasanganmu buku yang kamu pikir cocok, lalu bahas isinya sambil ngopi.", budget: 1 },
        { idea: "Piknik di taman kota, bawa bekal dari rumah. Jangan lupa bawa anti nyamuk, biar nggak digigit cinta dan serangga!", budget: 1 }
    ],
    Petualangan: [
        { idea: "Cari rute bus/kereta yang belum pernah kalian coba, turun di sembarang tempat, dan eksplor daerah itu seharian. 🧭", budget: 2 },
        { idea: "Kunjungi museum yang paling 'membosankan' menurutmu. Tantangan: Membuatnya semenarik mungkin dengan narasi lucu.", budget: 2 },
        { idea: "Mini hiking ke bukit terdekat saat matahari terbit. Pastikan kalian berdua bukan orang yang 'ngantukan' akut. 😴", budget: 2 },
        { idea: "Ikut kelas panjat tebing indoor. Jika gagal, kalian bisa salahkan gravitasi, bukan pasanganmu.", budget: 3 }
    ],
    Romantis: [
        { idea: "Dinner di rooftop restoran dengan pemandangan kota. Trik: Latih tatapan mata 'aku-jatuh-cinta' selama 10 detik.", budget: 3 },
        { idea: "Nonton konser orkestra (atau jazz) dan pura-pura mengerti alunan musiknya. 🎷", budget: 3 },
        { idea: "Buat 'Jar of Memories' di mana kalian menuliskan momen terbaik dan membacanya satu per satu sambil minum cokelat panas.", budget: 1 },
        { idea: "Naik perahu dayung/sewa perahu kecil di danau. Ingat, jangan sampai perahu terbalik ya!", budget: 2 }
    ],
    Kreatif: [
        { idea: "Ikut kelas membuat keramik/lukisan. Hasil karyamu akan jadi bukti nyata tingkat artistik (atau kekonyolan) kalian. 🎨", budget: 3 },
        { idea: "Membuat puisi/lagu bersama tentang hubungan kalian. Bonus: Tampil di depan cermin.", budget: 1 },
        { idea: "Kunjungi pasar loak, beli barang bekas aneh, lalu tantang satu sama lain untuk 'merombaknya' menjadi sesuatu yang berguna.", budget: 2 },
        { idea: "Sesi foto bertema retro di studio sederhana, bawa properti-properti lucu.", budget: 2 }
    ],
    MakanEnak: [
        { idea: "Food hunting di area yang terkenal dengan jajanan kaki limanya. Aturan: Harus coba makanan yang paling 'aneh'. 🌶️", budget: 1 },
        { idea: "Mencoba fine dining di restoran bintang 5 (jika budget mencukupi). Peringatan: Jangan sampai salah pakai garpu.", budget: 3 },
        { idea: "Buffet All You Can Eat, strategi terbaik: datang dalam keadaan lapar dan pulang dalam keadaan 'tidak bisa bergerak'. 😆", budget: 2 },
        { idea: "Mengunjungi kebun anggur/pabrik cokelat lokal untuk tur dan mencicipi produknya.", budget: 3 }
    ]
};

// Ramalan Suasana Kencan Lucu
const moodRamalan = [
    "Kencan ini 100% akan menghasilkan **tawa terbahak-bahak**, tapi salah satu dari kalian mungkin akan tersandung.",
    "Bintang meramalkan **kecanggungan yang menggemaskan** di awal, tapi berakhir dengan pelukan hangat.",
    "Persiapkan diri untuk **debat filosofis** tentang topping pizza terbaik. Hasil: Kalian pesan dua pizza berbeda.",
    "Ramalan: **Komunikasi super lancar**, kalian akan menemukan kesamaan aneh yang tidak kalian duga!",
    "Hati-hati, kencan ini punya potensi **spontanitas tinggi**. Mungkin kalian akan tiba-tiba pergi ke kota lain! 🛵",
    "Peringatan: Kalian berdua akan sangat sibuk makan sehingga **lupa bicara** selama 15 menit. Fokus pada makanan, ya!",
    "Keajaiban menanti! Seseorang akan mengeluarkan **lelucon receh** yang justru membuat kencan ini sangat berkesan."
];

function generateDatePlan() {
    const dateName = document.getElementById('dateName').value || "Kencan Tak Bernama Aneh";
    const dateMood = document.getElementById('dateMood').value;
    const budgetLevel = parseInt(document.getElementById('budgetLevel').value);
    const outputDiv = document.getElementById('dateOutput');
    const resultSection = document.querySelector('.result-section');

    // 1. Filter Ide Kencan berdasarkan Mood dan Budget
    const possibleIdeas = dateIdeas[dateMood].filter(idea => idea.budget <= budgetLevel);

    if (possibleIdeas.length === 0) {
        outputDiv.innerHTML = `
            <div style="background-color: #f8d7da; border-left-color: #dc3545;">
                😢 **Opps!** Ide kencan untuk mood **${dateMood}** dengan budget ${budgetLevel} (Hemat) tidak ditemukan.
                Mungkin kamu harus **meningkatkan budget** atau coba mood yang lain, Sobat!
            </div>
        `;
        resultSection.classList.remove('hidden');
        return;
    }

    // 2. Pilih Ide Kencan Acak
    const randomIndex = Math.floor(Math.random() * possibleIdeas.length);
    const chosenIdea = possibleIdeas[randomIndex];

    // 3. Pilih Ramalan Lucu Acak
    const randomRamalan = moodRamalan[Math.floor(Math.random() * moodRamalan.length)];

    // 4. Hitung Perkiraan Biaya (Simulasi)
    let estimatedCost;
    if (chosenIdea.budget === 1) estimatedCost = "Rp 50.000 - Rp 100.000";
    else if (chosenIdea.budget === 2) estimatedCost = "Rp 150.000 - Rp 400.000";
    else estimatedCost = "Rp 500.000 - Rp 1.500.000+";

    // 5. Tampilkan Hasil
    outputDiv.innerHTML = `
        <div class="result-box">
            <h3>🎉 Rencana Kencan: **${dateName}**</h3>
        </div>
        
        <div class="result-box">
            <h4>💡 Ide Utama:</h4>
            <p>**${chosenIdea.idea}**</p>
        </div>
        
        <div class="result-box">
            <h4>💰 Perkiraan Budget:</h4>
            <p>Level: **${['Hemat', 'Sedang', 'Boros'][chosenIdea.budget - 1]}** | Range: **${estimatedCost}**</p>
        </div>
        
        <div class="result-box">
            <h4>🔮 Ramalan Suasana Kencan:</h4>
            <p class="mood-ramalan">${randomRamalan}</p>
        </div>
        
        <div class="result-box">
            <h4>❤️ Tips & Trik Tambahan:</h4>
            <p>Jangan lupa bawa **charger**! Tidak ada yang lebih merusak mood kencan daripada baterai HP habis. Dan yang paling penting: **Jadilah dirimu sendiri yang paling lucu!**</p>
        </div>
    `;

    resultSection.classList.remove('hidden');
    
    // Scroll ke bagian hasil
    resultSection.scrollIntoView({ behavior: 'smooth' });
}