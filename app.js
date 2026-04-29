const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; 
const PASSWORDS = { admin: "123", dapur: "456", supir: "789" };

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih";
let mobilUser = localStorage.getItem("user_mobil") || "";
let targetRole = "", targetMobil = "", deleteIdx = null;

const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

// SINKRONISASI DATA (OPTIMASI: Bandingkan data sebelum render)
async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        let newData = await res.json();
        if (JSON.stringify(newData) !== JSON.stringify(data)) {
            data = newData;
            renderAll();
        }
    } catch (e) { console.warn("Sync failed"); renderAll(); }
}

async function simpanKeCloud() {
    try {
        await fetch(CLOUD_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
    } catch (e) { alert("Gagal menyimpan ke cloud"); }
}

function renderAll() {
    renderDashboard();
    renderContent();
}

function renderDashboard() {
    const dash = document.getElementById("mainDashboard");
    const totalSkh = data.length;
    const totalPorsi = data.reduce((a, b) => a + (parseInt(b.total) || 0), 0);
    const porsiReady = data.filter(d => d.status === 'ready' || d.status === 'done').reduce((a, b) => a + (parseInt(b.total) || 0), 0);
    const porsiDone = data.filter(d => d.status === 'done').reduce((a, b) => a + (parseInt(b.total) || 0), 0);
    const persen = totalPorsi > 0 ? Math.round((porsiDone / totalPorsi) * 100) : 0;

    dash.innerHTML = `
        <div class="main-stats">
            <div class="stats-grid">
                <div class="stat-box"><small>📍 Sekolah</small><h4>${totalSkh}</h4></div>
                <div class="stat-box"><small>📦 Total Porsi</small><h4>${totalPorsi}</h4></div>
                <div class="stat-box"><small>✅ Tersedia</small><h4>${porsiReady}</h4></div>
                <div class="stat-box"><small>🚚 Terkirim</small><h4>${porsiDone}</h4></div>
            </div>
            <div class="progress-bg"><div class="progress-fill" style="width:${persen}%"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:11px; opacity:0.8;">
                <span>Belum Terkirim: ${totalPorsi - porsiDone}</span>
                <span>${persen}% Selesai</span>
            </div>
        </div>`;
}

function renderContent() {
    const content = document.getElementById("dynamicContent");
    const nav = document.getElementById("bottomNav");
    const btnPlus = document.getElementById("btnPlusAdmin");

    if (roleSekarang === "pilih") {
        nav.style.display = "none";
        content.innerHTML = `
            <div style="padding:10px 5px 20px; font-weight:800; font-size:20px; letter-spacing:-0.5px;">Pilih Akses Logistik</div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div class="btn-role" onclick="askPass('admin')" style="background:white; padding:20px; border-radius:20px; display:flex; align-items:center; gap:15px; font-weight:bold; border:1px solid #e2e8f0;">💼 Admin Kantor</div>
                <div class="btn-role" onclick="askPass('dapur')" style="background:white; padding:20px; border-radius:20px; display:flex; align-items:center; gap:15px; font-weight:bold; border:1px solid #e2e8f0;">🍳 Tim Pemorsian</div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 1')" style="background:white; padding:20px; border-radius:20px; display:flex; align-items:center; gap:15px; font-weight:bold; border:1px solid #e2e8f0;">🚚 Supir Mobil 1</div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 2')" style="background:white; padding:20px; border-radius:20px; display:flex; align-items:center; gap:15px; font-weight:bold; border:1px solid #e2e8f0;">🚚 Supir Mobil 2</div>
            </div>`;
        return;
    }

    nav.style.display = "flex";
    btnPlus.style.display = roleSekarang === "admin" ? "flex" : "none";
    let filtered = data;
    if (roleSekarang === "supir") filtered = data.filter(d => d.mobil === mobilUser && d.status === 'ready');

    let html = `<div style="padding:10px; font-weight:800; opacity:0.5; font-size:12px;">DAFTAR ${roleSekarang.toUpperCase()} ${mobilUser}</div>`;
    filtered.forEach((d) => {
        let oriIdx = data.findIndex(x => x === d);
        let action = "";
        if (roleSekarang === "dapur" && d.status === 'pending') action = `<button class="btn-primary" onclick="ubahStatus(${oriIdx}, 'ready')">SIAP KIRIM ✅</button>`;
        if (roleSekarang === "supir" && d.status === 'ready') action = `<button class="btn-primary" style="background:#10b981" onclick="ubahStatus(${oriIdx}, 'done')">SELESAI ANTAR 📍</button>`;
        if (roleSekarang === "admin") action = `<button class="btn-text" onclick="konfirmasiHapus(${oriIdx})" style="color:#ef4444; margin-top:5px;">🗑️ HAPUS DATA</button>`;

        html += `
            <div class="item ${d.status}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div><b style="font-size:17px;">${d.nama}</b><br><small style="color:#64748b;">${d.mobil} • ${d.total} Porsi</small></div>
                    <div style="font-size:9px; font-weight:bold; padding:4px 8px; border-radius:8px; background:#f1f5f9;">${d.status.toUpperCase()}</div>
                </div>
                <div style="margin-top:10px;">${action}</div>
            </div>`;
    });
    content.innerHTML = html;
}

// LOGIKA PASSWORD MODAL
function askPass(role, mobil = "") {
    targetRole = role; targetMobil = mobil;
    document.getElementById("passModal").style.display = "flex";
    document.getElementById("passInput").focus();
}
function tutupPassModal() { document.getElementById("passModal").style.display = "none"; document.getElementById("passInput").value = ""; }
document.getElementById("btnConfirmPass").onclick = function() {
    if (document.getElementById("passInput").value === PASSWORDS[targetRole]) {
        roleSekarang = targetRole; mobilUser = targetMobil;
        localStorage.setItem("user_role", roleSekarang); localStorage.setItem("user_mobil", mobilUser);
        tutupPassModal(); renderAll();
    } else { alert("Password Salah!"); }
};

// LOGIKA HAPUS MODAL
function konfirmasiHapus(i) { deleteIdx = i; document.getElementById("deleteModal").style.display = "flex"; }
function tutupDeleteModal() { document.getElementById("deleteModal").style.display = "none"; }
document.getElementById("btnConfirmDelete").onclick = function() {
    data.splice(deleteIdx, 1);
    tutupDeleteModal(); renderAll(); simpanKeCloud();
};

// LOGIKA DATA
function ubahStatus(i, s) { data[i].status = s; renderAll(); simpanKeCloud(); }
function tambahData() {
    const nm = document.getElementById("sekolahNama").value;
    if(!nm) return;
    const tot = hitungPorsi(document.getElementById("pki").value, document.getElementById("pks").value) + hitungPorsi(document.getElementById("pbi").value, document.getElementById("pbs").value);
    data.push({ nama: nm, mobil: document.getElementById("mobilPilih").value, status: 'pending', total: tot });
    tutupModal(); renderAll(); simpanKeCloud();
    document.getElementById("sekolahNama").value = "";
}

function logout() { localStorage.clear(); location.reload(); }
function bukaModal() { document.getElementById("inputModal").style.display = "flex"; }
function tutupModal() { document.getElementById("inputModal").style.display = "none"; }

tarikDataCloud();
setInterval(tarikDataCloud, 20000); // Sync tiap 20 detik
