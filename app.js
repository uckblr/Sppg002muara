const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec";

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih"; // admin, supir, dapur
let mobilUser = localStorage.getItem("user_mobil") || "";

// Fungsi Hitung Porsi
const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

/* ================= SINKRONISASI ================= */
async function simpanKeCloud() {
    try {
        await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
        render();
    } catch (e) { alert("Gagal konek ke internet"); }
}

async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        data = await res.json();
        render();
    } catch (e) { console.log("Offline mode"); }
}

/* ================= LOGIKA RENDER ================= */
function render() {
    const container = document.getElementById("listContainer");
    if (roleSekarang === "pilih") {
        renderPilihRole();
        return;
    }

    container.innerHTML = `<div class="info-role">Mode: <b>${roleSekarang.toUpperCase()}</b> ${mobilUser} 
        <button onclick="logout()" style="font-size:10px; padding:2px 5px; float:right">Ganti Mode</button></div>`;

    let filtered = data;

    // Filter berdasarkan Role
    if (roleSekarang === "supir") {
        filtered = data.filter(d => d.mobil === mobilUser && d.status !== 'pending');
    }

    filtered.forEach((d, idx) => {
        let oriIdx = data.findIndex(x => x === d);
        let cardClass = d.status; // pending, ready, done
        
        let tombolAction = "";
        if (roleSekarang === "dapur" && d.status === 'pending') {
            tombolAction = `<button class="btn-ready" onclick="ubahStatus(${oriIdx}, 'ready')">Siap Kirim ✅</button>`;
        } else if (roleSekarang === "supir" && d.status === 'ready') {
            tombolAction = `<button class="btn-done" onclick="ubahStatus(${oriIdx}, 'done')">Sudah Sampai 📍</button>`;
        } else if (roleSekarang === "admin") {
            tombolAction = `<button class="btn-delete" onclick="hapusData(${oriIdx})">Hapus</button>`;
        }

        container.innerHTML += `
            <div class="item ${cardClass}">
                <div class="item-title">${d.nama}</div>
                <div class="item-sub">${d.mobil} | PK: ${hitungPorsi(d.pk_val.i, d.pk_val.s)} | PB: ${hitungPorsi(d.pb_val.i, d.pb_val.s)}</div>
                <div class="status-tag">${d.status.toUpperCase()}</div>
                <div class="action-area">${tombolAction}</div>
            </div>
        `;
    });
    
    // Update Dashboard Admin
    if(roleSekarang === "admin") {
        document.getElementById("totalSisa").innerText = data.filter(x => x.status !== 'done').length;
        document.getElementById("totalTarget").innerText = data.length;
    }
}

function renderPilihRole() {
    document.getElementById("listContainer").innerHTML = `
        <div class="card" style="text-align:center">
            <h3>Pilih Mode Akses</h3>
            <button class="btn-role" onclick="setRole('admin')">ADMIN (KANTOR)</button>
            <button class="btn-role" onclick="setRole('dapur')">TIM PEMORSIAN</button>
            <button class="btn-role" onclick="setRole('supir', 'Mobil 1')">SUPIR MOBIL 1</button>
            <button class="btn-role" onclick="setRole('supir', 'Mobil 2')">SUPIR MOBIL 2</button>
        </div>
    `;
}

/* ================= KONTROL ================= */
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
    if(confirm("Hapus data ini?")) {
        data.splice(i, 1);
        simpanKeCloud();
    }
}

// Inisialisasi
tarikDataCloud();
setInterval(tarikDataCloud, 10000); // Auto refresh tiap 10 detik
