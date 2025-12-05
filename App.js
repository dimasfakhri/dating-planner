import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, updateDoc, deleteDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

// =================================================================
// 0. FIREBASE SETUP & UTILS
// =================================================================

// Pastikan variabel global tersedia
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-dating-planner';
// PASTIKAN CONFIG INI VALID. Lakukan logging untuk debugging.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Utilitas untuk mendapatkan path rencana kencan (publik, menggunakan userId sebagai doc ID)
const getPlanDocRef = (db, userId) => {
    return doc(db, `artifacts/${appId}/public/data/date_plans`, userId);
};

// =================================================================
// 1. KOMPONEN CORE (AuthModal, Navbar, Footer)
// =================================================================

const AuthModal = ({ auth, user, setUser, onClose }) => {
    if (!auth || !user) return null;

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            onClose();
            console.log("User signed out successfully.");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
                <h3 className="text-3xl font-bold text-pink-400 mb-4 flex items-center justify-between">
                    <span>Status Pengguna</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">✖</button>
                </h3>
                <div className="space-y-3 text-left">
                    <p className="text-lg text-green-400 font-semibold">
                        ✅ Autentikasi Berhasil!
                    </p>
                    <p className="text-gray-300 break-words">
                        <strong className="text-pink-300">ID Pengguna (untuk kolaborasi):</strong> <br />
                        <span className="bg-gray-700 p-2 rounded block mt-1 text-sm select-all">{user.uid}</span>
                    </p>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSignOut}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full shadow-lg transition duration-300"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

// NAVBAR: Fokus pada navigasi yang terstruktur
const Navbar = ({ onNavChange, user, setShowAuthModal, currentSection }) => {
    // Daftar item navigasi lengkap
    const navItems = [
        { name: "Home", section: "home" },
        { name: "Moodboard", section: "mood" },
        { name: "Planner", section: "planner" },
        { name: "Budget", section: "budget" },
        { name: "Gallery", section: "gallery" },
        { name: "Ideas", section: "ideas" },
    ];
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavClick = (section) => {
        // Fungsi ini mengarahkan ke rute yang ditentukan
        onNavChange(section); 
        setIsMenuOpen(false);
    };

    return (
        <header className="bg-gray-800 shadow-xl sticky top-0 z-40 border-b border-pink-500/30">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-2xl font-extrabold text-pink-400 cursor-pointer transition transform hover:scale-[1.02]" onClick={() => handleNavClick('home')}>
                    Dating Planner
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex space-x-6 items-center">
                    {navItems.map((item) => (
                        <button
                            key={item.section}
                            onClick={() => handleNavClick(item.section)}
                            className={`transition duration-150 font-medium tracking-wide border-b-2
                                ${currentSection === item.section 
                                    ? 'text-pink-400 border-pink-400' 
                                    : 'text-gray-300 border-transparent hover:text-pink-400 hover:border-pink-400/50'
                                }
                            `}
                        >
                            {item.name}
                        </button>
                    ))}
                    {user ? (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm font-semibold transition"
                        >
                            Pengguna {user.uid.substring(0, 4)}...
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded-full text-sm font-semibold transition shadow-lg"
                        >
                            Login
                        </button>
                    )}
                </nav>

                {/* Mobile Menu Button dan Dropdown */}
                <button className="md:hidden text-gray-300 text-2xl p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-gray-700 p-4 space-y-2 border-t border-gray-600">
                    {navItems.map((item) => (
                        <button
                            key={item.section}
                            onClick={() => handleNavClick(item.section)}
                            className={`block w-full text-left py-2 border-b border-gray-600 last:border-b-0
                                ${currentSection === item.section ? 'text-pink-400 font-bold' : 'text-gray-200 hover:text-pink-400'}
                            `}
                        >
                            {item.name}
                        </button>
                    ))}
                    <button
                        onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }}
                        className={`w-full text-left py-2 font-semibold ${user ? 'text-green-400' : 'text-pink-400'}`}
                    >
                        {user ? 'Lihat Profil' : 'Login / Daftar'}
                    </button>
                </div>
            )}
        </header>
    );
};

const Footer = () => (
    <footer className="bg-gray-800 text-center py-4 text-gray-500 text-sm border-t border-gray-700">
        © 2025 Dating Planner. Dibuat dengan cinta.
    </footer>
);

// =================================================================
// 2. KOMPONEN UTAMA APLIKASI
// =================================================================

// Data Aktivitas Spesifik berdasarkan Mood
const allActivities = {
    Romantic: [
        { title: "Makan Malam Klasik", icon: "🍽️", defaultCost: 350000, desc: "Suasana intim dan elegan di restoran pilihan." },
        { title: "Piknik Malam Bintang", icon: "🌌", defaultCost: 150000, desc: "Menikmati kudapan di bawah langit terbuka." },
        { title: "Membuat Pijat Pasangan", icon: "💆", defaultCost: 50000, desc: "Sesi relaksasi dan keintiman di rumah." },
    ],
    Adventurous: [
        { title: "Hiking Ringan", icon: "⛰️", defaultCost: 100000, desc: "Menjelajahi alam dan pemandangan di sekitar kota." },
        { title: "Bermain Kayak / Kano", icon: "🛶", defaultCost: 250000, desc: "Aktivitas air yang seru di danau atau sungai." },
        { title: "Mencoba Panjat Tebing Mini", icon: "🧗", defaultCost: 300000, desc: "Tantangan fisik bersama di dinding buatan." },
    ],
    Creative: [
        { title: "Kelas Membuat Keramik", icon: "🏺", defaultCost: 400000, desc: "Membuat seni dari tanah liat dan membawanya pulang." },
        { title: "Melukis Bersama", icon: "🎨", defaultCost: 150000, desc: "Ekspresi diri dengan kanvas dan cat di studio." },
        { title: "DIY Furniture Mini", icon: "🔨", defaultCost: 200000, desc: "Proyek kerajinan tangan seru, membuat bingkai foto atau rak." },
    ],
    Relaxing: [
        { title: "Marathon Film Dokumenter", icon: "🍿", defaultCost: 50000, desc: "Santai di sofa dengan snack dan film edukatif." },
        { title: "Membaca Buku Bersama di Kafe", icon: "☕", defaultCost: 120000, desc: "Suasana tenang, kopi hangat, dan obrolan ringan." },
        { title: "Mengunjungi Kebun Raya", icon: "🌿", defaultCost: 100000, desc: "Jalan-jalan santai, menikmati udara segar dan tanaman hijau." },
    ],
};

const Moodboard = ({ plan, setSection, updatePlan }) => {
    // Moodboard hanya membutuhkan plan saat update, tidak perlu guard clause di sini.
    const [selectedMood, setSelectedMood] = useState(plan.chosenMood || null); 
    
    const moods = [
        { name: "Romantic", icon: "🌹", color: "text-red-400", desc: "Suasana intim, lilin, musik lembut." },
        { name: "Adventurous", icon: "⛰️", color: "text-blue-400", desc: "Aktivitas luar ruangan, eksplorasi." },
        { name: "Creative", icon: "🎨", color: "text-yellow-400", desc: "Membuat sesuatu, seni, kerajinan." },
        { name: "Relaxing", icon: "☕", color: "text-green-400", desc: "Kenyamanan, santai, spa atau kafe." },
    ];
    
    const handleSelectMood = (moodName) => {
        setSelectedMood(selectedMood === moodName ? null : moodName);
    };

    const handleSelectActivity = (activity, moodName) => {
        if (!updatePlan) return; // Guard: Pastikan updatePlan tersedia

        const newActivity = {
            name: activity.title,
            cost: activity.defaultCost,
            type: "Pre-selected",
            actualCost: 0,
        };

        const updates = { 
            chosenMood: moodName,
            activities: arrayUnion(newActivity)
        };
        
        // Pindah ke Planner setelah memilih aktivitas
        updatePlan(updates, true);
        setSection("planner"); 
    };
    
    const activitiesToShow = selectedMood ? allActivities[selectedMood] : [];

    return (
        <div className="w-full max-w-5xl p-6 bg-gray-800 rounded-2xl shadow-2xl space-y-8">
            <h2 className="text-3xl font-extrabold text-pink-400 mb-2 text-center">
                Papan Mood Kencan <span className="text-xl">🧭</span>
            </h2>
            <p className="text-gray-400 text-center mb-6">
                Pilih mood utama, lalu pilih aktivitas spesifik untuk memulai rencana kencan Anda.
            </p>

            {/* Pilihan Mood Umum */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {moods.map((mood) => (
                    <button
                        key={mood.name}
                        onClick={() => handleSelectMood(mood.name)}
                        className={`p-6 rounded-xl border-4 transition-all duration-300 transform hover:scale-[1.05] bg-gray-700 shadow-lg group
                            ${selectedMood === mood.name ? 'border-pink-500 bg-gray-600' : 'border-transparent hover:border-pink-500/50'}
                        `}
                    >
                        <div className={`text-5xl mb-3 ${mood.color}`}>{mood.icon}</div>
                        <h3 className="text-xl font-bold text-white group-hover:text-pink-400">{mood.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{mood.desc}</p>
                    </button>
                ))}
            </div>

            {/* Pilihan Aktivitas Spesifik (Conditional) */}
            {selectedMood && (
                <div className="mt-10 pt-6 border-t border-gray-700 animate-fadeIn">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="text-pink-400 mr-2 text-3xl">🎯</span> Kencan Spesifik untuk "{selectedMood}"
                    </h3>
                    <p className="text-gray-400 mb-4">Pilih salah satu aktivitas ini untuk langsung membuat rencana:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {activitiesToShow.map((activity, index) => (
                            <button
                                key={index}
                                // TIDAK PERLU CEK plan DI SINI karena komponen ini hanya dirender jika plan ada
                                onClick={() => handleSelectActivity(activity, selectedMood)}
                                className={`p-6 rounded-xl border-4 border-pink-600/50 hover:border-pink-500 transition-all duration-300 transform hover:scale-[1.03] bg-gray-700 shadow-xl group text-left`}
                            >
                                <div className={`text-5xl mb-3 text-pink-300`}>{activity.icon}</div>
                                <h4 className="text-xl font-bold text-white group-hover:text-pink-400">{activity.title}</h4>
                                <p className="text-sm text-gray-400 mt-2">{activity.desc}</p>
                                <p className="text-sm text-green-400 font-semibold mt-1">Est. Biaya: {activity.defaultCost.toLocaleString('id-ID')}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- BudgetPlanner Component ---
const BudgetPlanner = ({ plan, updatePlan, setSection }) => {
    // Hapus guard clause di sini, karena sudah ditangani di renderSection
    
    const totalEstimatedCost = plan.activities.reduce((sum, activity) => sum + activity.cost, 0);
    const totalActualCost = plan.activities.reduce((sum, activity) => sum + (activity.actualCost || 0), 0);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const handleBudgetChange = (e) => {
        const newBudget = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
        updatePlan({ budgetLimit: newBudget });
    };

    const handleActualCostChange = (index, cost) => {
        const newActivities = [...plan.activities];
        newActivities[index].actualCost = parseInt(cost.replace(/[^0-9]/g, '')) || 0;
        updatePlan({ activities: newActivities });
    };

    const budgetStatus = () => {
        const remaining = plan.budgetLimit - totalEstimatedCost;
        if (remaining < 0) return { text: "Over Budget!", color: "text-red-500", icon: "⚠️" };
        if (remaining < plan.budgetLimit * 0.2) return { text: "Budget Ketat", color: "text-yellow-500", icon: "🤏" };
        return { text: "Di Bawah Anggaran", color: "text-green-500", icon: "💰" };
    };

    return (
        <div className="w-full max-w-4xl p-6 bg-gray-800 rounded-2xl shadow-2xl space-y-8">
            <h2 className="text-3xl font-extrabold text-pink-400 text-center flex items-center justify-center">
                <span className="mr-2 text-4xl">💸</span> Perencana Anggaran Kencan
            </h2>

            <div className="grid md:grid-cols-3 gap-4 bg-gray-700 p-4 rounded-xl">
                {/* ... (Ringkasan Anggaran) ... */}
                <div className="text-center p-3 bg-gray-600 rounded-lg">
                    <p className="text-sm text-gray-400">Target Anggaran</p>
                    <p className="text-xl font-bold text-pink-400">
                        {formatCurrency(plan.budgetLimit)}
                    </p>
                </div>
                <div className="text-center p-3 bg-gray-600 rounded-lg">
                    <p className="text-sm text-gray-400">Estimasi Total Biaya</p>
                    <p className="text-xl font-bold text-white">
                        {formatCurrency(totalEstimatedCost)}
                    </p>
                </div>
                <div className="text-center p-3 bg-gray-600 rounded-lg">
                    <p className="text-sm text-gray-400">Status</p>
                    <p className={`text-xl font-bold ${budgetStatus().color}`}>
                        {budgetStatus().icon} {budgetStatus().text}
                    </p>
                </div>
            </div>

            {/* Input Target Budget */}
            <div className="flex flex-col items-start space-y-2">
                <label htmlFor="budget" className="text-gray-300 font-semibold">Ubah Target Anggaran (IDR):</label>
                <input
                    id="budget"
                    type="text"
                    value={plan.budgetLimit.toLocaleString('id-ID')}
                    onChange={handleBudgetChange}
                    placeholder="Contoh: 500.000"
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition"
                />
            </div>

            {/* Detail Biaya Aktivitas */}
            <h3 className="text-2xl font-semibold text-pink-400 mt-8 border-b border-gray-700 pb-2">Detail Biaya Aktivitas ({formatCurrency(totalActualCost)} Aktual)</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {plan.activities.length === 0 ? (
                    <p className="text-gray-400 italic">Belum ada aktivitas yang ditambahkan ke perencana.</p>
                ) : (
                    plan.activities.map((activity, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-center bg-gray-700 p-3 rounded-lg shadow-md">
                            <span className="font-medium text-white w-full sm:w-1/3 text-left mb-2 sm:mb-0">
                                {activity.name}
                            </span>
                            <div className="flex-1 flex gap-2 w-full">
                                <span className="text-gray-400 w-1/2">Est: {formatCurrency(activity.cost)}</span>
                                <input
                                    type="text"
                                    value={(activity.actualCost || 0).toLocaleString('id-ID')}
                                    onChange={(e) => handleActualCostChange(index, e.target.value)}
                                    placeholder="Biaya Aktual"
                                    className="p-1 bg-gray-600 text-white rounded w-1/2 text-sm text-right"
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Tombol Lanjut ke Planner */}
            <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                <button
                    onClick={() => setSection("planner")} // Rute Lanjut/Edit: kembali ke planner
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300"
                >
                    Kembali ke Planner ✏️
                </button>
            </div>
        </div>
    );
};

// --- ActivitySelector (Planner) ---
const ActivitySelector = ({ plan, updatePlan, setSection }) => {
    // Hapus guard clause di sini, karena sudah ditangani di renderSection

    const [activityName, setActivityName] = useState("");
    const [activityCost, setActivityCost] = useState("");

    const moodSpecificIdeas = {
        Romantic: ["Dinner romantis di atap", "Malam bioskop & pelukan", "Pijat pasangan"],
        Adventurous: ["Hiking ringan", "Bermain kayak", "Mencoba panjat tebing mini"],
        Creative: ["Melukis bersama", "Kelas membuat keramik", "Memasak hidangan baru"],
        Relaxing: ["Piknik di taman", "Pergi ke kafe baru", "Membaca buku bersama"],
    };

    const handleAddActivity = (e) => {
        e.preventDefault();
        if (activityName.trim() === "") return;

        const newActivity = {
            name: activityName.trim(),
            cost: parseInt(activityCost.replace(/[^0-9]/g, '')) || 0,
            type: "Custom",
            actualCost: 0,
        };

        updatePlan({ activities: arrayUnion(newActivity) }, true);

        setActivityName("");
        setActivityCost("");
    };

    const handleRemoveActivity = (activity) => {
        updatePlan({ activities: arrayRemove(activity) }, true);
    };

    const handleIdeaSelect = (name) => {
        setActivityName(name);
        setActivityCost("0");
    }

    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);


    return (
        <div className="w-full max-w-4xl p-6 bg-gray-800 rounded-2xl shadow-2xl">
            <h2 className="text-3xl font-extrabold text-white mb-2 text-center">
                ✨ Perencana Kencan Anda ✨
            </h2>
            <p className="text-xl text-pink-400 font-semibold mb-6 text-center">
                Mood: <span className="p-1 rounded-lg bg-pink-500/20">{plan.chosenMood || 'Belum Dipilih'}</span>
            </p>

            {/* Section 1: Quick Ideas */}
            <div className="mb-8 p-4 bg-gray-700 rounded-xl shadow-inner">
                <h3 className="text-xl font-semibold text-gray-200 mb-3">
                    Ide Cepat untuk Mood "{plan.chosenMood}"
                </h3>
                <div className="flex flex-wrap gap-2">
                    {(moodSpecificIdeas[plan.chosenMood] || []).map((idea, index) => (
                        <button
                            key={index}
                            onClick={() => handleIdeaSelect(idea)}
                            className="text-xs bg-pink-600 hover:bg-pink-700 text-white py-1.5 px-3 rounded-full transition transform hover:scale-105"
                        >
                            + {idea}
                        </button>
                    ))}
                    <button
                        onClick={() => handleIdeaSelect("Kencan yang Benar-benar Unik")}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-full transition transform hover:scale-105"
                    >
                        + Ide Baru!
                    </button>
                </div>
            </div>

            {/* Section 2: Input Aktivitas Baru */}
            <form onSubmit={handleAddActivity} className="space-y-4 border-b border-gray-700 pb-6 mb-6">
                <h3 className="text-xl font-semibold text-pink-400">Tambahkan Aktivitas</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={activityName}
                        onChange={(e) => setActivityName(e.target.value)}
                        placeholder="Nama Aktivitas (Contoh: Beli tiket konser)"
                        className="flex-1 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-pink-500 focus:border-pink-500 transition"
                    />
                    <input
                        type="text"
                        value={activityCost}
                        onChange={(e) => setActivityCost(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Estimasi Biaya (IDR)"
                        className="w-full sm:w-1/4 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-pink-500 focus:border-pink-500 transition"
                    />
                    <button
                        type="submit"
                        className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform hover:scale-[1.02] transition duration-300"
                    >
                        Tambah
                    </button>
                </div>
            </form>

            {/* Section 3: Daftar Aktivitas */}
            <h3 className="text-2xl font-semibold text-white mb-4">Daftar Kencan Anda ({plan.activities.length} Aktivitas)</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {plan.activities.length === 0 ? (
                    <p className="text-gray-400 italic">Mulai tambahkan langkah-langkah kencan Anda!</p>
                ) : (
                    plan.activities.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-xl shadow-md transition duration-200 hover:bg-gray-600">
                            <div className="flex-1 min-w-0">
                                <span className="text-pink-300 text-sm mr-2">{index + 1}.</span>
                                <span className="font-medium text-white break-words">{activity.name}</span>
                                <span className="block text-xs text-gray-400 mt-1 sm:inline sm:ml-4">
                                    <span className="font-bold">Est:</span> {formatCurrency(activity.cost)}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRemoveActivity(activity)}
                                className="text-red-400 hover:text-red-500 ml-4 p-1 rounded-full bg-gray-800/50 transition"
                                aria-label="Hapus aktivitas"
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            {/* Tombol Lanjut ke Budget */}
            <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                <button
                    onClick={() => setSection("budget")} // Rute Lanjut
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300"
                >
                    Lanjut ke Anggaran ➡️
                </button>
            </div>
        </div>
    );
};

// --- Gallery Component (Mock) ---
const Gallery = ({ user, setSection }) => {
    // Hapus Guard Clause di sini
    const mockImages = [
        { id: 1, title: "Kencan Picnic", color: "bg-green-500" },
        { id: 2, title: "Foto Bersama", color: "bg-purple-500" },
        { id: 3, title: "Momen Spesial", color: "bg-red-500" },
        { id: 4, title: "Liburan", color: "bg-blue-500" },
    ];
    
    return (
        <div className="w-full max-w-5xl p-6 bg-gray-800 rounded-2xl shadow-2xl space-y-6">
            <h2 className="text-3xl font-extrabold text-pink-400 text-center flex items-center justify-center">
                <span className="mr-2 text-4xl">📸</span> Galeri Kencan
            </h2>
            <p className="text-center text-gray-400">
                Tempat untuk menyimpan memori kencan Anda. (Saat ini hanya tampilan mock)
            </p>

            {/* Tombol Upload hanya jika user terautentikasi */}
            {user && (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                    <button className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition">
                        Upload Foto Baru
                    </button>
                </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mockImages.map((item) => (
                    <div key={item.id} className={`h-40 rounded-xl flex flex-col items-center justify-center text-white font-semibold text-lg text-center ${item.color} shadow-lg transition duration-300 hover:scale-[1.03] cursor-pointer`}>
                        <span className="text-3xl mb-2">💖</span>
                        {item.title}
                        <span className="text-xs font-normal mt-1 opacity-70">Klik untuk melihat</span>
                    </div>
                ))}
            </div>

            {!user && (
                 <div className="mt-8 text-center p-6 bg-gray-700 rounded-xl">
                    <p className="text-red-400 font-semibold mb-3">Login untuk menyimpan Galeri Kencan Anda!</p>
                </div>
            )}

            <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                <button
                    onClick={() => setSection("home")} // Rute Selesai: kembali ke home
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300"
                >
                    Selesai & Beranda 🏠
                </button>
            </div>
        </div>
    );
};


// --- DateIdeas (Tambahan untuk navigasi) ---
const DateIdeas = ({ setSection }) => {
    const categories = [
        { name: "Kencan Murah", icon: "🪙", desc: "Ide kencan yang ramah di kantong." },
        { name: "Kencan Mewah", icon: "💎", desc: "Pengalaman premium dan eksklusif." },
    ];
    
    return (
        <div className="w-full max-w-4xl p-6 bg-gray-800 rounded-2xl shadow-2xl space-y-6">
            <h2 className="text-3xl font-extrabold text-pink-400 text-center flex items-center justify-center">
                <span className="mr-2 text-4xl">💡</span> Inspirasi Ide Kencan
            </h2>
            <p className="text-center text-gray-400">
                Jelajahi kategori kencan untuk mendapatkan inspirasi baru dan seru.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
                {categories.map((cat, index) => (
                    <div 
                        key={index} 
                        className="p-5 bg-gray-700 rounded-xl shadow-lg hover:bg-gray-600 transition duration-300 cursor-pointer flex items-center space-x-4"
                        onClick={() => setSection('mood')} // Rute Lanjut: Arahkan ke Moodboard untuk memilih
                    >
                        <span className="text-4xl">{cat.icon}</span>
                        <div>
                            <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                            <p className="text-sm text-gray-400">{cat.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => setSection('mood')}
                className="w-full mt-6 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
            >
                Lanjut ke Moodboard ➡️
            </button>
        </div>
    );
};

// --- KOMPONEN BARU: Media Inspiration Slider ---
const MediaInspirationSlider = () => {
    const media = [
        { type: 'photo', title: 'Dinner Romantis di Atap', tag: 'romantic-dinner-rooftop', icon: '📸' },
        { type: 'video', title: 'Tutorial DIY Kencan di Rumah', tag: 'diy-date-at-home-tutorial', icon: '▶️' },
        { type: 'photo', title: 'Piknik Seru di Taman Kota', tag: 'city-park-picnic', icon: '📸' },
        { type: 'video', title: 'Vlog Kencan Eksplorasi Kota', tag: 'city-exploration-date-vlog', icon: '▶️' },
        { type: 'photo', title: 'Kelas Memasak Pasangan', tag: 'couple-cooking-class', icon: '📸' },
        { type: 'video', title: 'Ide Kencan Murah di Akhir Pekan', tag: 'cheap-weekend-date-ideas', icon: '▶️' },
    ];
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % media.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(nextSlide, 5000); 
        return () => clearInterval(timer);
    }, []);

    const currentMedia = media[currentIndex];
    const itemWidth = 280; // Lebar tetap untuk item slider
    const containerWidth = 900; // Lebar kontainer tetap (max-w-4xl)
    const offset = currentIndex * itemWidth;

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <h3 className="text-3xl font-bold text-pink-400 mb-6 text-center">
                Visual Inspirasi Foto & Video <span className="text-xl">🖼️</span>
            </h3>
            <div className="relative overflow-hidden rounded-xl shadow-2xl border border-pink-500/30">
                
                {/* Carousel Wrapper */}
                <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }} // Menggunakan persentase untuk responsif
                >
                    {media.map((item, index) => (
                        <div 
                            key={index} 
                            className="flex-shrink-0 w-full p-2"
                        >
                            <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center relative group overflow-hidden">
                                
                                {/* Placeholder Visual */}
                                <div className="absolute inset-0 bg-cover bg-center opacity-40"
                                     style={{ backgroundImage: `url(https://placehold.co/400x256/${item.type === 'photo' ? '4F46E5' : '10B981'}/ffffff?text=${item.type.toUpperCase()})` }}
                                ></div>

                                <div className="relative z-10 text-center p-4">
                                    <span className="text-6xl text-white">{item.icon}</span>
                                    <h4 className="text-lg font-bold text-white mt-2">{item.title}</h4>
                                    <p className="text-sm text-gray-300">#{item.tag}</p>
                                </div>

                                {/* Layer interaktif */}
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition duration-300 flex items-center justify-center">
                                    <button 
                                        className="bg-pink-600/90 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                        title={`Tonton/Lihat ${item.title}`}
                                    >
                                        {item.type === 'video' ? '▶️ Tonton' : '🔍 Lihat'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigasi Kiri */}
                <button
                    onClick={prevSlide}
                    className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-gray-900/50 hover:bg-gray-900/80 text-white p-3 rounded-full transition z-20"
                >
                    &lt;
                </button>

                {/* Navigasi Kanan */}
                <button
                    onClick={nextSlide}
                    className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-gray-900/50 hover:bg-gray-900/80 text-white p-3 rounded-full transition z-20"
                >
                    &gt;
                </button>
                
                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
                    {media.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-pink-500 w-5' : 'bg-gray-300/50'}`}
                            aria-label={`Slide ${index + 1}`}
                        ></button>
                    ))}
                </div>
            </div>
        </div>
    );
};
// --- Komponen Home (VISUAL DAN FITUR TIDAK DIUBAH) ---
const QUOTES = [
    "Cinta itu bukan tentang melihat satu sama lain, melainkan melihat bersama ke satu arah yang sama. - Antoine de Saint-Exupéry",
    "Hubungan terbaik adalah ketika kamu tahu bahwa kamu berdua bisa bersama selamanya. - Anonim",
];

const QuotesSlider = () => {
    const [currentQuote, setCurrentQuote] = useState(0);

    useEffect(() => {
        // Logika slider quotes yang interaktif
        const timer = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % QUOTES.length);
        }, 7000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border-t border-pink-600 border-opacity-30 w-full max-w-4xl mx-auto transition-all duration-700">
            <h3 className="text-2xl font-bold text-pink-400 mb-4 flex items-center justify-center">
                <span className="text-3xl mr-2">💌</span> Inspirasi Cinta
            </h3>
            <p className="text-xl italic text-gray-300 transition-opacity duration-1000 min-h-[50px] flex items-center justify-center">
                "{QUOTES[currentQuote].split(' - ')[0]}"
            </p>
            <p className="text-sm mt-3 text-pink-500">
                - {QUOTES[currentQuote].split(' - ')[1]}
            </p>
        </div>
    );
};

function Home({ setSection }) {
    return (
        <div className="text-center py-10 text-gray-100 flex flex-col items-center justify-center w-full max-w-6xl mx-auto space-y-16">
            
            <h2 className="text-5xl font-extrabold text-white mb-2 tracking-tight">
                Plan Your Next Unforgettable Date
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl">
                Dari ide romantis hingga anggaran, semuanya ada di Dating Planner.
            </p>

            {/* TIGA CTA Utama */}
            <div className="flex justify-center gap-6 flex-wrap">

                <button
                    onClick={() => setSection("mood")}
                    className="bg-rose-500 hover:bg-rose-600 px-5 py-2.5 rounded-xl text-white font-medium shadow-md transition duration-300 ease-in-out w-full sm:w-auto transform hover:-translate-y-0.5"
                >
                    🌹 Mulai dengan Moodboard
                </button>

                <button
                    onClick={() => setSection("planner")}
                    className="bg-pink-600 hover:bg-pink-700 px-8 py-3 rounded-xl text-white font-bold text-lg shadow-xl transform hover:scale-[1.03] transition duration-300 ease-in-out ring-4 ring-pink-400 ring-offset-2 ring-offset-gray-900 w-full sm:w-auto mt-4 sm:mt-0"
                >
                    ✨ Buat Perencana Kencan Anda
                </button>

                {/* CTA Ketiga */}
                <button
                    onClick={() => setSection("ideas")}
                    className="bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 rounded-xl text-white font-medium shadow-md transition duration-300 ease-in-out w-full sm:w-auto transform hover:-translate-y-0.5 mt-4 sm:mt-0"
                >
                    💡 Cari Inspirasi Lain
                </button>
            </div>
            
            {/* ---------------------------------------------------------------- */}
            {/* KOMPONEN BARU: MEDIA SLIDER (FOTO/VIDEO) - Fitur Interaktif Baru */}
            {/* ---------------------------------------------------------------- */}
            <MediaInspirationSlider />

            {/* Slider Inspirasi (Quotes) - Fitur Interaktif (Preserved) */}
            <QuotesSlider />

            {/* Galeri Inspirasi (Mock Photo/Video) (Preserved) */}
            <div className="w-full max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold text-pink-400 mb-6 text-center">
                    Galeri Inspirasi <span className="text-xl">📸</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {["Sunset Dinner", "Cooking", "Hike", "Museum", "Stargazing", "Game Night"].map((item, index) => (
                        <div key={index} className={`h-24 rounded-lg flex items-center justify-center text-white font-semibold text-xs text-center bg-gray-700 shadow-lg transition duration-300 hover:scale-105 cursor-pointer`}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


// =================================================================
// 3. APP MAIN COMPONENT (State, Routing & Logic)
// =================================================================
export default function App() {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    // State utama untuk navigasi
    const [section, setSection] = useState("home"); 
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [plan, setPlan] = useState(null); 

    // ------------------------------------
    // FIREBASE INITIALIZATION & AUTH (LOGGING & FAILSAFE DITAMBAHKAN)
    // ------------------------------------
    useEffect(() => {
        let authAttempted = false; // Flag untuk memastikan kita hanya mencoba sekali
        let timeoutId;

        // Failsafe Timeout: Pastikan isAuthReady menjadi true setelah 5 detik,
        // bahkan jika inisialisasi Firebase gagal. Ini akan mencegah loading tak berujung.
        timeoutId = setTimeout(() => {
            if (!authAttempted) {
                console.warn("TIMEOUT: Inisialisasi Firebase terlalu lama. Memaksa pemuatan aplikasi. Fitur data mungkin dinonaktifkan.");
                setIsAuthReady(true);
            }
        }, 5000);

        try {
            console.log("1. Memulai Inisialisasi Firebase...");
            // Cek sederhana: jika firebaseConfig tidak memiliki kunci, mungkin kosong.
            if (Object.keys(firebaseConfig).length === 0) {
                 console.error("ERROR: firebaseConfig kosong atau tidak valid. Periksa konfigurasi lingkungan Anda.");
                 // Lanjutkan untuk memaksa isAuthReady=true melalui timeout
            }

            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authService = getAuth(app);
            setDb(firestore);
            setAuth(authService);
            console.log("2. Layanan Firebase diinisialisasi (App, Firestore, Auth).");

            const unsubscribe = onAuthStateChanged(authService, async (currentUser) => {
                authAttempted = true;
                clearTimeout(timeoutId); // Batalkan timeout jika listener berhasil dipanggil
                
                if (currentUser) {
                    setUser(currentUser);
                    console.log("4. onAuthStateChanged terpicu: Pengguna terautentikasi.");
                } else {
                    setUser(null);
                    console.log("4. onAuthStateChanged terpicu: Tidak ada pengguna ditemukan/keluar.");
                }
                // Setelah status otentikasi pertama diketahui, setel kesiapan aplikasi.
                setIsAuthReady(true); 
            });

            const authenticate = async () => {
                try {
                    console.log("3. Mencoba login Firebase...");
                    const authToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    
                    if (authToken) {
                        await signInWithCustomToken(authService, authToken);
                        console.log("3a. Login dengan token kustom (Berhasil).");
                    } else {
                        await signInAnonymously(authService);
                        console.log("3a. Login secara anonim (Berhasil).");
                    }
                } catch (error) {
                    console.error("3b. Kesalahan Otentikasi Firebase (Login Gagal):", error);
                    // Biarkan onAuthStateChanged menangani status akhir, tapi pastikan itu dipicu
                }
            };

            authenticate();
            return () => {
                clearTimeout(timeoutId);
                unsubscribe();
            };

        } catch (error) {
            console.error("KESALAHAN FATAL: Inisialisasi Firebase Gagal. Periksa jaringan dan konfigurasi.", error);
            // Jika ada kesalahan fatal saat inisialisasi, paksa isAuthReady=true agar UI utama terlihat
            setIsAuthReady(true);
            clearTimeout(timeoutId); 
        }
    }, []);

    // ------------------------------------
    // FIRESTORE DATA LISTENER
    // ------------------------------------
    useEffect(() => {
        if (!db || !user || !isAuthReady) {
            // HANYA MULAI LISTENER JIKA DB, USER, DAN AUTH SUDAH SIAP
            if (isAuthReady && !user) {
                // Jika auth siap tapi user null (anonim/logged out), kita masih bisa merender
                // tetapi fitur data akan dibatasi. Kita set plan ke null atau default jika perlu.
                // Dalam kasus ini, kita biarkan plan=null dan renderSection akan menanganinya
            }
            return;
        }

        const planDocRef = getPlanDocRef(db, user.uid);
        const initialPlanData = {
            creatorId: user.uid,
            dateTitle: 'My Next Date',
            chosenMood: 'Romantic',
            budgetLimit: 500000,
            activities: [],
            createdAt: new Date().toISOString(),
        };

        const unsubscribe = onSnapshot(planDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                setPlan(docSnap.data());
                console.log("5. Plan data fetched successfully.");
            } else {
                await setDoc(planDocRef, initialPlanData, { merge: true });
                setPlan(initialPlanData);
                console.log("5. Plan data initialized (new user/doc).");
            }
        }, (error) => {
            console.error("Kesalahan Snapshot Firestore:", error);
            setPlan(null); // Jika gagal fetch, set plan ke null
        });

        return () => unsubscribe();
    }, [db, user, isAuthReady]); // Tambahkan isAuthReady sebagai dependency

    // ------------------------------------
    // FIRESTORE DATA UPDATE FUNCTION (Tidak diubah)
    // ------------------------------------
    const updatePlan = useCallback(async (updates, isArrayUpdate = false) => {
        if (!db || !user) {
            console.error("Database atau pengguna belum siap.");
            return;
        }
        const planDocRef = getPlanDocRef(db, user.uid);
        try {
            if (isArrayUpdate) {
                await updateDoc(planDocRef, updates);
            } else {
                await updateDoc(planDocRef, updates);
            }
            console.log("Rencana diperbarui dengan sukses.");
        } catch (error) {
            console.error("Kesalahan saat memperbarui rencana:", error);
        }
    }, [db, user]);

    // ------------------------------------
    // RENDERING LOGIC (Penentuan Rute)
    // ------------------------------------
    const handleNavChange = (newSection) => {
        setSection(newSection);
    };

    const renderSection = () => {
        if (!isAuthReady) {
            return (
                <div className="text-center p-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="mt-4 text-pink-400">Memuat Aplikasi...</p>
                    <p className="mt-2 text-xs text-gray-400">
                        (Jika ini berlanjut, periksa log konsol untuk kesalahan konfigurasi Firebase.)
                    </p>
                </div>
            );
        }

        // TAMPILKAN LOADING UNTUK MODUL DATA
        const needsPlan = ["mood", "planner", "budget"];

        if (needsPlan.includes(section) && user && !plan) {
             return (
                <div className="text-center p-10">
                    <div className="animate-pulse text-2xl text-pink-400">Mengambil data rencana kencan Anda...</div>
                </div>
            );
        }

        const commonProps = { 
            // plan mungkin null di home, gallery, ideas jika user tidak ada/gagal fetch
            plan, 
            updatePlan, 
            setSection: handleNavChange 
        };

        // SWITCH CASE: Menentukan komponen yang akan dirender berdasarkan state 'section'
        switch (section) {
            case "mood":
                return <Moodboard {...commonProps} />; 
            case "planner":
                return <ActivitySelector {...commonProps} />;
            case "budget":
                return <BudgetPlanner {...commonProps} />;
            case "gallery":
                // Gallery tidak memerlukan plan, tetapi membutuhkan user untuk fitur upload
                return <Gallery user={user} setSection={handleNavChange} />; 
            case "ideas":
                return <DateIdeas setSection={handleNavChange} />;
            case "home":
            default: 
                return <Home setSection={handleNavChange} />;
        }
    };

    return (
        <div className="bg-gray-900 text-gray-100 min-h-screen flex flex-col font-sans">
            {/* Navbar - Meneruskan state section untuk highlight yang aktif */}
            <Navbar 
                onNavChange={handleNavChange} 
                user={user} 
                setShowAuthModal={setShowAuthModal}
                currentSection={section}
            />

            {/* Main Content */}
            <main className="flex-1 container mx-auto p-4 space-y-8 flex items-start justify-center min-h-[80vh]">
                {renderSection()}
            </main>

            {/* Footer */}
            <Footer />

            {/* Modals */}
            {showAuthModal && (
                <AuthModal
                    auth={auth}
                    user={user}
                    setUser={setUser}
                    onClose={() => setShowAuthModal(false)}
                />
            )}
            
            {/* Tombol Cepat untuk Lihat Rencana - Tampil hanya di Planner/Budget */}
            {(section === 'planner' || section === 'budget') && plan && (
                <button
                    onClick={() => handleNavChange(section === 'planner' ? 'budget' : 'planner')}
                    className="fixed bottom-6 right-6 z-30 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full text-lg font-bold shadow-2xl transition transform hover:scale-105"
                    aria-label="Toggle between Planner and Budget"
                >
                    {section === 'planner' ? 'Lanjut ke Budget ➡️' : 'Kembali ke Planner ✏️'}
                </button>
            )}
        </div>
    );
}