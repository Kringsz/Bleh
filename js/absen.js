/* ==========================================================
   PORTAL GURU — Absen Online (Terhubung ke PHP & MySQL XAMPP)
   ========================================================== */

let userAktif = null;
let DATA_KELAS = {}; // Diisi dari API MySQL
let statusSiswa = {}; // { "id_siswa": "hadir" | "izin" | "sakit" | "alpa" }

const STATUS_LABEL = { hadir: "Hadir", izin: "Izin", sakit: "Sakit", alpa: "Alpa" };

const PESAN_KOSONG = {
  absen: "Semua siswa hadir.",
  izin: "Tidak ada yang izin.",
  sakit: "Tidak ada yang sakit.",
  alpa: "Tidak ada yang alpa.",
};

function hitungStatus(daftarStatus) {
  const hitung = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  daftarStatus.forEach((s) => {
    if (s && hitung[s] !== undefined) hitung[s]++;
  });
  return hitung;
}

function el(id) {
  return document.getElementById(id);
}

function tanggalHariIni() {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

function escapeHtml(teks) {
  return String(teks || '').replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// ---------- 1. LOGIN VIA PHP ----------
async function login(event) {
  event.preventDefault();
  const email = el("login-email").value.trim().toLowerCase();
  const password = el("login-password").value;
  const errorBox = el("login-error");

  try {
    const res = await fetch("api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const result = await res.json();

    if (!result.success) {
      errorBox.textContent = result.message || "Email atau kata sandi salah.";
      errorBox.classList.add("is-visible");
      return;
    }

    errorBox.classList.remove("is-visible");
    userAktif = result.data; // { id, nama_lengkap, email, role, kelas_id }

    el("guru-name").textContent = userAktif.nama_lengkap;
    el("screen-login").style.display = "none";
    el("screen-absen").style.display = "flex";

    await loadDaftarKelas();
    setupPilihKelas();
    await loadSiswa();

  } catch (err) {
    errorBox.textContent = "Gagal terhubung ke server PHP/MySQL.";
    errorBox.classList.add("is-visible");
  }
}

function logout() {
  userAktif = null;
  el("screen-absen").style.display = "none";
  el("screen-login").style.display = "flex";
  el("login-password").value = "";
}

// ---------- 2. AMBIL MASTER KELAS ----------
async function loadDaftarKelas() {
  try {
    const res = await fetch("api/get_kelas.php");
    const result = await res.json();
    if (result.success) {
      DATA_KELAS = {};
      result.data.forEach(k => {
        DATA_KELAS[k.id] = k.nama_kelas;
      });
    }
  } catch (e) {
    console.error("Gagal memuat kelas:", e);
  }
}

function setupPilihKelas() {
  const select = el("pilih-kelas");
  const wrapper = select.closest(".field");

  select.innerHTML = Object.entries(DATA_KELAS)
    .map(([id, nama]) => `<option value="${id}">${nama}</option>`)
    .join("");

  if (userAktif.role === "guru" && userAktif.kelas_id) {
    wrapper.style.display = "none";
    select.value = userAktif.kelas_id;
  } else {
    wrapper.style.display = "block";
    select.value = userAktif.kelas_id || "1";
  }
}

function kelasAktifId() {
  return (userAktif.role === "guru" && userAktif.kelas_id) 
    ? userAktif.kelas_id 
    : el("pilih-kelas").value;
}

// ---------- 3. AMBIL DATA SISWA DARI MYSQL ----------
async function loadSiswa() {
  const kelasId = kelasAktifId();
  const namaKelas = DATA_KELAS[kelasId] || "Kelas";
  const tanggal = el("pilih-tanggal").value;
  const list = el("siswa-list");
  
  list.innerHTML = `<div class="empty-state"><p>Memuat data siswa...</p></div>`;
  statusSiswa = {};

  el("nama-kelas-aktif").textContent = namaKelas;

  try {
    const res = await fetch(`api/get_siswa.php?kelas_id=${kelasId}&tanggal=${tanggal}`);
    const result = await res.json();

    if (!result.success || result.data.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <p>Data siswa ${namaKelas} belum diinput ke database.</p>
        </div>`;
      updateSummary();
      return;
    }

    list.innerHTML = "";
    result.data.forEach((s, i) => {
      // Ambil status absensi jika sudah ada di database, jika belum default: "hadir"
      const statusAwal = s.status_absensi || "hadir";
      statusSiswa[s.id] = statusAwal;

      const row = document.createElement("div");
      row.className = "siswa-row";
      row.innerHTML = `
        <div>
          <p class="siswa-row__no">No. ${i + 1}</p>
          <p class="siswa-row__name">${escapeHtml(s.nama_lengkap)}</p>
          <p class="siswa-row__nisn">${s.nisn ? "NISN " + escapeHtml(s.nisn) : "NISN belum terdaftar"}</p>
        </div>
        <div class="status-group" data-id="${s.id}">
          <button type="button" class="status-btn ${statusAwal === 'hadir' ? 'is-active' : ''}" data-status="hadir">Hadir</button>
          <button type="button" class="status-btn ${statusAwal === 'izin' ? 'is-active' : ''}" data-status="izin">Izin</button>
          <button type="button" class="status-btn ${statusAwal === 'sakit' ? 'is-active' : ''}" data-status="sakit">Sakit</button>
          <button type="button" class="status-btn ${statusAwal === 'alpa' ? 'is-active' : ''}" data-status="alpa">Alpa</button>
        </div>
      `;
      list.appendChild(row);
    });

    updateSummary();

  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>Gagal memuat data siswa dari server.</p></div>`;
  }
}

function handleStatusClick(event) {
  const btn = event.target.closest(".status-btn");
  if (!btn) return;

  const group = btn.closest(".status-group");
  const siswaId = group.dataset.id;
  const status = btn.dataset.status;

  statusSiswa[siswaId] = status;

  group.querySelectorAll(".status-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.status === status);
  });

  updateSummary();
}

function updateSummary() {
  const hitung = hitungStatus(Object.values(statusSiswa));

  el("count-hadir").textContent = hitung.hadir;
  el("count-izin").textContent = hitung.izin;
  el("count-sakit").textContent = hitung.sakit;
  el("count-alpa").textContent = hitung.alpa;

  const total = Object.keys(statusSiswa).length;
  el("progress-text").textContent =
    total === 0 ? "Belum ada data siswa" : `${total} siswa dicatat`;
}

// ---------- 4. SIMPAN ABSENSI KE MYSQL ----------
async function simpanAbsensi() {
  const kelasId = kelasAktifId();
  const tanggal = el("pilih-tanggal").value;

  if (Object.keys(statusSiswa).length === 0) {
    showToast("Tidak ada data siswa untuk disimpan.");
    return;
  }

  const payload = {
    kelas_id: kelasId,
    tanggal: tanggal,
    created_by: userAktif.id,
    absensi: Object.entries(statusSiswa).map(([siswa_id, status]) => ({
      siswa_id: parseInt(siswa_id),
      status: status
    }))
  };

  try {
    const res = await fetch("api/simpan_absen.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      showToast(result.message || "Absensi berhasil disimpan ke database!");
    } else {
      showToast("Gagal menyimpan: " + result.message);
    }
  } catch (err) {
    showToast("Terjadi kesalahan koneksi ke server.");
  }
}

// ---------- 5. REKAPITULASI DARI DATABASE ----------
let rekapFilter = "semua";

function terapkanFilterRekap() {
  el("rekap-list").dataset.filter = rekapFilter;

  el("rekap-filter").querySelectorAll("[data-filter]").forEach((btn) => {
    const aktif = btn.dataset.filter === rekapFilter;
    btn.classList.toggle("is-active", aktif);
    btn.setAttribute("aria-pressed", String(aktif));
  });
}

function pilihFilterRekap(nilai) {
  rekapFilter = nilai;
  terapkanFilterRekap();

  el("rekap-list").querySelectorAll("details.rekap-detail").forEach((d) => {
    d.open = nilai !== "semua";
  });
}

async function bukaRekap() {
  rekapFilter = "semua";
  await renderRekap();
  el("screen-absen").style.display = "none";
  el("screen-rekap").style.display = "flex";
}

function tutupRekap() {
  el("screen-rekap").style.display = "none";
  el("screen-absen").style.display = "flex";
}

async function renderRekap() {
  const list = el("rekap-list");
  list.innerHTML = `<div class="empty-state"><p>Memuat rekapitulasi data...</p></div>`;

  const kelasId = userAktif.role === "guru" ? userAktif.kelas_id : "";

  try {
    const res = await fetch(`api/get_rekap.php?kelas_id=${kelasId}`);
    const result = await res.json();

    if (!result.success || result.data.length === 0) {
      el("rekap-filter").hidden = true;
      list.innerHTML = `
        <div class="empty-state">
          <p>Belum ada data absensi tersimpan di database.</p>
        </div>`;
      return;
    }

    el("rekap-filter").hidden = false;
    terapkanFilterRekap();

    list.innerHTML = result.data.map(renderKartuRekap).join("");

  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>Gagal mengambil data rekap dari database.</p></div>`;
  }
}

function renderKartuRekap(r) {
  const tanggalFormat = new Date(r.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const rekap = hitungStatus(r.detail.map((d) => d.status));

  const barisSiswa = r.detail
    .map(
      (d, i) => `
          <li class="rekap-siswa__row" data-status="${d.status}">
            <span class="siswa-row__no">${i + 1}</span>
            <span class="siswa-row__name">${escapeHtml(d.nama_lengkap)}</span>
            <span class="status-badge" data-status="${d.status}">${STATUS_LABEL[d.status] || d.status}</span>
          </li>`
    )
    .join("");

  const jumlahPerFilter = {
    absen: rekap.izin + rekap.sakit + rekap.alpa,
    izin: rekap.izin,
    sakit: rekap.sakit,
    alpa: rekap.alpa,
  };
  
  const pesanKosong = Object.entries(PESAN_KOSONG)
    .filter(([filter]) => jumlahPerFilter[filter] === 0)
    .map(([filter, teks]) => `
              <li class="rekap-siswa__kosong" data-kosong="${filter}">${teks}</li>`)
    .join("");

  return `
        <div class="rekap-card">
          <div class="rekap-card__head">
            <span class="rekap-card__tanggal">${escapeHtml(r.nama_kelas)} — ${tanggalFormat}</span>
            <span class="rekap-card__meta">${r.detail.length} siswa</span>
          </div>
          <div class="absen-summary">
            <span class="absen-summary__chip" data-status="hadir">Hadir <strong>${rekap.hadir}</strong></span>
            <span class="absen-summary__chip" data-status="izin">Izin <strong>${rekap.izin}</strong></span>
            <span class="absen-summary__chip" data-status="sakit">Sakit <strong>${rekap.sakit}</strong></span>
            <span class="absen-summary__chip" data-status="alpa">Alpa <strong>${rekap.alpa}</strong></span>
          </div>
          <details class="rekap-detail">
            <summary class="rekap-detail__toggle">
              Rincian per siswa
              <svg class="rekap-detail__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </summary>
            <ul class="rekap-siswa">${barisSiswa}${pesanKosong}
            </ul>
          </details>
        </div>`;
}

let toastTimer;
function showToast(pesan) {
  const toast = el("dummy-toast");
  toast.textContent = pesan;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

// ---------- INITIATOR ----------
document.addEventListener("DOMContentLoaded", () => {
  el("login-form").addEventListener("submit", login);
  el("btn-logout").addEventListener("click", logout);
  el("pilih-kelas").addEventListener("change", loadSiswa);
  el("pilih-tanggal").addEventListener("change", loadSiswa);
  el("siswa-list").addEventListener("click", handleStatusClick);
  el("btn-simpan").addEventListener("click", simpanAbsensi);
  el("btn-buka-rekap").addEventListener("click", bukaRekap);
  el("btn-tutup-rekap").addEventListener("click", tutupRekap);
  el("rekap-filter").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-filter]");
    if (btn) pilihFilterRekap(btn.dataset.filter);
  });

  el("pilih-tanggal").value = tanggalHariIni();
});