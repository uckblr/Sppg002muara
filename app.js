const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; // Masukkan URL /exec Anda di sini

let data = [];
let roleSekarang = localStorage.getItem("user_role") || "pilih";
let mobilUser = localStorage.getItem("user_mobil") || "";

const hitungPorsi = (i, s) => (parseInt(i) || 0) * 5 + (parseInt(s) || 0);

async function simpanKeCloud() {
    try {
        await fetch(CLOUD_URL, { method: 'POST', body: JSON.stringify(data) });
        tarikDataCloud();
    } catch (e) { alert("Gagal koneksi"); }
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

    if (roleSekarang === "pilih") {
        headerArea.innerHTML = "";
        bottomNav.style.display = "none";
        mainContent.innerHTML = `
            <div style="text-align:center; padding: 50px 0 20px;">
                <h2 style="font-weight:800; margin:0;">Logistik App</h2>
                <p style="color:#64748b; font-size:14px;">Pilih mode akses sistem</p>
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

    bottomNav.style.display = "flex";
    if (roleSekarang === "admin") {
        btnPlus.style.display = "flex";
        headerArea.innerHTML = `
            <div class="dashboard">
                <div class="stat"><span>Sisa</span><h2>${data.filter(x => x.status !== 'done').length}</h2></div>
                <div class="stat"><span>Total</span><h2>${data.length}</h2></div>
            </div>
        `;
    } else {
        btnPlus.style.display = "none";
        headerArea.innerHTML = `<div style="background:white; padding:15px; border-radius:18px; margin-bottom:20px; text-align:center; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
            <small style="color:#94a3b8; font-weight:bold;">MODE AKTIF</small>
            <div style="font-weight:800; font-size:18px;">${roleSekarang.toUpperCase()} ${mobilUser}</div>
        </div>`;
    }

    mainContent.innerHTML = "";
    let filtered = data;
    if (roleSekarang === "supir") filtered = data.filter(d => d.mobil === mobilUser && d.status !== 'pending');

    filtered.forEach((d, idx) => {
        let oriIdx = data.findIndex(x => x === d);
        let btnAction = "";
        if (roleSekarang === "dapur" && d.status === 'pending') btnAction = `<button onclick="ubahStatus(${oriIdx}, 'ready')" style="width:100%; padding:12px; border:none; background:#a855f7; color:white; border-radius:12px; margin-top:10px; font-weight:bold;">SIAP KIRIM ✅</button>`;
        if (roleSekarang === "supir" && d.status === 'ready') btnAction = `<button onclick="ubahStatus(${oriIdx}, 'done')" style="width:100%; padding:12px; border:none; background:#10b981; color:white; border-radius:12px; margin-top:10px; font-weight:bold;">SUDAH SAMPAI 📍</button>`;
        if (roleSekarang === "admin") btnAction = `<button onclick="hapusData(${oriIdx})" style="width:100%; padding:10px; border:none; background:#fee2e2; color:#ef4444; border-radius:12px; margin-top:10px; font-weight:bold;">HAPUS</button>`;

        mainContent.innerHTML += `
            <div class="item ${d.status}">
                <span style="font-weight:800; font-size:17px; display:block;">${d.nama}</span>
                <div style="font-size:13px; color:#64748b; margin-top:4px;">${d.mobil} | Total: ${d.total} Porsi</div>
                ${btnAction}
            </div>
        `;
    });
}

function setRole(r, m = "") {
    roleSekarang = r; mobilUser = m;
    localStorage.setItem("user_role", r);
    localStorage.setItem("user_mobil", m);
    render();
}

function logout() { localStorage.clear(); location.reload(); }
function ubahStatus(i, s) { data[i].status = s; simpanKeCloud(); }
function hapusData(i) { if(confirm("Hapus?")) { data.splice(i, 1); simpanKeCloud(); } }
function bukaModal() { document.getElementById("inputModal").style.display = "flex"; }
function tutupModal() { document.getElementById("inputModal").style.display = "none"; }

function tambahData() {
    const nama = document.getElementById("sekolahNama").value;
    if(!nama) return alert("Nama sekolah kosong");
    let pki = document.getElementById("pki").value, pks = document.getElementById("pks").value;
    let pbi = document.getElementById("pbi").value, pbs = document.getElementById("pbs").value;
    let tot = hitungPorsi(pki, pks) + hitungPorsi(pbi, pbs);

    data.push({ nama: nama, mobil: document.getElementById("mobilPilih").value, status: 'pending', pk_val: {i:pki, s:pks}, pb_val: {i:pbi, s:pbs}, total: tot });
    tutupModal();
    simpanKeCloud();
}

tarikDataCloud();
setInterval(tarikDataCloud, 20000); // Update otomatis tiap 20 detik
