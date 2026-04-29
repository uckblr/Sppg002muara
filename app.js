const DB_URL = "https://script.google.com/macros/s/AKfycbxaUThKB7mGR4YgNJgTaliHGE7EjG5OFJROTA9EoXEYWCKYRlVBjqKUPp-Aw4Vll5hh/exec"; 
const PASSWORDS = { admin: "1111", dapur: "2222", supir1: "3331", supir2: "3332" };

let rawData = JSON.parse(localStorage.getItem("cache_data")) || [];
let role = "pilih", currentMobil = "", searchQuery = "";

async function pullData() {
    try {
        const res = await fetch(DB_URL);
        rawData = await res.json();
        localStorage.setItem("cache_data", JSON.stringify(rawData));
        render();
    } catch (e) { render(); }
}

function askPass(r, m = "") {
    window.targetRole = r;
    window.targetMobil = m;
    document.getElementById("modalOverlay").style.display = "flex";
    document.getElementById("passModal").style.display = "block";
    document.getElementById("passInput").value = "";
    document.getElementById("passInput").focus();
}

document.getElementById("btnConfirmPass").onclick = function() {
    const val = document.getElementById("passInput").value;
    const key = window.targetRole === 'supir' ? (window.targetMobil === 'Mobil 1' ? 'supir1' : 'supir2') : window.targetRole;
    
    if (val === PASSWORDS[key]) {
        role = window.targetRole;
        currentMobil = window.targetMobil;
        closeModal();
        render();
    } else {
        alert("Password Salah!");
    }
};

function render() {
    renderDashboard();
    renderContent();
}

function renderDashboard() {
    const dash = document.getElementById("mainDashboard");
    if (role === "pilih") {
        dash.innerHTML = `<h1>Logistik Control</h1><p>Pilih akses untuk memulai</p>`;
    } else {
        dash.innerHTML = `<h1>Mode ${role.toUpperCase()}</h1><p>${currentMobil || 'Kontrol Sistem'}</p>`;
    }
}

function renderContent() {
    const main = document.getElementById("mainContent");
    if (role === "pilih") {
        main.innerHTML = `
            <div class="role-container">
                <div class="btn-role" onclick="askPass('admin')"><div class="role-icon">💼</div>Admin Kantor</div>
                <div class="btn-role" onclick="askPass('dapur')"><div class="role-icon">🍳</div>Tim Pemorsian</div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 1')"><div class="role-icon">🚚</div>Supir Mobil 1</div>
                <div class="btn-role" onclick="askPass('supir', 'Mobil 2')"><div class="role-icon">🚚</div>Supir Mobil 2</div>
            </div>`;
    } else {
        document.getElementById("bottomNav").style.display = "flex";
        document.getElementById("searchArea").style.display = "block";
        main.innerHTML = `<div style="padding:20px; text-align:center;">Menampilkan data untuk ${role}...</div>`;
    }
}

function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("passModal").style.display = "none";
}

function logout() {
    localStorage.clear();
    location.reload();
}

// Jalankan sistem
render();
pullData();
