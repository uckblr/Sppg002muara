// ==========================================
// KONFIGURASI UTAMA
// ==========================================
const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; // Ganti dengan URL /exec Google Apps Script Anda

// Pengaturan Password
const PASSWORDS = {
    admin: "123",    // Password masuk mode Admin
    dapur: "456",    // Password masuk mode Dapur
    supir: "789"     // Password masuk mode Supir (Mobil 1 & 2)
};

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih";
let mobilUser = localStorage.getItem("user_mobil") || "";

// Fungsi kalkulasi porsi: (Ikat * 5) + Sisa
const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

// ==========================================
// FUNGSI CLOUD (DATABASE)
// ==========================================
async function simpanKeCloud() {
    try {
        await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
        tarikDataCloud();
    } catch (e) { 
        alert("Gagal koneksi ke Cloud."); 
    }
}

async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        data = await res.json();
        render();
    } catch (e) { 
        console.log("Offline mode"); 
        render(); 
    }
}

// ==========================================
// FUNGSI TAMPILAN (RENDER)
// ==========================================
function render() {
    const headerArea = document.getElementById("headerArea");
    const mainContent = document.getElementById("mainContent");
    const bottomNav = document.getElementById("bottomNav");
    const btnPlus = document.getElementById("btnPlusAdmin");

    // 1. JIKA BELUM LOGIN (MENU PILIH ROLE)
    if (roleSekarang === "pilih") {
        headerArea.innerHTML = "";
        bottomNav.style.display = "none";
        mainContent.innerHTML = `
            <div style="text-align:center; padding: 50px 0 20px;">
                <h2 style="font-weight:800; margin:0;">Logistik App Pro</h2>
                <p style="color:#64748b; font-size:14px;">Pilih mode akses untuk melanjutkan</p>
            </div>
            <div class="role-container">
                <button class="btn-role admin" onclick="setRole('admin')">💼 ADMIN (KANTOR)</button>
                <button class="btn-role" onclick="setRole('dapur')">🍳 TIM PEMORSIAN</button>
                <button class="btn-role" onclick="setRole('supir', 'Mobil 1')">🚚 SUPIR MOBIL 1</button>
                <button class="btn-role" onclick="setRole('supir', 'Mobil 2')">🚚 SUPIR MOBIL 2</button>
            </div>
        `;
        return;
    }

    // 2. JIKA SUDAH LOGIN
    bottomNav.style.display = "flex";

    if (roleSekarang === "admin") {
        btnPlus.style.display = "flex";

        // Hitung akumulasi porsi (bukan jumlah baris)
        let totalPorsiSemua = data.reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);
        let porsiBelumKirim = data
            .filter(x => x.status !== 'done')
            .reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);

        headerArea.innerHTML = `
            <div class="dashboard">
                <div class="stat">
                    <span>Belum Terkirim</span>
                    <h2>${porsiBelumKirim}</h2>
                </div>
                <div class="stat">
                    <span>Total Porsi</span>
                    <h2>${totalPorsiSemua}</h2>
                </div>
            </div>
        `;
    } else {
        btnPlus.style.display = "none";
        headerArea.innerHTML = `
            <div style="background:white; padding:15px; border-radius:18px; margin-bottom:20px; text-align:center; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                <small style="color:#94a3b8; font-weight:bold; text-transform:uppercase;">Mode Aktif</small>
                <div style="font-weight:800; font-size:18px;">${roleSekarang.toUpperCase()} ${mobilUser}</div>
            </div>
        `;
    }

    // 3. RENDER DAFTAR ITEM
    mainContent.innerHTML = "";
    let filtered = data;

    // Filter akses supir (hanya yang sudah 'ready' oleh dapur)
    if (roleSekarang === "supir") {
        filtered = data.filter(d => d.mobil === mobilUser && d.status === 'ready');
    }

    if (filtered.length === 0) {
        mainContent.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:50px;">Tidak ada data sekolah</div>`;
    }

    filtered.forEach((d) => {
        let oriIdx = data.findIndex(x => x === d);
        let actionBtn = "";

        if (roleSekarang === "dapur" && d.status === 'pending') {
            actionBtn = `<button class="btn-ready" onclick="ubahStatus(${oriIdx}, 'ready')" style="width:100%; padding:14px; border:none; background:#a855f7; color:white; border-radius:12px; margin-top:10px; font-weight:bold;">SIAP KIRIM ✅</button>`;
        } 
        else if (roleSekarang === "supir" && d.status === 'ready') {
            actionBtn = `<button class="btn-done" onclick="ubahStatus(${oriIdx}, 'done')" style="width:100%; padding:14px; border:none; background:#10b981; color:white; border-radius:12px; margin-top:10px; font-weight:bold;">SELESAI ANTAR 📍</button>`;
        } 
        else if (roleSekarang === "admin") {
            actionBtn = `<button onclick="hapusData(${oriIdx})" style="width:100%; padding:10px; border:none; background:#fee2e2; color:#ef4444; border-radius:12px; margin-top:10px; font-weight:bold;">HAPUS</button>`;
        }

        mainContent.innerHTML += `
            <div class="item ${d.status}">
                <span style="font-weight:800; font-size:17px; display:block;">${d.nama}</span>
                <div style="font-size:13px; color:#64748b; margin-top:4px;">
                    ${d.mobil} <span style="margin:0 5px;">•</span> <b>${d.total} Porsi</b>
                </div>
                ${actionBtn}
            </div>
        `;
    });
}

// ==========================================
// FUNGSI KONTROL & LOGIKA
// ==========================================

function setRole(r, m = "") {
    let inputPass = prompt(`Masukkan Password untuk mode ${r.toUpperCase()}:`);
    
    if (inputPass === PASSWORDS[r]) {
        roleSekarang = r;
        mobilUser = m;
        localStorage.setItem("user_role", r);
        localStorage.setItem("user_mobil", m);
        render();
    } else {
        alert("Password Salah!");
    }
}

function logout() {
    if(confirm("Keluar dari mode ini?")) {
        localStorage.clear();
        location.reload();
    }
}

function ubahStatus(i, s) {
    data[i].status = s;
    simpanKeCloud();
}

function hapusData(i) {
    if(confirm("Hapus data ini?")) {
        data.splice(i, 1);
        simpanKeCloud();
    }
}

function bukaModal() { document.getElementById("inputModal").style.display = "flex"; }
function tutupModal() { document.getElementById("inputModal").style.display = "none"; }

function tambahData() {
    const nama = document.getElementById("sekolahNama").value;
    if(!nama) return alert("Nama sekolah wajib diisi!");

    let pki = parseInt(document.getElementById("pki").value) || 0;
    let pks = parseInt(document.getElementById("pks").value) || 0;
    let pbi = parseInt(document.getElementById("pbi").value) || 0;
    let pbs = parseInt(document.getElementById("pbs").value) || 0;

    let tot = hitungPorsi(pki, pks) + hitungPorsi(pbi, pbs);

    data.push({
        nama: nama,
        mobil: document.getElementById("mobilPilih").value,
        status: 'pending',
        pk_val: {i: pki, s: pks},
        pb_val: {i: pbi, s: pbs},
        total: tot
    });

    // Reset Form
    document.getElementById("sekolahNama").value = "";
    document.getElementById("pki").value = "0";
    document.getElementById("pks").value = "0";
    document.getElementById("pbi").value = "0";
    document.getElementById("pbs").value = "0";

    tutupModal();
    simpanKeCloud();
}

// Menarik data pertama kali
tarikDataCloud();

// Sinkronisasi otomatis tiap 20 detik
setInterval(tarikDataCloud, 20000);
