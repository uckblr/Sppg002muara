// app.js - Full Firebase Integrated Version (Final Optimization with Dynamic Text)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD6rXZtHhrUayPSzKshtqFjwQzRsYPDh7E",
  authDomain: "aplikasi-36320.firebaseapp.com",
  databaseURL: "https://aplikasi-36320-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aplikasi-36320",
  storageBucket: "aplikasi-36320.firebasestorage.app",
  messagingSenderId: "773533324102",
  appId: "1:773533324102:web:f5552cd63932d6f7734b47"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. STATE APLIKASI
let schools = [];
let currentRole = "";
let selectedMobil = "Mobil 1";
let editIndex = null;
let filterMobil = "all";
let selectedSchoolId = null;

// --- CORE UI FUNCTIONS ---
window.showLoading = (s, msg = "SINKRONISASI...") => { 
    const loader = document.getElementById('loader');
    if(loader) {
        document.getElementById('loader-text').innerText = msg.toUpperCase();
        loader.style.display = s ? 'flex' : 'none'; 
    }
};

window.showToast = (m) => { 
    const t = document.getElementById('toast'); 
    if(t) {
        t.innerText = m; t.style.display = 'block'; 
        setTimeout(() => t.style.display = 'none', 2000); 
    }
};

window.closeModal = () => { 
    document.getElementById('modal-overlay').style.display = 'none'; 
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); 
};

window.selectMobil = (m) => {
    selectedMobil = m;
    document.getElementById('btn-m1').classList.toggle('m-active', m === 'Mobil 1');
    document.getElementById('btn-m2').classList.toggle('m-active', m === 'Mobil 2');
};

window.setFilter = (m, el) => {
    filterMobil = m;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    window.renderApp();
};

const getIkat = (n) => n > 0 ? `${Math.floor(n/5)} Ikat${n%5>0?' + '+(n%5):''}` : '0 Ikat';

// --- STATS LOGIC ---
function renderStats(data) {
    let activeData = data.filter(s => s.status !== 'holiday');
    let relevantData = [];
    
    if (currentRole === 'mobil1') {
        relevantData = activeData.filter(s => s.mobil === 'Mobil 1');
    } else if (currentRole === 'mobil2') {
        relevantData = activeData.filter(s => s.mobil === 'Mobil 2');
    } else {
        relevantData = activeData;
    }

    let totalPorsi = relevantData.reduce((a, b) => a + (Number(b.pk) + Number(b.pb) + Number(b.tendik)), 0);
    let doneSekolah = 0;
    let donePorsi = 0;

    if (currentRole === 'pemorsian') {
        doneSekolah = relevantData.filter(s => s.status === 'ready' || s.status === 'done').length;
        donePorsi = relevantData.filter(s => s.status === 'ready' || s.status === 'done').reduce((a, b) => a + (Number(b.pk) + Number(b.pb) + Number(b.tendik)), 0);
    } else {
        doneSekolah = relevantData.filter(s => s.status === 'done').length;
        donePorsi = relevantData.filter(s => s.status === 'done').reduce((a, b) => a + (Number(b.pk) + Number(b.pb) + Number(b.tendik)), 0);
    }

    const totalSekolah = relevantData.length;
    const perc = totalSekolah > 0 ? Math.round((doneSekolah / totalSekolah) * 100) : 0;
    const sisaSekolah = totalSekolah - doneSekolah;

    // Logika teks kustom untuk status selesai
    const textSelesai = doneSekolah === 0 
        ? "BELUM ADA SEKOLAH YANG DISELESAIKAN" 
        : `${doneSekolah} SEKOLAH DISELESAIKAN`;

    // Logika teks kustom untuk status sisa
    const textSisa = sisaSekolah === 0
        ? "SEMUA SEKOLAH SUDAH SELESAI"
        : `${sisaSekolah} SEKOLAH BELUM DISELESAIKAN`;

    const statsContainer = document.getElementById('stats-container');
    if(statsContainer) {
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><small>TOTAL PENERIMA</small><b>${totalPorsi}</b></div>
                <div class="stat-card"><small>TERDISTRIBUSI</small><b style="color:var(--success)">${donePorsi}</b></div>
                <div class="stat-card"><small>BELUM TERDISTRIBUSI</small><b style="color:var(--danger)">${totalPorsi - donePorsi}</b></div>
            </div>`;
    }

    const progContainer = document.getElementById('progress-container');
    if(progContainer) {
        progContainer.innerHTML = `
            <div class="prog-label"><span>PROGRESS</span><span>${perc}%</span></div>
            <div class="prog-bar-bg"><div class="prog-bar-fill" style="width: ${perc}%"></div></div>
            <div class="prog-detail">
                <div class="prog-box" style="background:#f0fdf4; color:#166534; font-size: 10px; flex: 1.5; text-align: center; font-weight: bold; padding: 8px 4px;">
                    ${textSelesai}
                </div>
                <div class="prog-box" style="background:#fffbeb; color:#92400e; font-size: 10px; flex: 1.2; text-align: center; font-weight: bold; padding: 8px 4px;">
                    ${textSisa}
                </div>
            </div>`;
    }
}

// --- FIREBASE SYNC ---
function listenToSchools() {
    window.showLoading(true, "Sinkronisasi...");
    const schoolRef = ref(db, 'schools');
    onValue(schoolRef, (snapshot) => {
        const data = snapshot.val();
        schools = data ? Object.values(data) : [];
        const hStatus = document.getElementById('h-status');
        if(hStatus) hStatus.innerHTML = '<span class="online-dot"></span> ONLINE';
        if(currentRole) window.renderApp();
        window.showLoading(false);
    }, (error) => {
        window.showLoading(false);
        window.showToast("Koneksi Terputus");
    });
}

// --- RENDER APP ---
window.renderApp = function() {
    renderStats(schools);
    const searchInput = document.getElementById('app-search');
    const searchVal = searchInput ? searchInput.value.toLowerCase() : "";
    const c = document.getElementById('list-container'); 
    if(!c) return;
    c.innerHTML = "";
    
    let filtered = schools.filter(s => {
        const searchMatch = s.nama.toLowerCase().includes(searchVal);
        if (currentRole === 'pemorsian') {
            const mobilMatch = filterMobil === 'all' || s.mobil === filterMobil;
            return mobilMatch && searchMatch && s.status !== 'holiday';
        } 
        if (currentRole === 'admin') {
            const mobilMatch = filterMobil === 'all' || s.mobil === filterMobil;
            return mobilMatch && searchMatch;
        } else {
            const targetMobil = currentRole === 'mobil1' ? 'Mobil 1' : 'Mobil 2';
            return s.mobil === targetMobil && s.status !== 'holiday' && searchMatch;
        }
    });

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state"><b>TIDAK ADA DATA</b></div>';
        return;
    }

    // URUTAN: Ready (1), Pending (2), Done (3), Holiday (4)
        // LOGIKA URUTAN ADAPTIF
    filtered.sort((a, b) => {
        let rank = {};
        
        if (currentRole === 'pemorsian') {
            // Untuk Dapur: Pending dulu baru Ready
            rank = { "pending": 1, "ready": 2, "done": 3, "holiday": 4 };
        } else {
            // Untuk Admin & Mobil: Ready dulu baru Pending
            rank = { "ready": 1, "pending": 2, "done": 3, "holiday": 4 };
        }
        
        return rank[a.status] - rank[b.status];
    });


    filtered.forEach((s) => {
        const total = Number(s.pk) + Number(s.pb) + Number(s.tendik);
        const mobilBadge = s.mobil === 'Mobil 1' ? 'badge-m1' : 'badge-m2';
        let actionBtn = '';

        if(currentRole === 'admin') {
            actionBtn = `
                <div class="btn-group">
                    <button class="btn-mini" style="background:#f1f5f9" onclick="openFormEditById('${s.id}')">EDIT</button>
                    <button class="btn-mini" style="background:#fee2e2; color:var(--danger)" onclick="askDelete('${s.id}')">HAPUS</button>
                </div>`;
        } else if(currentRole === 'pemorsian') {
            if (s.status === 'done') {
                // Jika sudah diselesaikan sopir, jangan tampilkan tombol apapun
                actionBtn = '<div class="done-wrapper"><span class="done-text">SELESAI</span></div>';
            } else {
                const isReady = s.status === 'ready';
                actionBtn = `
                <button class="btn-action" 
                    style="background:${isReady ? '#f1f5f9' : 'var(--primary)'}; 
                           color:${isReady ? '#64748b' : 'white'}" 
                    onclick="updateStatusDirect('${s.id}', '${isReady ? 'pending' : 'ready'}')">
                    ${isReady ? 'BATAL SIAP' : 'SIAP KIRIM'}
                </button>`;
            }

        } else if(currentRole.includes('mobil')) {
            if (s.status === 'done') actionBtn = '<div class="done-wrapper"><span class="done-text">✓ TERDISTRIBUSI</span></div>';
            else if (s.status === 'ready') actionBtn = `<button class="btn-action" style="background:var(--grad); color:white" onclick="updateStatusDirect('${s.id}', 'done')">KONFIRMASI SELESAI</button>`;
            else actionBtn = '<div class="waiting-container"><div class="shimmer-text">Menunggu Pemorsian...</div></div>';
        }

        c.innerHTML += `
        <div class="card card-${s.status}">
            ${currentRole === 'admin' ? `<div class="menu-dot" onclick="openStatusMenu('${s.id}')">⋮</div>` : ''}
            <div class="badge-row">
                <span class="badge ${mobilBadge}">${s.mobil}</span>
                <span class="badge badge-status-${s.status}">${s.status.toUpperCase()}</span>
            </div>
            <b style="font-size:16px;">${s.nama}</b>
            <div class="porsi-box">
                <div class="porsi-item item-pk">PK: ${s.pk}<span class="ikat-text">${getIkat(s.pk)}</span></div>
                <div class="porsi-item item-pb">PB: ${s.pb}<span class="ikat-text">${getIkat(s.pb)}</span></div>
                <div class="porsi-item item-td">TD: ${s.tendik}<span class="ikat-text">${getIkat(s.tendik)}</span></div>
                <div class="porsi-item item-total" style="border-top:1px solid #eee; margin-top:5px; padding-top:5px"><b>TOTAL: ${total} PENERIMA</b></div>
            </div>
            ${actionBtn}
        </div>`;
    });
};

// --- ACTIONS ---
window.updateStatusDirect = async (id, newStatus) => {
    window.showLoading(true, "Memproses...");
    try {
        await update(ref(db, 'schools/' + id), { status: newStatus });
        window.showToast("Status Diperbarui");
    } catch(e) { window.showToast("Gagal Update"); }
    finally { window.showLoading(false); }
};

window.handleSave = async () => {
    const n = document.getElementById('in-nama').value; if(!n) return;
    window.closeModal(); 
    const isEdit = editIndex !== null;
    const id = isEdit ? editIndex : Date.now().toString();
    window.showLoading(true, "Menyimpan...");
    const data = {
        id: id, nama: n.toUpperCase(), mobil: selectedMobil,
        pk: parseInt(document.getElementById('in-pk').value)||0, 
        pb: parseInt(document.getElementById('in-pb').value)||0, 
        tendik: parseInt(document.getElementById('in-td').value)||0,
        status: isEdit ? schools.find(x=>x.id===id).status : "pending"
    };
    try { 
        await set(ref(db, 'schools/' + id), data);
        window.showToast("Data Tersimpan");
        editIndex = null;
    } catch(e){ window.showToast("Error Simpan"); }
    finally { window.showLoading(false); }
};

window.askDelete = (id) => {
    window.openCustomConfirm("Hapus Data?", "Data ini akan dihapus permanen.", async () => {
        window.showLoading(true, "Menghapus...");
        try { await remove(ref(db, 'schools/' + id)); window.showToast("Berhasil Dihapus"); } catch(e) { window.showToast("Gagal Hapus"); }
        finally { window.showLoading(false); }
    }, 'var(--danger)');
};

// --- AUTH & NAV ---
window.checkPinAuto = async (v) => {
    if(v.length === 4) {
        window.showLoading(true, "Verifikasi...");
        try {
            const pinRef = ref(db, 'pins/' + currentRole);
            const snap = await get(pinRef);
            window.showLoading(false);
            if(snap.exists() && snap.val().toString().trim() === v.toString().trim()) {
                localStorage.setItem('userRole', currentRole);
                window.closeModal(); 
                window.navigate(currentRole);
            } else { 
                window.showToast("PIN SALAH"); 
                document.getElementById('pin-input').value = ""; 
            }
        } catch(e) { window.showLoading(false); window.showToast("Koneksi Error"); }
    }
};

window.openLogin = (r) => { 
    currentRole=r; 
    document.getElementById('modal-overlay').style.display='flex'; 
    document.getElementById('login-modal').style.display='block'; 
    const input = document.getElementById('pin-input');
    if(input) { input.value = ""; input.focus(); }
};

window.navigate = (role) => {
    currentRole = role;
    document.getElementById('page-home').style.display='none';
    document.getElementById('page-app').style.display='block';
    const titles = { admin: "ADMIN", pemorsian: "PEMORSIAN", mobil1: "MOBIL 1", mobil2: "MOBIL 2" };
    document.getElementById('app-title').innerText = titles[role] || role.toUpperCase();
    document.getElementById('btn-add-wrapper').style.display = (role === 'admin') ? 'flex' : 'none';
    document.getElementById('filter-wrapper').style.display = (role === 'admin' || role === 'pemorsian') ? 'flex' : 'none';
    
    // ANTI-BACK: Catat state baru ke history
    history.pushState({ page: 'app' }, ''); 
    window.renderApp();
};

window.confirmExit = () => { 
    window.closeModal(); 
    localStorage.removeItem('userRole'); 
    document.getElementById('page-app').style.display='none'; 
    document.getElementById('page-home').style.display='block'; 
    currentRole = ""; 
    history.replaceState({ page: 'home' }, '');
};

window.askExit = () => {
    document.getElementById('modal-overlay').style.display='flex';
    document.getElementById('exit-modal').style.display='block';
};

window.openStatusMenu = (id) => { 
    selectedSchoolId = id; 
    document.getElementById('modal-overlay').style.display = 'flex'; 
    document.getElementById('status-modal').style.display = 'block'; 
};

window.updateStatusFromMenu = async (s) => { 
    window.closeModal(); 
    await window.updateStatusDirect(selectedSchoolId, s); 
};

window.openCustomConfirm = (title, msg, onConfirm, color) => {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerText = msg;
    const okBtn = document.getElementById('confirm-btn-ok');
    if(okBtn) {
        okBtn.style.background = color;
        okBtn.onclick = () => { window.closeModal(); onConfirm(); };
    }
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('confirm-modal').style.display = 'block';
};

window.openFormAdd = () => { 
    editIndex = null; 
    document.querySelectorAll('#form-modal input').forEach(i=>i.value=""); 
    window.selectMobil('Mobil 1'); 
    document.getElementById('modal-overlay').style.display='flex'; 
    document.getElementById('form-modal').style.display='block'; 
};

window.openFormEditById = (id) => {
    const s = schools.find(x => x.id === id);
    if(!s) return;
    editIndex = id;
    document.getElementById('in-nama').value = s.nama;
    document.getElementById('in-pk').value = s.pk;
    document.getElementById('in-pb').value = s.pb;
    document.getElementById('in-td').value = s.tendik;
    window.selectMobil(s.mobil);
    document.getElementById('modal-overlay').style.display='flex';
    document.getElementById('form-modal').style.display='block';
};

// --- INIT ---
window.onload = () => {
    listenToSchools();
    
    // ANTI-BACK LISTENER
    window.addEventListener('popstate', (event) => {
        if (currentRole !== "") {
            history.pushState({ page: 'app' }, ''); 
            window.askExit(); 
        }
    });

    const searchInput = document.getElementById('app-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            window.renderApp();
        });
    }

    const savedRole = localStorage.getItem('userRole');
    if(savedRole) window.navigate(savedRole);
};
