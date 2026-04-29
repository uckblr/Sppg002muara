const DB_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; 
const PASSWORDS = { admin: "1111", dapur: "2222", supir1: "3331", supir2: "3332" };

let rawData = JSON.parse(localStorage.getItem("cache_data")) || [];
let role = "pilih", currentMobil = "", searchQuery = "";

// Ambil data terbaru secara background
async function pullData() {
    try {
        const res = await fetch(DB_URL);
        const newData = await res.json();
        rawData = newData;
        localStorage.setItem("cache_data", JSON.stringify(rawData));
        render();
    } catch (e) { console.log("Offline mode aktif"); render(); }
}

// Sistem Password Modal
function askPass(r, m = "") {
    const overlay = document.getElementById("modalOverlay");
    const modal = document.getElementById("passModal");
    overlay.style.display = "flex";
    modal.style.display = "block";
    
    // Set target login
    window.targetRole = r;
    window.targetMobil = m;
    document.getElementById("passInput").value = "";
    document.getElementById("passInput").focus();
}

function verifyLogin() {
    const input = document.getElementById("passInput").value;
    const key = window.targetRole === 'supir' ? (window.targetMobil === 'Mobil 1' ? 'supir1' : 'supir2') : window.targetRole;
    
    if (input === PASSWORDS[key]) {
        role = window.targetRole;
        currentMobil = window.targetMobil;
        closeModal();
        render();
    } else {
        // Efek Getar jika salah
        const card = document.querySelector(".modal-card");
        card.style.animation = "none";
        setTimeout(() => card.style.animation = "shake 0.3s", 10);
    }
}

// Render Dashboard Premium
function renderDashboard() {
    const dash = document.getElementById("mainDashboard");
    if (role === "pilih") {
        dash.innerHTML = `<h1 style="font-weight:800; margin:0; letter-spacing:-1px;">Logistik Control</h1>
                         <p style="opacity:0.6; margin-top:5px;">Pilih akses untuk memulai hari ini</p>`;
        return;
    }

    const tPorsi = rawData.reduce((a, b) => a + (b.isLibur ? 0 : (b.pk + b.pb + b.tendik)), 0);
    const tDone = rawData.filter(d => d.status === 'done' && !d.isLibur).reduce((a, b) => a + (b.pk + b.pb + b.tendik), 0);
    const perc = tPorsi > 0 ? Math.round((tDone / tPorsi) * 100) : 0;

    dash.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div><small style="color:rgba(255,255,255,0.5); font-weight:700;">${role.toUpperCase()} ${currentMobil}</small>
                 <h2 style="margin:0; font-size:24px;">Progress Pengiriman</h2></div>
            <div style="text-align:right;"><h1 style="margin:0; font-size:36px;">${perc}%</h1></div>
        </div>
        <div style="background:rgba(255,255,255,0.1); height:12px; border-radius:20px; margin-top:20px; overflow:hidden;">
            <div style="background:var(--p-gradient); height:100%; width:${perc}%; transition:1.5s cubic-bezier(0.2, 1, 0.3, 1);"></div>
        </div>
    `;
}

// Action Button Handler
function renderActions(d, i) {
    if (role === 'admin') return `
        <button class="btn-action" style="background:var(--d-gradient); margin-top:15px;" onclick="confirmDelete(${i})">HAPUS DATA</button>
    `;
    if (role === 'dapur') return `
        <button class="btn-action" onclick="changeStatus(${i}, 'ready')">SIAPKAN PORSI</button>
    `;
    if (role === 'supir') return `
        <button class="btn-action" style="background:var(--s-gradient)" onclick="changeStatus(${i}, 'done')" ${d.status !== 'ready' ? 'disabled style="opacity:0.4"' : ''}>SELESAI DIKIRIM</button>
    `;
}

function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
    document.querySelectorAll(".modal-card").forEach(m => m.style.display = "none");
}

// Inisialisasi
pullData();
render();
