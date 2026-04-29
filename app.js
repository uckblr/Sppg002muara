const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; 
const PASSWORDS = { admin: "123", dapur: "456", supir: "789" };

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih";
let mobilUser = localStorage.getItem("user_mobil") || "";
let targetRole = "";
let targetMobil = "";

const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        data = await res.json();
        renderDashboard();
        renderContent();
    } catch (e) { renderDashboard(); renderContent(); }
}

function renderDashboard() {
    const dash = document.getElementById("mainDashboard");
    
    // Perhitungan Statistik
    const totalSekolah = data.length;
    const totalPenerima = data.reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);
    const porsiTersedia = data.filter(d => d.status === 'ready' || d.status === 'done').reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);
    const porsiTerkirim = data.filter(d => d.status === 'done').reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);
    const belumKirim = totalPenerima - porsiTerkirim;
    
    // Progres Persentase
    const persen = totalPenerima > 0 ? Math.round((porsiTerkirim / totalPenerima) * 100) : 0;

    dash.innerHTML = `
        <div class="main-stats">
            <div class="stats-grid">
                <div class="stat-box"><small>Sekolah</small><h4>${totalSekolah}</h4></div>
                <div class="stat-box"><small>Total Porsi</small><h4>${totalPenerima}</h4></div>
                <div class="stat-box"><small>Tersedia</small><h4>${porsiTersedia}</h4></div>
                <div class="stat-box"><small>Terkirim</small><h4>${porsiTerkirim}</h4></div>
            </div>
            <div class="progress-container">
                <div class="progress-label">
                    <span>Progres Pengiriman</span>
                    <span>${persen}%</span>
                </div>
                <div class="progress-bg"><div class="progress-fill" style="width:${persen}%"></div></div>
                <center style="margin-top:10px; font-size:12px; opacity:0.6;">Belum Terkirim: ${belumKirim} Porsi</center>
            </div>
        </div>
    `;
}

function renderContent() {
    const content = document.getElementById("dynamicContent");
    const nav = document.getElementById("bottomNav");
    const btnPlus = document.getElementById("btnPlusAdmin");

    if (roleSekarang === "pilih") {
        nav.style.display = "none";
        content.innerHTML = `
            <div class="role-container">
                <div class="btn-role" onclick="askPass('admin')">💼 <span>Mode Admin</span></div>
                <div class="btn-role" onclick="askPass('dapur')">🍳 <span>Mode Pemorsian</span></div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 1')">🚚 <span>Supir Mobil 1</span></div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 2')">🚚 <span>Supir Mobil 2</span></div>
            </div>
        `;
        return;
    }

    nav.style.display = "flex";
    btnPlus.style.display = roleSekarang === "admin" ? "flex" : "none";
    
    let list = data;
    if (roleSekarang === "supir") list = data.filter(d => d.mobil === mobilUser && d.status === 'ready');

    content.innerHTML = `<div style="padding:10px; font-weight:800; opacity:0.5;">LIST DISTRIBUSI (${roleSekarang.toUpperCase()})</div>`;
    
    list.forEach((d) => {
        let oriIdx = data.findIndex(x => x === d);
        let action = "";
        if (roleSekarang === "dapur" && d.status === 'pending') action = `<button class="btn-primary" onclick="ubahStatus(${oriIdx}, 'ready')">SIAP KIRIM</button>`;
        if (roleSekarang === "supir" && d.status === 'ready') action = `<button class="btn-primary" style="background:#10b981" onclick="ubahStatus(${oriIdx}, 'done')">SELESAI</button>`;
        if (roleSekarang === "admin") action = `<button onclick="hapusData(${oriIdx})" style="color:red; border:none; background:none; font-weight:700; margin-top:10px;">HAPUS</button>`;

        content.innerHTML += `
            <div class="item ${d.status}">
                <b>${d.nama}</b><br>
                <small>${d.mobil} • ${d.total} Porsi</small>
                <div style="margin-top:10px">${action}</div>
            </div>
        `;
    });
}

// --- PASSWORD POPUP LOGIC ---
function askPass(role, mobil = "") {
    targetRole = role;
    targetMobil = mobil;
    document.getElementById("passModal").style.display = "flex";
    document.getElementById("passInput").focus();
}

document.getElementById("btnConfirmPass").onclick = function() {
    const pass = document.getElementById("passInput").value;
    if (pass === PASSWORDS[targetRole]) {
        roleSekarang = targetRole;
        mobilUser = targetMobil;
        localStorage.setItem("user_role", roleSekarang);
        localStorage.setItem("user_mobil", mobilUser);
        tutupPassModal();
        renderContent();
    } else {
        alert("Password Salah!");
    }
};

function tutupPassModal() { 
    document.getElementById("passModal").style.display = "none"; 
    document.getElementById("passInput").value = "";
}

// --- DATA LOGIC ---
async function ubahStatus(i, s) {
    data[i].status = s;
    await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
    tarikDataCloud();
}

async function tambahData() {
    const nama = document.getElementById("sekolahNama").value;
    if(!nama) return alert("Isi nama sekolah");
    let pki = document.getElementById("pki").value, pks = document.getElementById("pks").value;
    let pbi = document.getElementById("pbi").value, pbs = document.getElementById("pbs").value;
    let tot = hitungPorsi(pki, pks) + hitungPorsi(pbi, pbs);
    data.push({ nama: nama, mobil: document.getElementById("mobilPilih").value, status: 'pending', total: tot });
    tutupModal();
    await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
    tarikDataCloud();
}

function hapusData(i) { if(confirm("Hapus data?")) { data.splice(i, 1); ubahStatus(null, null); } }
function logout() { localStorage.clear(); location.reload(); }
function bukaModal() { document.getElementById("inputModal").style.display = "flex"; }
function tutupModal() { document.getElementById("inputModal").style.display = "none"; }

tarikDataCloud();
setInterval(tarikDataCloud, 15000);
