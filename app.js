const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec";

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih";
let mobilUser = localStorage.getItem("user_mobil") || "";

const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

async function simpanKeCloud() {
    try {
        await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
        render();
    } catch (e) { alert("Gagal koneksi internet"); }
}

async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        data = await res.json();
        render();
    } catch (e) { console.log("Gagal tarik data"); }
}

function render() {
    const container = document.getElementById("listContainer");
    
    if (roleSekarang === "pilih") {
        renderPilihRole();
        return;
    }

    // Tampilan Header Mode
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <small style="color:#64748b; text-transform:uppercase; font-weight:bold">Mode Akses</small>
                <div style="font-weight:800; font-size:18px;">${roleSekarang.toUpperCase()} ${mobilUser}</div>
            </div>
            <button onclick="logout()" style="background:#f1f5f9; border:none; padding:8px 12px; border-radius:10px; font-weight:bold; color:#ef4444; font-size:12px;">GANTI</button>
        </div>
    `;

    let filtered = data;
    if (roleSekarang === "supir") {
        filtered = data.filter(d => d.mobil === mobilUser && d.status !== 'pending');
    }

    filtered.forEach((d, idx) => {
        let oriIdx = data.findIndex(x => x === d);
        let tombolAction = "";
        
        if (roleSekarang === "dapur" && d.status === 'pending') {
            tombolAction = `<button class="btn-ready" onclick="ubahStatus(${oriIdx}, 'ready')">SIAP DIKIRIM ✅</button>`;
        } else if (roleSekarang === "supir" && d.status === 'ready') {
            tombolAction = `<button class="btn-done" onclick="ubahStatus(${oriIdx}, 'done')">SUDAH SAMPAI 📍</button>`;
        } else if (roleSekarang === "admin") {
            tombolAction = `<button class="btn-delete" onclick="hapusData(${oriIdx})">HAPUS DATA</button>`;
        }

        container.innerHTML += `
            <div class="item ${d.status}">
                <span class="item-title">${d.nama}</span>
                <div class="item-sub">${d.mobil} | PK: ${hitungPorsi(d.pk_val.i, d.pk_val.s)} | PB: ${hitungPorsi(d.pb_val.i, d.pb_val.s)}</div>
                <div style="margin-top:10px; font-size:11px; font-weight:bold; color:#94a3b8">STATUS: ${d.status.toUpperCase()}</div>
                ${tombolAction}
            </div>
        `;
    });

    if(roleSekarang === "admin") {
        document.getElementById("totalSisa").innerText = data.filter(x => x.status !== 'done').length;
        document.getElementById("totalTarget").innerText = data.length;
    }
}

function renderPilihRole() {
    document.getElementById("listContainer").innerHTML = `
        <div style="text-align:center; padding: 40px 0 20px;">
            <h2 style="margin-bottom:10px; font-weight:800;">Logistik App</h2>
            <p style="color:#64748b; font-size:14px;">Silakan pilih mode akses untuk masuk ke sistem distribusi</p>
        </div>
        <div class="role-container">
            <button class="btn-role admin" onclick="setRole('admin')">💼 ADMIN (KANTOR)</button>
            <button class="btn-role" onclick="setRole('dapur')">🍳 TIM PEMORSIAN</button>
            <button class="btn-role" onclick="setRole('supir', 'Mobil 1')">🚚 SUPIR MOBIL 1</button>
            <button class="btn-role" onclick="setRole('supir', 'Mobil 2')">🚚 SUPIR MOBIL 2</button>
        </div>
    `;
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
    if(confirm("Hapus data sekolah ini?")) {
        data.splice(i, 1);
        simpanKeCloud();
    }
}

// Tambah data (Hanya bisa dipanggil lewat fungsi yang ada di index.html)
function tambahData() {
    // Logika tambah data sekolah oleh Admin
    // Pastikan Anda memiliki Modal Input di index.html seperti kode sebelumnya
}

tarikDataCloud();
setInterval(tarikDataCloud, 15000); // Sinkron otomatis tiap 15 detik
