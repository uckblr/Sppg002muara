// app.js - Optimized Version with Auto-Reset, Timestamps, and Role-Based Sorting
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

// --- FUNGSI RESET OTOMATIS (LOGIKA JAM 00.00) ---
async function checkAndResetStatus() {
    const today = new Date().toLocaleDateString('en-CA'); 
    const lastResetRef = ref(db, 'lastResetDate');
    const snap = await get(lastResetRef);
    
    if (!snap.exists() || snap.val() !== today) {
        const updates = {};
        schools.forEach(s => {
            // HANYA RESET YANG BUKAN HOLIDAY
            if (s.status !== 'holiday') {
                updates[`schools/${s.id}/status`] = 'pending';
                updates[`schools/${s.id}/waktuReady`] = null;
                updates[`schools/${s.id}/waktuDone`] = null;
            } else {
                // Yang holiday tetap holiday, tapi pastikan catatan waktu lama hilang
                updates[`schools/${s.id}/waktuReady`] = null;
                updates[`schools/${s.id}/waktuDone`] = null;
            }
        });
        
        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
        await set(lastResetRef, today);
    }
}


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
window.showPopupNotify = (msg, color = "var(--primary)") => {
    // Hapus notif lama jika masih ada
    const old = document.querySelector('.realtime-notify');
    if(old) old.remove();

    const div = document.createElement('div');
    div.className = 'realtime-notify';
    div.style.borderLeftColor = color;
    div.innerHTML = `<span>🔔</span> <span>${msg}</span>`;
    document.body.appendChild(div);

    // Otomatis hapus setelah 4 detik
    setTimeout(() => div.remove(), 4000);
};
// Fungsi untuk memutar suara
window.playNotifySound = (type) => {
    let audioUrl = "";
    
    if (type === 'ready') {
        // Suara lonceng/ding untuk "Siap Kirim"
        audioUrl = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
    } else {
        // Suara sukses/ting untuk "Selesai"
        audioUrl = "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3";
    }

    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.log("Audio play diblokir browser: ", e));
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
    
    if (currentRole === 'mobil1') relevantData = activeData.filter(s => s.mobil === 'Mobil 1');
    else if (currentRole === 'mobil2') relevantData = activeData.filter(s => s.mobil === 'Mobil 2');
    else relevantData = activeData;

    let totalPorsi = relevantData.reduce((a, b) => a + (Number(b.pk) + Number(b.pb) + Number(b.tendik)), 0);
    let doneSekolah = relevantData.filter(s => s.status === 'done').length;
    let donePorsi = relevantData.filter(s => s.status === 'done').reduce((a, b) => a + (Number(b.pk) + Number(b.pb) + Number(b.tendik)), 0);

    const totalSekolah = relevantData.length;
    const perc = totalSekolah > 0 ? Math.round((doneSekolah / totalSekolah) * 100) : 0;
    const sisaSekolah = totalSekolah - doneSekolah;

    const textSelesai = doneSekolah === 0 ? "BELUM ADA SEKOLAH YANG DISELESAIKAN" : `${doneSekolah} SEKOLAH DISELESAIKAN`;
    const textSisa = sisaSekolah === 0 ? "SEMUA SEKOLAH SUDAH SELESAI" : `${sisaSekolah} SEKOLAH BELUM DISELESAIKAN`;

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
                <div class="prog-box" style="background:#f0fdf4; color:#166534; font-size: 10px; flex: 1.5; text-align: center; font-weight: bold; padding: 8px 4px;">${textSelesai}</div>
                <div class="prog-box" style="background:#fffbeb; color:#92400e; font-size: 10px; flex: 1.2; text-align: center; font-weight: bold; padding: 8px 4px;">${textSisa}</div>
            </div>`;
    }
}

// --- FIREBASE SYNC ---
let oldSchoolsData = null; // Penampung untuk membandingkan data

function listenToSchools() {
    window.showLoading(true, "Sinkronisasi...");
    onValue(ref(db, 'schools'), (snapshot) => {
        const data = snapshot.val();
        const newSchools = data ? Object.values(data) : [];
        
        // --- LOGIKA NOTIFIKASI ---

// 1. Dapur klik SIAP KIRIM
if (newS.status === 'ready') {
    if (currentRole === 'admin' || (currentRole.includes('mobil') && newS.mobil === (currentRole === 'mobil1' ? 'Mobil 1' : 'Mobil 2'))) {
        window.showPopupNotify(`${newS.nama} SIAP DI KIRIM`, "#3b82f6");
        window.playNotifySound('ready'); // <--- TAMBAHKAN INI
    }
} 

// 2. Sopir klik SELESAI
else if (newS.status === 'done' && currentRole === 'admin') {
    window.showPopupNotify(`${newS.nama} SELESAI DI KIRIM`, "#22c55e");
    window.playNotifySound('done'); // <--- TAMBAHKAN INI
}

        
        oldSchoolsData = JSON.parse(JSON.stringify(newSchools)); // Simpan data sekarang untuk perbandingan berikutnya
        schools = newSchools;
        
        const hStatus = document.getElementById('h-status');
        if(hStatus) hStatus.innerHTML = '<span class="online-dot"></span> ONLINE';
        
        checkAndResetStatus();
        if(currentRole) window.renderApp();
        window.showLoading(false);
    });
}


// --- RENDER APP ---
window.renderApp = function() {
    renderStats(schools);
    const searchVal = document.getElementById('app-search')?.value.toLowerCase() || "";
    const c = document.getElementById('list-container'); 
    if(!c) return; c.innerHTML = "";
    
    let filtered = schools.filter(s => {
        const searchMatch = s.nama.toLowerCase().includes(searchVal);
        if (currentRole === 'pemorsian' || currentRole === 'admin') {
            return (filterMobil === 'all' || s.mobil === filterMobil) && searchMatch;
        } 
        const targetMobil = currentRole === 'mobil1' ? 'Mobil 1' : 'Mobil 2';
        return s.mobil === targetMobil && s.status !== 'holiday' && searchMatch;
    });

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state"><b>TIDAK ADA DATA</b></div>';
        return;
    }

    filtered.sort((a, b) => {
        let rank = (currentRole === 'pemorsian') 
            ? { "pending": 1, "ready": 2, "done": 3, "holiday": 4 }
            : { "ready": 1, "pending": 2, "done": 3, "holiday": 4 };
        return rank[a.status] - rank[b.status];
    });

    filtered.forEach((s) => {
        const total = Number(s.pk) + Number(s.pb) + Number(s.tendik);
        const infoWaktu = `
            <div style="font-size:10px; color:#64748b; margin-top:5px; display:flex; gap:10px">
                ${s.waktuReady ? `<span>🕒 SIAP: ${s.waktuReady}</span>` : ''}
                ${s.waktuDone ? `<span>✅ SELESAI: ${s.waktuDone}</span>` : ''}
            </div>`;

        let actionBtn = '';
        if(currentRole === 'admin') {
            actionBtn = `<div class="btn-group">
                <button class="btn-mini" onclick="openFormEditById('${s.id}')">EDIT</button>
                <button class="btn-mini" style="color:var(--danger)" onclick="askDelete('${s.id}')">HAPUS</button>
            </div>`;
        } else if(currentRole === 'pemorsian') {
            if (s.status === 'done') actionBtn = '<div class="done-wrapper"><span class="done-text">✓ SUDAH TERKIRIM</span></div>';
            else {
                const isReady = s.status === 'ready';
                actionBtn = `<button class="btn-action" style="background:${isReady?'#f1f5f9':'var(--primary)'}; color:${isReady?'#64748b':'white'}" onclick="updateStatusDirect('${s.id}', '${isReady?'pending':'ready'}')">${isReady?'BATAL SIAP':'SIAP KIRIM'}</button>`;
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
                <span class="badge ${s.mobil==='Mobil 1'?'badge-m1':'badge-m2'}">${s.mobil}</span>
                <span class="badge badge-status-${s.status}">${s.status.toUpperCase()}</span>
            </div>
            <b style="font-size:16px;">${s.nama}</b>
            ${infoWaktu}
            <div class="porsi-box">
                <div class="porsi-item item-pk">PK: ${s.pk}<span class="ikat-text">${getIkat(s.pk)}</span></div>
                <div class="porsi-item item-pb">PB: ${s.pb}<span class="ikat-text">${getIkat(s.pb)}</span></div>
                <div class="porsi-item item-td">TD: ${s.tendik}<span class="ikat-text">${getIkat(s.tendik)}</span></div>
                <div class="porsi-item item-total" style="border-top:1px solid #eee; margin-top:5px; padding-top:5px">
                    <b>TOTAL: ${total} PENERIMA</b>
                </div>
            </div>
            ${actionBtn}
        </div>`;

    });
};

// --- ACTIONS ---
window.updateStatusDirect = async (id, newStatus) => {
    window.showLoading(true, "Memproses...");
    const skrg = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const updates = { status: newStatus };
    
    if (newStatus === 'ready') updates.waktuReady = skrg;
    else if (newStatus === 'done') updates.waktuDone = skrg;
    else if (newStatus === 'pending') { updates.waktuReady = null; updates.waktuDone = null; }

    try {
        await update(ref(db, 'schools/' + id), updates);
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

    // Ambil data lama jika sedang mode EDIT
    const existingSchool = isEdit ? schools.find(x => x.id === id) : null;

    const data = {
        id: id, 
        nama: n.toUpperCase(), 
        mobil: selectedMobil,
        pk: parseInt(document.getElementById('in-pk').value)||0, 
        pb: parseInt(document.getElementById('in-pb').value)||0, 
        tendik: parseInt(document.getElementById('in-td').value)||0,
        status: isEdit ? existingSchool.status : "pending",
        
        // JIKA EDIT: Pertahankan waktu lama agar tidak hilang
        // JIKA BARU: Set jadi null (supaya tidak muncul di tampilan)
        waktuReady: isEdit ? (existingSchool.waktuReady || null) : null,
        waktuDone: isEdit ? (existingSchool.waktuDone || null) : null
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

window["navigate"] = (role) => {
    currentRole = role;
    document.getElementById('page-home').style.display='none';
    document.getElementById('page-app').style.display='block';
    const titles = { admin: "ADMIN", pemorsian: "PEMORSIAN", mobil1: "MOBIL 1", mobil2: "MOBIL 2" };
    document.getElementById('app-title').innerText = titles[role] || role.toUpperCase();
    document.getElementById('btn-add-wrapper').style.display = (role === 'admin') ? 'flex' : 'none';
    document.getElementById('filter-wrapper').style.display = (role === 'admin' || role === 'pemorsian') ? 'flex' : 'none';
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
    window.addEventListener('popstate', () => {
        if (currentRole !== "") {
            history.pushState({ page: 'app' }, ''); 
            window.askExit(); 
        }
    });
    const searchInput = document.getElementById('app-search');
    if (searchInput) searchInput.addEventListener('input', () => window.renderApp());
    const savedRole = localStorage.getItem('userRole');
    if(savedRole) window["navigate"](savedRole);
};
