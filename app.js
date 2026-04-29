const DB_URL = "URL_DATABASE_ANDA";
const PASS_CONFIG = { admin: "1111", dapur: "2222", "Mobil 1": "3331", "Mobil 2": "3332" };

let rawData = [];
let role = "pilih";
let currentMobil = "";
let undoTimeout = null;
let lastDeleted = null;
let searchQuery = "";

// 1. JAM 3 PAGI AUTO UPDATE (Reset Status)
function checkScheduleReset() {
    const now = new Date();
    if (now.getHours() === 3 && now.getMinutes() === 0) {
        rawData.forEach(d => {
            d.status = "pending";
            d.logSiap = "";
            d.logSelesai = "";
            d.isLibur = false;
        });
        saveToCloud();
    }
}
setInterval(checkScheduleReset, 60000);

// 2. CORE FUNCTIONS
async function pullData() {
    try {
        const res = await fetch(DB_URL);
        rawData = await res.json();
        render();
    } catch (e) { console.error("Sync Error"); }
}

async function saveToCloud() {
    await fetch(DB_URL, { method: 'POST', body: JSON.stringify(rawData) });
}

// 3. UI RENDERER
function render() {
    renderDashboard();
    renderMain();
}

function renderDashboard() {
    const dash = document.getElementById("mainDashboard");
    if (role === "pilih") {
        dash.innerHTML = `<h2>Logistik Control</h2><p>Pilih akses untuk memulai</p>`;
        return;
    }

    const stats = calculateStats();
    dash.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center">
            <div><small>Akses: ${role} ${currentMobil}</small><h3>Dashboard</h3></div>
            <div style="text-align:right"><h3>${stats.percent}%</h3><small>Terkirim</small></div>
        </div>
        <div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${stats.percent}%"></div></div></div>
        <div class="stat-grid">
            <div class="stat-card"><small>Total Sekolah</small><div>${stats.totalSK}</div></div>
            <div class="stat-card"><small>Total Porsi</small><div>${stats.totalPorsi}</div></div>
            <div class="stat-card"><small>Sisa Belum</small><div>${stats.unsend}</div></div>
        </div>
    `;
}

function calculateStats() {
    const totalSK = rawData.length;
    const totalPorsi = rawData.reduce((a, b) => a + (b.isLibur ? 0 : b.pk + b.pb + b.tendik), 0);
    const sentPorsi = rawData.filter(d => d.status === 'done').reduce((a, b) => a + (b.pk + b.pb + b.tendik), 0);
    const percent = totalPorsi > 0 ? Math.round((sentPorsi / totalPorsi) * 100) : 0;
    return { totalSK, totalPorsi, unsend: totalPorsi - sentPorsi, percent };
}

function renderMain() {
    const main = document.getElementById("mainContent");
    if (role === "pilih") {
        renderRoleSelection();
        return;
    }

    let filtered = rawData;
    if (role === "supir") filtered = rawData.filter(d => d.mobil === currentMobil);
    if (searchQuery) filtered = filtered.filter(d => d.nama.toLowerCase().includes(searchQuery.toLowerCase()));

    let html = "";
    filtered.forEach((d, idx) => {
        const oriIdx = rawData.findIndex(x => x === d);
        const totalPorsi = d.pk + d.pb + d.tendik;
        const ikat = (n) => `${Math.floor(n / 5)} Ikat + ${n % 5}`;

        html += `
            <div class="card-sk" style="${d.isLibur ? 'opacity:0.5; background:#f1f5f9' : ''}">
                <div style="display:flex; justify-content:space-between">
                    <h4>${d.nama}</h4>
                    <span class="badge" style="background:#e2e8f0">${d.status.toUpperCase()}</span>
                </div>
                <div style="font-size:12px; color:#64748b; margin-bottom:10px">
                    PK: ${d.pk} (${ikat(d.pk)}) | PB: ${d.pb} (${ikat(d.pb)}) | Tendik: ${d.tendik}<br>
                    <strong>Total: ${totalPorsi} Porsi</strong>
                </div>
                <div class="action-row" style="display:flex; gap:5px">
                    ${renderButtonsByRole(d, oriIdx)}
                </div>
            </div>
        `;
    });
    main.innerHTML = html || "<center style='margin-top:50px'>Data Kosong</center>";
}

function renderRoleSelection() {
    const main = document.getElementById("mainContent");
    main.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:15px; padding:20px">
            <button class="premium-input" onclick="openPass('admin')">ADMIN KANTOR</button>
            <button class="premium-input" onclick="openPass('dapur')">TIM PEMORSIAN</button>
            <button class="premium-input" onclick="openPass('supir', 'Mobil 1')">SUPIR MOBIL 1</button>
            <button class="premium-input" onclick="openPass('supir', 'Mobil 2')">SUPIR MOBIL 2</button>
        </div>
    `;
}

function renderButtonsByRole(d, idx) {
    if (role === "admin") {
        return `
            <button onclick="toggleLibur(${idx})">${d.isLibur ? 'Batal Libur' : 'Libur'}</button>
            <button onclick="confirmHapus(${idx})" style="color:red">Hapus</button>
        `;
    }
    if (role === "dapur") {
        return `<button class="btn-confirm" onclick="siapKirim(${idx})">Siap Kirim ${d.logSiap || ''}</button>`;
    }
    if (role === "supir") {
        const canFinish = d.status === 'ready';
        return `<button class="btn-confirm" ${!canFinish ? 'disabled opacity:0.5' : ''} onclick="selesaiAntar(${idx})">Selesai ${d.logSelesai || ''}</button>`;
    }
    return "";
}

// 4. ACTION LOGIC
function siapKirim(idx) {
    const now = new Date();
    rawData[idx].status = "ready";
    rawData[idx].logSiap = `${now.getHours()}:${now.getMinutes()}`;
    saveToCloud();
    render();
}

function selesaiAntar(idx) {
    const now = new Date();
    rawData[idx].status = "done";
    rawData[idx].logSelesai = `${now.getHours()}:${now.getMinutes()}`;
    saveToCloud();
    render();
}

// 5. UNDO SYSTEM
function confirmHapus(idx) {
    if (confirm("Hapus data ini?")) {
        lastDeleted = { data: rawData[idx], index: idx };
        rawData.splice(idx, 1);
        render();
        showUndo("Data Sekolah dihapus");
        undoTimeout = setTimeout(() => {
            hideUndo();
            saveToCloud();
        }, 5000);
    }
}

function executeUndo() {
    if (lastDeleted) {
        rawData.splice(lastDeleted.index, 0, lastDeleted.data);
        clearTimeout(undoTimeout);
        hideUndo();
        render();
    }
}

// 6. HELPER
function openPass(r, m = "") {
    targetRole = r;
    targetMobil = m;
    document.getElementById("modalOverlay").style.display = "flex";
    document.getElementById("passModal").style.display = "block";
}

document.getElementById("btnConfirmPass").onclick = () => {
    const inp = document.getElementById("passInput").value;
    const key = targetRole === 'supir' ? targetMobil : targetRole;
    if (inp === PASS_CONFIG[key]) {
        role = targetRole;
        currentMobil = targetMobil;
        closeModal();
        document.getElementById("searchArea").style.display = "block";
        document.getElementById("bottomNav").style.display = "flex";
        render();
    } else { alert("Salah!"); }
};

function openInputModal() {
    document.getElementById("modalOverlay").style.display = "flex";
    document.getElementById("inputModal").style.display = "block";
}

function saveSekolah() {
    const nama = document.getElementById("skNama").value.toUpperCase();
    const pk = parseInt(document.getElementById("skPK").value);
    const pb = parseInt(document.getElementById("skPB").value);
    const tendik = parseInt(document.getElementById("skTendik").value);
    const mobil = document.getElementById("skMobil").value;

    rawData.push({ nama, pk, pb, tendik, mobil, status: 'pending', isLibur: false });
    saveToCloud();
    closeModal();
    // Reset Form
    document.getElementById("skNama").value = "";
    document.getElementById("skPK").value = 0;
    document.getElementById("skPB").value = 0;
    document.getElementById("skTendik").value = 0;
    render();
}

function handleSearch() {
    searchQuery = document.getElementById("searchInput").value;
    render();
}

function showUndo(msg) {
    document.getElementById("undoMsg").innerText = msg;
    document.getElementById("undoToast").style.display = "flex";
}
function hideUndo() { document.getElementById("undoToast").style.display = "none"; }
function closeModal() { document.getElementById("modalOverlay").style.display = "none"; document.querySelectorAll(".modal-card").forEach(m => m.style.display="none"); }
function handleLogout() { location.reload(); }

pullData();
