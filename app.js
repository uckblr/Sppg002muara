const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; // GANTI DENGAN URL /exec ANDA

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih";
let mobilUser = localStorage.getItem("user_mobil") || "";

const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

async function simpanKeCloud() {
    try {
        await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
        tarikDataCloud();
    } catch (e) { alert("Gagal koneksi cloud"); }
}

async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        data = await res.json();
        render();
    } catch (e) { console.log("Offline"); render(); }
}

function render() {
    const headerArea = document.getElementById("headerArea");
    const mainContent = document.getElementById("mainContent");
    const bottomNav = document.getElementById("bottomNav");
    const btnPlus = document.getElementById("btnPlusAdmin");

    // JIKA BELUM PILIH MODE (Tampilan Login)
    if (roleSekarang === "pilih") {
        headerArea.innerHTML = "";
        bottomNav.style.display = "none";
        mainContent.innerHTML = `
            <div style="text-align:center; padding: 40px 0 20px;">
                <h2 style="font-weight:800; margin-bottom:5px;">Logistik App</h2>
                <p style="color:#64748b; font-size:14px;">Silakan pilih mode akses sistem distribusi</p>
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

    // JIKA SUDAH PILIH MODE
    bottomNav.style.display = "flex";
    
    // Header & Dashboard
    if (roleSekarang === "admin") {
        btnPlus.style.display = "flex";
        let sisa = data.filter(x => x.status !== 'done').length;
        headerArea.innerHTML = `
            <div class="dashboard">
                <div class="stat"><span>Sisa</span><h2>${sisa}</h2></div>
                <div class="stat"><span>Total</span><h2>${data.length}</h2></div>
            </div>
        `;
    } else {
        btnPlus.style.display = "none";
        headerArea.innerHTML = `
            <div style="background:white; padding:15px; border-radius:15px; margin-bottom:20px; text-align:center; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                <small style="color:#94a3b8; font-weight:bold; text-transform:uppercase;">Mode Aktif</small>
                <div style="font-weight:800; font-size:18px;">${roleSekarang.toUpperCase()} ${mobilUser}</div>
            </div>
        `;
    }

    // List Sekolah
    mainContent.innerHTML = "";
    let listData = data;
    if (roleSekarang === "supir") {
        listData = data.filter(d => d.mobil === mobilUser && d.status !== 'pending');
    }

    if (listData.length === 0) {
        mainContent.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:40px;">Belum ada data tersedia</div>`;
    }

    listData.forEach((d, idx) => {
        let oriIdx = data.findIndex(x => x === d);
        let btn = "";
        if (roleSekarang === "dapur" && d.status === 'pending') btn = `<button class="btn-ready" onclick="ubahStatus(${oriIdx}, 'ready')">SIAP KIRIM ✅</button>`;
        if (roleSekarang === "supir" && d.status === 'ready') btn = `<button class="btn-done" onclick="ubahStatus(${oriIdx}, 'done')">SELESAI ANTAR 📍</button>`;
        if (roleSekarang === "admin") btn = `<button class="btn-delete" onclick="hapusData(${oriIdx})">HAPUS</button>`;

        mainContent.innerHTML += `
            <div class="item ${d.status}">
                <span class="item-title">${d.nama}</span>
                <div class="item-sub">${d.mobil} | Total: ${d.total} Porsi</div>
                <div style="margin-top:10px;">${btn}</div>
            </div>
        `;
    });
}

function setRole(r, m = "") {
    roleSekarang = r;
    mobilUser = m;
    localStorage.setItem("user_role", r);
    localStorage.setItem("user_mobil", m);
    render();
}

function logout() {
    localStorage.clear();
    location.reload();
}

function ubahStatus(i, s) {
    data[i].status = s;
    simpanKeCloud();
}

function hapusData(i) {
    if(confirm("Hapus data sekolah ini?")) { data.splice(i, 1); simpanKeCloud(); }
}

function bukaModal() { document.getElementById("inputModal").style.display = "flex"; }
function tutupModal() { document.getElementById("inputModal").style.display = "none"; }

function tambahData() {
    const nama = document.getElementById("sekolahNama").value;
    if(!nama) return alert("Isi nama sekolah");
    let pki = document.getElementById("pki").value, pks = document.getElementById("pks").value;
    let pbi = document.getElementById("pbi").value, pbs = document.getElementById("pbs").value;
    let tot = hitungPorsi(pki, pks) + hitungPorsi(pbi, pbs);

    data.push({
        nama: nama, mobil: document.getElementById("mobilPilih").value,
        status: 'pending', pk_val: {i:pki, s:pks}, pb_val: {i:pbi, s:pbs}, total: tot
    });
    tutupModal();
    simpanKeCloud();
}

tarikDataCloud();
