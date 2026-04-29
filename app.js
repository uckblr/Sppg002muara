const DB_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; 
const PASSWORDS = { admin: "1111", dapur: "2222", supir1: "3331", supir2: "3332" };

// Ambil data dari cache lokal agar saat buka langsung muncul (tidak kosong)
let rawData = JSON.parse(localStorage.getItem("cache_data")) || [];
let role = "pilih";
let currentMobil = "";
let searchQuery = "";
let targetRole = "";
let targetMobil = "";

// 1. FUNGSI LOAD DATA (DIPANGGIL DI AKHIR)
async function pullData() {
    try {
        const res = await fetch(DB_URL);
        const newData = await res.json();
        if (JSON.stringify(newData) !== JSON.stringify(rawData)) {
            rawData = newData;
            localStorage.setItem("cache_data", JSON.stringify(rawData)); // Simpan ke cache
            render();
        }
    } catch (e) { console.log("Offline mode"); render(); }
}

// 2. SISTEM MODAL PASSWORD (PENGGANTI PROMPT BROWSER)
function askPass(r, m = "") {
    targetRole = r;
    targetMobil = m;
    document.getElementById("modalOverlay").style.display = "flex";
    document.getElementById("passModal").style.display = "block";
    document.getElementById("passInput").value = "";
    document.getElementById("passInput").focus();
}

document.getElementById("btnConfirmPass").onclick = function() {
    const p = document.getElementById("passInput").value;
    const key = targetRole === 'supir' ? (targetMobil === 'Mobil 1' ? 'supir1' : 'supir2') : targetRole;
    
    if (p === PASSWORDS[key]) {
        role = targetRole;
        currentMobil = targetMobil;
        closeModal();
        render();
    } else {
        alert("Password Salah!");
    }
};

// 3. RENDERER UTAMA
function render() {
    renderDashboard();
    renderContent();
}

function renderDashboard() {
    const dash = document.getElementById("mainDashboard");
    if (role === "pilih") {
        dash.innerHTML = `<h2 style="margin:0">Logistik Pro</h2><p style="margin:0;opacity:0.6;font-size:12px">Elite Management System</p>`;
        return;
    }

    const tPorsi = rawData.reduce((a, b) => a + (b.isLibur ? 0 : (b.pk + b.pb + b.tendik)), 0);
    const tDone = rawData.filter(d => d.status === 'done' && !d.isLibur).reduce((a, b) => a + (b.pk + b.pb + b.tendik), 0);
    const perc = tPorsi > 0 ? Math.round((tDone / tPorsi) * 100) : 0;

    dash.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center">
            <div><small>MODE: ${role.toUpperCase()} ${currentMobil}</small><h3>Dashboard</h3></div>
            <h2>${perc}%</h2>
        </div>
        <div class="progress-bar" style="background:rgba(255,255,255,0.1); height:8px; border-radius:10px; overflow:hidden;">
            <div style="background:#6366f1; height:100%; width:${perc}%; transition:1s;"></div>
        </div>
    `;
}

function renderContent() {
    const main = document.getElementById("mainContent");
    if (role === "pilih") {
        main.innerHTML = `
            <div class="role-container" style="padding:20px; display:flex; flex-direction:column; gap:15px;">
                <div class="btn-role" onclick="askPass('admin')" style="background:white; padding:20px; border-radius:20px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:15px; font-weight:bold;">
                    <span style="font-size:24px;">💼</span> Admin Kantor
                </div>
                <div class="btn-role" onclick="askPass('dapur')" style="background:white; padding:20px; border-radius:20px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:15px; font-weight:bold;">
                    <span style="font-size:24px;">🍳</span> Tim Pemorsian
                </div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 1')" style="background:white; padding:20px; border-radius:20px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:15px; font-weight:bold;">
                    <span style="font-size:24px;">🚚</span> Supir Mobil 1
                </div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 2')" style="background:white; padding:20px; border-radius:20px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:15px; font-weight:bold;">
                    <span style="font-size:24px;">🚚</span> Supir Mobil 2
                </div>
            </div>`;
        return;
    }

    document.getElementById("searchArea").style.display = "block";
    document.getElementById("bottomNav").style.display = "flex";
    
    let filtered = rawData;
    if (role === "supir") filtered = rawData.filter(d => d.mobil === currentMobil);
    if (searchQuery) filtered = filtered.filter(d => d.nama.toLowerCase().includes(searchQuery.toLowerCase()));

    const getIkat = (n) => `${Math.floor(n/5)} Ikat + ${n%5}`;

    main.innerHTML = filtered.map(d => {
        const i = rawData.findIndex(x => x === d);
        return `
            <div class="card-sk" style="background:white; margin:10px 20px; padding:20px; border-radius:24px; box-shadow:0 4px 6px rgba(0,0,0,0.02); border:1px solid #f1f5f9; position:relative;">
                <div style="position:absolute; top:20px; right:20px; font-size:10px; font-weight:bold; color:#6366f1;">${d.status.toUpperCase()}</div>
                <h4 style="margin:0; text-transform:uppercase;">${d.nama}</h4>
                <p style="font-size:11px; color:#64748b; margin:10px 0;">
                    PK: ${d.pk} (${getIkat(d.pk)}) | PB: ${d.pb} (${getIkat(d.pb)}) | TDK: ${d.tendik}<br>
                    <b>TOTAL: ${d.pk + d.pb + d.tendik} PORSI</b>
                </p>
                ${renderButtons(d, i)}
            </div>`;
    }).join("");
}

function renderButtons(d, i) {
    if (role === 'admin') return `<button onclick="confirmHapus(${i})" style="width:100%; padding:10px; border:none; background:#fee2e2; color:red; border-radius:12px; font-weight:bold;">HAPUS</button>`;
    if (role === 'dapur') return `<button onclick="statusSiap(${i})" style="width:100%; padding:12px; border:none; background:#0f172a; color:white; border-radius:12px; font-weight:bold;">SIAP KIRIM</button>`;
    if (role === 'supir') return `<button onclick="statusDone(${i})" ${d.status !== 'ready' ? 'disabled style="opacity:0.3"' : ''} style="width:100%; padding:12px; border:none; background:#10b981; color:white; border-radius:12px; font-weight:bold;">SELESAI</button>`;
}

// 4. HELPERS & MODALS
function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("passModal").style.display = "none";
    document.getElementById("inputModal").style.display = "none";
}

function openInputModal() {
    document.getElementById("modalOverlay").style.display = "flex";
    document.getElementById("inputModal").style.display = "block";
}

function handleSearch() {
    searchQuery = document.getElementById("searchInput").value;
    render();
}

function logout() { location.reload(); }

// Jalankan render awal dari cache, lalu tarik data terbaru dari cloud
render();
pullData();
