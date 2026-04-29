const DB_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; // GANTI DENGAN URL GAS ANDA
const PASSWORDS = { admin: "1111", dapur: "2222", supir1: "3331", supir2: "3332" };

let rawData = [];
let role = "pilih";
let currentMobil = "";
let searchQuery = "";
let undoTimeout = null;
let tempDeleted = null;

// 1. SMART SYNC (Anti-Lemot)
async function pullData() {
    try {
        const res = await fetch(DB_URL);
        const newData = await res.json();
        if (JSON.stringify(newData) !== JSON.stringify(rawData)) {
            rawData = newData;
            render();
        }
    } catch (e) { render(); }
}

async function pushData() {
    await fetch(DB_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(rawData) });
}

// 2. AUTO RESET JAM 3 PAGI
function checkAutoReset() {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    if (h === 3 && m === 0) {
        rawData.forEach(d => {
            d.status = "pending";
            d.logSiap = ""; d.logDone = ""; d.isLibur = false;
        });
        pushData();
    }
}
setInterval(checkAutoReset, 60000);

// 3. RENDERER
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

    const tSekolah = rawData.length;
    const tPorsi = rawData.reduce((a, b) => a + (b.isLibur ? 0 : (b.pk + b.pb + b.tendik)), 0);
    const tReady = rawData.filter(d => d.status !== 'pending' && !d.isLibur).reduce((a, b) => a + (b.pk + b.pb + b.tendik), 0);
    const tDone = rawData.filter(d => d.status === 'done' && !d.isLibur).reduce((a, b) => a + (b.pk + b.pb + b.tendik), 0);
    const perc = tPorsi > 0 ? Math.round((tDone / tPorsi) * 100) : 0;

    dash.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end">
            <div><small>MODE: ${role.toUpperCase()}</small><h3>Dashboard</h3></div>
            <h2 style="margin:0">${perc}%</h2>
        </div>
        <div class="progress-container"><div class="progress-bar"><div class="progress-fill" style="width:${perc}%"></div></div></div>
        <div class="stat-grid">
            <div class="stat-card"><small>Porsi</small><div>${tPorsi}</div></div>
            <div class="stat-card"><small>Ready</small><div>${tReady}</div></div>
            <div class="stat-card"><small>Selesai</small><div>${tDone}</div></div>
        </div>
    `;
}

function renderContent() {
    const main = document.getElementById("mainContent");
    if (role === "pilih") {
        main.innerHTML = `
            <div class="role-container">
                <div class="btn-role" onclick="askPass('admin')"><div class="role-icon">💼</div><div class="role-info"><span class="role-title">ADMIN</span><span class="role-sub">Kontrol Data & Alokasi</span></div></div>
                <div class="btn-role" onclick="askPass('dapur')"><div class="role-icon">🍳</div><div class="role-info"><span class="role-title">PEMORSIAN</span><span class="role-sub">Persiapan & Cek Stok</span></div></div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 1')"><div class="role-icon">🚚</div><div class="role-info"><span class="role-title">MOBIL 1</span><span class="role-sub">Distribusi Zona 1</span></div></div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 2')"><div class="role-icon">🚚</div><div class="role-info"><span class="role-title">MOBIL 2</span><span class="role-sub">Distribusi Zona 2</span></div></div>
            </div>`;
        return;
    }

    document.getElementById("searchArea").style.display = "block";
    document.getElementById("bottomNav").style.display = "flex";
    
    let filtered = rawData;
    if (role === "supir") filtered = rawData.filter(d => d.mobil === currentMobil);
    if (searchQuery) filtered = filtered.filter(d => d.nama.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filtered.length === 0) {
        main.innerHTML = `<center style="margin-top:50px; opacity:0.3"><h3>Data Sekolah Kosong</h3></center>`;
        return;
    }

    const getIkat = (n) => `${Math.floor(n/5)} Ikat + ${n%5}`;

    main.innerHTML = filtered.map(d => {
        const i = rawData.findIndex(x => x === d);
        return `
            <div class="card-sk ${d.isLibur ? 'libur' : ''}">
                <div class="badge badge-${d.status}">${d.status}</div>
                <h4>${d.nama}</h4>
                <div style="font-size:11px; color:var(--slate); margin:8px 0">
                    PK: ${d.pk} (${getIkat(d.pk)}) | PB: ${d.pb} (${getIkat(d.pb)}) | TDK: ${d.tendik}<br>
                    <b style="color:var(--dark); font-size:13px">TOTAL: ${d.pk + d.pb + d.tendik} PORSI</b>
                </div>
                <div style="display:flex; gap:8px; margin-top:12px">
                    ${renderActions(d, i)}
                </div>
            </div>
        `;
    }).join("");
}

function renderActions(d, i) {
    if (role === 'admin') return `
        <button onclick="editData(${i})" style="flex:1; padding:8px; border-radius:10px; border:1px solid #e2e8f0; font-weight:700">EDIT</button>
        <button onclick="toggleLibur(${i})" style="flex:1; padding:8px; border-radius:10px; border:1px solid #e2e8f0; font-weight:700">${d.isLibur ? 'UNDO LIBUR' : 'LIBUR'}</button>
        <button onclick="confirmHapus(${i})" style="flex:1; padding:8px; border-radius:10px; border:none; background:#fee2e2; color:var(--danger); font-weight:700">HAPUS</button>
    `;
    if (role === 'dapur') return `
        <button onclick="siapKirim(${i})" style="width:100%; padding:12px; border-radius:12px; border:none; background:var(--dark); color:white; font-weight:700">SIAP KIRIM ${d.logSiap || ''}</button>
    `;
    if (role === 'supir') return `
        <button onclick="selesaiAntar(${i})" ${d.status !== 'ready' ? 'disabled style="opacity:0.3"' : ''} style="width:100%; padding:12px; border-radius:12px; border:none; background:var(--success); color:white; font-weight:700">SELESAI ${d.logDone || ''}</button>
    `;
}

// 4. LOGIC ACTIONS
function askPass(r, m = "") {
    const p = prompt(`Password ${r.toUpperCase()} ${m}:`);
    const key = r === 'supir' ? (m === 'Mobil 1' ? 'supir1' : 'supir2') : r;
    if (p === PASSWORDS[key]) {
        role = r; currentMobil = m;
        render();
    } else if (p !== null) alert("Salah!");
}

function siapKirim(i) {
    rawData[i].status = "ready";
    rawData[i].logSiap = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    render(); pushData();
}

function selesaiAntar(i) {
    rawData[i].status = "done";
    rawData[i].logDone = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    render(); pushData();
}

function toggleLibur(i) {
    rawData[i].isLibur = !rawData[i].isLibur;
    render(); pushData();
}

function confirmHapus(i) {
    tempDeleted = { data: rawData[i], idx: i };
    rawData.splice(i, 1);
    render();
    document.getElementById("undoToast").style.display = "flex";
    undoTimeout = setTimeout(() => {
        document.getElementById("undoToast").style.display = "none";
        pushData();
    }, 5000);
}

function executeUndo() {
    clearTimeout(undoTimeout);
    rawData.splice(tempDeleted.idx, 0, tempDeleted.data);
    document.getElementById("undoToast").style.display = "none";
    render();
}

function saveSekolah() {
    const n = document.getElementById("skNama").value.toUpperCase();
    const pk = parseInt(document.getElementById("skPK").value) || 0;
    const pb = parseInt(document.getElementById("skPB").value) || 0;
    const tdk = parseInt(document.getElementById("skTendik").value) || 0;
    const mb = document.getElementById("skMobil").value;
    
    rawData.push({ nama: n, pk, pb, tendik: tdk, mobil: mb, status: 'pending', isLibur: false, logSiap: '', logDone: '' });
    
    // Reset Form
    document.querySelectorAll("#inputModal input").forEach(i => i.value = (i.type === 'number' ? 0 : ""));
    closeModal(); render(); pushData();
}

// 5. HELPERS
function handleSearch() { searchQuery = document.getElementById("searchInput").value; render(); }
function openInputModal() { document.getElementById("modalOverlay").style.display = "flex"; document.getElementById("inputModal").style.display="block"; }
function closeModal() { document.getElementById("modalOverlay").style.display = "none"; document.querySelectorAll(".modal-card").forEach(m => m.style.display="none"); }
function logout() { location.reload(); }

pullData();
setInterval(pullData, 15000);
