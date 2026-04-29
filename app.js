const DB_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; // Ganti dengan URL GAS Anda
const PASSWORDS = { admin: "1111", dapur: "2222", supir1: "3331", supir2: "3332" };

let rawData = JSON.parse(localStorage.getItem("cache_data")) || [];
let role = "pilih", currentMobil = "", searchQuery = "", targetRole = "", targetMobil = "";

// 1. DATA SYNC
async function pullData() {
    try {
        const res = await fetch(DB_URL);
        const newData = await res.json();
        if (JSON.stringify(newData) !== JSON.stringify(rawData)) {
            rawData = newData;
            localStorage.setItem("cache_data", JSON.stringify(rawData));
            render();
        }
    } catch (e) { render(); }
}

async function pushData() {
    await fetch(DB_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(rawData) });
}

// 2. MODAL LOGIC
function askPass(r, m = "") {
    targetRole = r; targetMobil = m;
    document.getElementById("modalOverlay").style.display = "flex";
    document.getElementById("passModal").style.display = "block";
    document.getElementById("passInput").focus();
}

document.getElementById("btnConfirmPass").onclick = function() {
    const p = document.getElementById("passInput").value;
    const key = targetRole === 'supir' ? (targetMobil === 'Mobil 1' ? 'supir1' : 'supir2') : targetRole;
    if (p === PASSWORDS[key]) {
        role = targetRole; currentMobil = targetMobil;
        closeModal(); render();
    } else { alert("Kode Salah!"); }
};

// 3. RENDERER
function render() {
    renderDashboard();
    renderContent();
}

function renderDashboard() {
    const dash = document.getElementById("mainDashboard");
    if (role === "pilih") {
        dash.innerHTML = `<h2>Logistik Control</h2><p style="opacity:0.6;font-size:12px">Pilih akses untuk memulai</p>`;
        return;
    }
    const tPorsi = rawData.reduce((a, b) => a + (b.isLibur ? 0 : (b.pk + b.pb + b.tendik)), 0);
    const tDone = rawData.filter(d => d.status === 'done' && !d.isLibur).reduce((a, b) => a + (b.pk + b.pb + b.tendik), 0);
    const perc = tPorsi > 0 ? Math.round((tDone / tPorsi) * 100) : 0;
    
    dash.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center">
            <div><small style="opacity:0.5;text-transform:uppercase">${role} ${currentMobil}</small><h3>Ringkasan Kerja</h3></div>
            <h2 style="font-size:32px">${perc}%</h2>
        </div>
        <div style="background:rgba(255,255,255,0.1); height:10px; border-radius:20px; overflow:hidden; margin-top:10px">
            <div style="background:#6366f1; height:100%; width:${perc}%; transition:1s cubic-bezier(0.4, 0, 0.2, 1)"></div>
        </div>
    `;
}

function renderContent() {
    const main = document.getElementById("mainContent");
    if (role === "pilih") {
        main.innerHTML = `
            <div style="padding:20px; display:flex; flex-direction:column; gap:15px">
                <div class="btn-role" onclick="askPass('admin')"><div class="role-icon">💼</div>Admin Kantor</div>
                <div class="btn-role" onclick="askPass('dapur')"><div class="role-icon">🍳</div>Tim Pemorsian</div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 1')"><div class="role-icon">🚚</div>Supir Mobil 1</div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 2')"><div class="role-icon">🚚</div>Supir Mobil 2</div>
            </div>`;
        return;
    }
    document.getElementById("searchArea").style.display = "block";
    document.getElementById("bottomNav").style.display = "flex";
    
    let filtered = rawData;
    if (role === "supir") filtered = rawData.filter(d => d.mobil === currentMobil);
    if (searchQuery) filtered = filtered.filter(d => d.nama.toLowerCase().includes(searchQuery.toLowerCase()));

    const getIkat = (n) => `${Math.floor(n/5)} Ikt + ${n%5}`;

    main.innerHTML = filtered.map((d, i) => `
        <div class="card-sk">
            <div style="display:flex; justify-content:space-between">
                <h4 style="text-transform:uppercase">${d.nama}</h4>
                <span style="font-size:10px; font-weight:800; color:#6366f1">${d.status.toUpperCase()}</span>
            </div>
            <div style="font-size:11px; color:#64748b; margin:12px 0; line-height:1.6">
                PK: ${d.pk} (${getIkat(d.pk)}) | PB: ${d.pb} (${getIkat(d.pb)}) | TDK: ${d.tendik}<br>
                <b style="color:var(--dark); font-size:14px">TOTAL: ${d.pk + d.pb + d.tendik} PORSI</b>
            </div>
            ${renderActionBtn(d, rawData.indexOf(d))}
        </div>
    `).join("");
}

function renderActionBtn(d, i) {
    if (role === 'admin') return `<button onclick="confirmHapus(${i})" class="btn-gradient" style="background:var(--danger)">HAPUS SEKOLAH</button>`;
    if (role === 'dapur') return `<button onclick="updateStatus(${i}, 'ready')" class="btn-gradient">SIAP DIKIRIM</button>`;
    if (role === 'supir') return `<button onclick="updateStatus(${i}, 'done')" class="btn-gradient" style="background:var(--success)" ${d.status !== 'ready' ? 'disabled style="opacity:0.3"' : ''}>KONFIRMASI SELESAI</button>`;
}

// 4. LOGIC
function updateStatus(i, s) {
    rawData[i].status = s;
    render(); pushData();
}

function saveSekolah() {
    const nama = document.getElementById("skNama").value.toUpperCase();
    const pk = parseInt(document.getElementById("skPK").value) || 0;
    const pb = parseInt(document.getElementById("skPB").value) || 0;
    const mb = document.getElementById("skMobil").value;
    rawData.push({ nama, pk, pb, tendik: 0, mobil: mb, status: 'pending', isLibur: false });
    closeModal(); render(); pushData();
}

function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
    document.querySelectorAll(".modal-card").forEach(m => m.style.display = "none");
}

function openInputModal() {
    document.getElementById("modalOverlay").style.display = "flex";
    document.getElementById("inputModal").style.display = "block";
}

function handleSearch() { searchQuery = document.getElementById("searchInput").value; render(); }
function logout() { localStorage.removeItem("cache_data"); location.reload(); }

render();
pullData();
setInterval(pullData, 20000);
