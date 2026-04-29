// GANTI DENGAN URL WEB APP GOOGLE SHEETS ANDA
const CLOUD_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec";

let data = JSON.parse(localStorage.getItem("logistik_db") || "[]");
let filterSekarang = "Semua";

// Fungsi Hitung (PK/PB * 5 + Sisa)
const hitungTotal = (i, s) => (Math.max(0, parseInt(i) || 0) * 5) + Math.max(0, parseInt(s) || 0);

/* ================= SINKRONISASI CLOUD ================= */
async function simpanKeCloud() {
    localStorage.setItem("logistik_db", JSON.stringify(data));
    try {
        await fetch(CLOUD_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (e) { console.log("Offline: Data disimpan lokal"); }
    render();
}

async function tarikDataCloud() {
    try {
        let res = await fetch(CLOUD_URL);
        let cloudData = await res.json();
        if (cloudData.length > 0) {
            data = cloudData;
            localStorage.setItem("logistik_db", JSON.stringify(data));
            render();
        }
    } catch (e) { console.log("Gagal mengambil data cloud"); }
}

/* ================= LOGIKA APLIKASI ================= */
function render() {
    const container = document.getElementById("listContainer");
    const search = document.getElementById("searchInput").value.toLowerCase();
    container.innerHTML = "";

    let sisaDistribusi = 0;
    let totalTarget = 0;

    let filtered = data.filter(d => {
        let mSearch = d.nama.toLowerCase().includes(search);
        let mMobil = filterSekarang === "Semua" || d.mobil === filterSekarang;
        return mSearch && mMobil;
    });

    filtered.forEach((d, idx) => {
        let originalIdx = data.findIndex(x => x === d);
        totalTarget += d.total;
        if(d.status === 'pending') sisaDistribusi += d.total;

        container.innerHTML += `
            <div class="item ${d.status}">
                <div class="action">
                    ${d.status === 'pending' ? `
                        <button class="smallbtn btn-up" onclick="prioritas(${originalIdx})"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg></button>
                        <button class="smallbtn btn-holiday" onclick="ubahStatus(${originalIdx}, 'holiday')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></button>
                        <button class="smallbtn btn-done" onclick="ubahStatus(${originalIdx}, 'done')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                    ` : `
                        <button class="smallbtn btn-retry" onclick="ubahStatus(${originalIdx}, 'pending')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>
                    `}
                    <button class="smallbtn btn-delete" onclick="hapusData(${originalIdx})"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                </div>
                <span class="item-title">${d.nama}</span>
                <div style="font-size:12px; color:#64748b;">
                    ${d.mobil} | PK: ${hitungTotal(d.pk_val.i, d.pk_val.s)} | PB: ${hitungTotal(d.pb_val.i, d.pb_val.s)}
                </div>
                <div style="margin-top:8px; font-weight:bold; color:var(--primary)">TOTAL: ${d.total}</div>
            </div>
        `;
    });

    document.getElementById("totalSisa").innerText = sisaDistribusi;
    document.getElementById("totalTarget").innerText = totalTarget;
}

function tambahData() {
    const nama = document.getElementById("sekolahNama").value;
    if(!nama) return alert("Nama sekolah wajib diisi");

    let pki = document.getElementById("pki").value;
    let pks = document.getElementById("pks").value;
    let pbi = document.getElementById("pbi").value;
    let pbs = document.getElementById("pbs").value;

    let total = hitungTotal(pki, pks) + hitungTotal(pbi, pbs);

    data.push({
        nama: nama,
        mobil: document.getElementById("mobilPilih").value,
        status: 'pending',
        pk_val: { i: pki, s: pks },
        pb_val: { i: pbi, s: pbs },
        total: total
    });

    tutupModal();
    simpanKeCloud();
}

/* ================= UI CONTROL ================= */
function bukaModal() { document.getElementById("inputModal").style.display = "flex"; }
function tutupModal() { document.getElementById("inputModal").style.display = "none"; }
function setFilter(f) {
    filterSekarang = f;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.innerText === f));
    render();
}

function ubahStatus(i, s) { data[i].status = s; simpanKeCloud(); }
function prioritas(i) { if(i > 0) { let item = data.splice(i, 1)[0]; data.unshift(item); simpanKeCloud(); } }
function hapusData(i) { if(confirm("Hapus data ini?")) { data.splice(i, 1); simpanKeCloud(); } }

/* ================= EFEK TEKAN UNIVERSAL ================= */
document.addEventListener('touchstart', (e) => {
    let el = e.target.closest('button, .nav-plus, .nav-item, .smallbtn');
    if (el) el.classList.add('tekan');
}, {passive: true});

document.addEventListener('touchend', (e) => {
    let el = e.target.closest('button, .nav-plus, .nav-item, .smallbtn');
    if (el) setTimeout(() => el.classList.remove('tekan'), 100);
}, {passive: true});

// STARTUP
tarikDataCloud();
render();
