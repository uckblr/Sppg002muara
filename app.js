const CLOUD_URL = "URL_WEB_APP_ANDA"; // Masukkan URL Anda di sini

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih";
let mobilUser = localStorage.getItem("user_mobil") || "";

const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

async function simpanKeCloud() {
    try {
        await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
        tarikDataCloud();
    } catch (e) { alert("Koneksi gagal"); }
}

async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        data = await res.json();
        render();
    } catch (e) { console.log("Offline"); }
}

function render() {
    const container = document.getElementById("listContainer");
    const statsArea = document.getElementById("statsArea");
    const nav = document.getElementById("mainNav");
    const plusBtn = document.getElementById("plusButton");

    // 1. JIKA BELUM PILIH ROLE
    if (roleSekarang === "pilih") {
        statsArea.innerHTML = "";
        nav.style.display = "none";
        container.innerHTML = `
            <div style="text-align:center; padding: 40px 0 10px;">
                <h2 style="margin-bottom:10px; font-weight:800;">Logistik App</h2>
                <p style="color:#64748b; font-size:14px; padding:0 20px;">Silakan pilih mode akses untuk masuk ke sistem distribusi</p>
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

    // 2. JIKA SUDAH PILIH ROLE
    nav.style.display = "flex";
    if (roleSekarang === "admin") {
        plusBtn.style.display = "flex";
        let sisa = data.filter(x => x.status !== 'done').length;
        statsArea.innerHTML = `
            <div class="dashboard">
                <div class="stat"><span>Sisa</span><h2>${sisa}</h2></div>
                <div class="stat"><span>Total</span><h2>${data.length}</h2></div>
            </div>
        `;
    } else {
        plusBtn.style.display = "none";
        statsArea.innerHTML = `<div style="padding:15px; background:white; border-radius:15px; margin-bottom:15px; font-weight:bold; text-align:center;">MODE: ${roleSekarang.toUpperCase()} ${mobilUser}</div>`;
    }

    // Render List
    container.innerHTML = "";
    let filtered = data;
    if (roleSekarang === "supir") {
        filtered = data.filter(d => d.mobil === mobilUser && d.status !== 'pending');
    }

    filtered.forEach((d, idx) => {
        let oriIdx = data.findIndex(x => x === d);
        let action = "";
        if (roleSekarang === "dapur" && d.status === 'pending') action = `<button class="btn-ready" onclick="ubahStatus(${oriIdx}, 'ready')">SIAP KIRIM ✅</button>`;
        if (roleSekarang === "supir" && d.status === 'ready') action = `<button class="btn-done" onclick="ubahStatus(${oriIdx}, 'done')">SELESAI ANTAR 📍</button>`;
        if (roleSekarang === "admin") action = `<button class="btn-delete" onclick="hapusData(${oriIdx})">HAPUS</button>`;

        container.innerHTML += `
            <div class="item ${d.status}">
                <span class="item-title">${d.nama}</span>
                <div class="item-sub">${d.mobil} | Total: ${d.total} Porsi</div>
                ${action}
            </div>
        `;
    });
}

/* FUNGSI CONTROL */
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
    if(confirm("Hapus?")) { data.splice(i, 1); simpanKeCloud(); }
}

function bukaModal() { document.getElementById("inputModal").style.display = "flex"; }
function tutupModal() { document.getElementById("inputModal").style.display = "none"; }

function tambahData() {
    const nama = document.getElementById("sekolahNama").value;
    if(!nama) return;
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
