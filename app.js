const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; // GANTI DENGAN URL /exec ANDA

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih";
let mobilUser = localStorage.getItem("user_mobil") || "";

// Fungsi kalkulasi porsi: (Ikat * 5) + Sisa
const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

async function simpanKeCloud() {
    try {
        await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
        tarikDataCloud(); // Langsung tarik data terbaru setelah simpan
    } catch (e) { 
        alert("Gagal koneksi ke Cloud. Periksa internet Anda."); 
    }
}

async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        data = await res.json();
        render();
    } catch (e) { 
        console.log("Mode Offline / Gagal tarik data"); 
        render(); 
    }
}

function render() {
    const headerArea = document.getElementById("headerArea");
    const mainContent = document.getElementById("mainContent");
    const bottomNav = document.getElementById("bottomNav");
    const btnPlus = document.getElementById("btnPlusAdmin");

    // 1. TAMPILAN JIKA BELUM LOGIN (PILIH ROLE)
    if (roleSekarang === "pilih") {
        headerArea.innerHTML = "";
        bottomNav.style.display = "none";
        mainContent.innerHTML = `
            <div style="text-align:center; padding: 50px 0 20px;">
                <h2 style="font-weight:800; margin:0; letter-spacing:-1px;">Logistik App</h2>
                <p style="color:#64748b; font-size:14px;">Silakan pilih mode akses sistem</p>
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

    // 2. TAMPILAN SETELAH LOGIN
    bottomNav.style.display = "flex";

    if (roleSekarang === "admin") {
        btnPlus.style.display = "flex";

        // --- LOGIKA PERBAIKAN DASHBOARD ---
        // Menjumlahkan seluruh porsi dari semua sekolah
        let totalPorsiSemua = data.reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);
        
        // Menjumlahkan porsi yang BELUM status 'done' (pending & ready)
        let porsiBelumTerkirim = data
            .filter(x => x.status !== 'done')
            .reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);

        headerArea.innerHTML = `
            <div class="dashboard">
                <div class="stat">
                    <span>Belum Terkirim</span>
                    <h2>${porsiBelumTerkirim}</h2>
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
                <small style="color:#94a3b8; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Mode Aktif</small>
                <div style="font-weight:800; font-size:18px; color:#1e293b;">${roleSekarang.toUpperCase()} ${mobilUser}</div>
            </div>
        `;
    }

    // 3. RENDER LIST DATA SEKOLAH
    mainContent.innerHTML = "";
    let listData = data;

    // Filter khusus supir: Hanya lihat sekolah miliknya yang statusnya 'ready'
    if (roleSekarang === "supir") {
        listData = data.filter(d => d.mobil === mobilUser && d.status === 'ready');
    }

    if (listData.length === 0) {
        mainContent.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:50px; font-size:14px;">Belum ada data untuk ditampilkan</div>`;
    }

    listData.forEach((d) => {
        let oriIdx = data.findIndex(x => x === d);
        let btnAction = "";

        // Tombol berbeda tiap Role
        if (roleSekarang === "dapur" && d.status === 'pending') {
            btnAction = `<button onclick="ubahStatus(${oriIdx}, 'ready')" style="width:100%; padding:14px; border:none; background:#a855f7; color:white; border-radius:14px; margin-top:12px; font-weight:bold; cursor:pointer;">SIAP KIRIM ✅</button>`;
        } 
        else if (roleSekarang === "supir" && d.status === 'ready') {
            btnAction = `<button onclick="ubahStatus(${oriIdx}, 'done')" style="width:100%; padding:14px; border:none; background:#10b981; color:white; border-radius:14px; margin-top:12px; font-weight:bold; cursor:pointer;">SELESAI ANTAR 📍</button>`;
        } 
        else if (roleSekarang === "admin") {
            btnAction = `<button onclick="hapusData(${oriIdx})" style="width:100%; padding:10px; border:none; background:#fee2e2; color:#ef4444; border-radius:12px; margin-top:12px; font-weight:bold; cursor:pointer;">HAPUS DATA</button>`;
        }

        mainContent.innerHTML += `
            <div class="item ${d.status}">
                <span style="font-weight:800; font-size:17px; display:block; color:#1e293b;">${d.nama}</span>
                <div style="font-size:13px; color:#64748b; margin-top:4px;">
                    ${d.mobil} <span style="margin:0 5px;">•</span> <b>${d.total} Porsi</b>
                </div>
                ${btnAction}
            </div>
        `;
    });
}

// --- FUNGSI KONTROL ---

function setRole(r, m = "") {
    roleSekarang = r;
    mobilUser = m;
    localStorage.setItem("user_role", r);
    localStorage.setItem("user_mobil", m);
    render();
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
    if(confirm("Hapus data sekolah ini secara permanen?")) {
        data.splice(i, 1);
        simpanKeCloud();
    }
}

function bukaModal() { 
    document.getElementById("inputModal").style.display = "flex"; 
}

function tutupModal() { 
    document.getElementById("inputModal").style.display = "none"; 
}

function tambahData() {
    const nama = document.getElementById("sekolahNama").value;
    if(!nama) return alert("Masukkan nama sekolah/posyandu!");

    let pki = parseInt(document.getElementById("pki").value) || 0;
    let pks = parseInt(document.getElementById("pks").value) || 0;
    let pbi = parseInt(document.getElementById("pbi").value) || 0;
    let pbs = parseInt(document.getElementById("pbs").value) || 0;

    // Hitung total porsi menggunakan fungsi hitungPorsi
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

// Inisialisasi awal
tarikDataCloud();

// Update otomatis dari cloud setiap 20 detik agar sinkron antar HP
setInterval(tarikDataCloud, 20000);
