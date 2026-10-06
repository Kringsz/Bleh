/* ==========================================================
   PORTAL GURU — Absen Online (SIMULASI, belum ada backend)
   Data siswa Kelas 1 di bawah ini ASLI (dari file yang diupload).
   Data guru & kelas lain masih generik/kosong karena datanya
   belum dikasih -- SENGAJA tidak diisi nama karangan.

   Fungsi loadSiswa() & simpanAbsensi() ini yang nanti diganti
   isinya buat manggil Supabase, tanpa ubah HTML/CSS sama sekali.
   ========================================================== */

// ---------- Akun simulasi ----------
// Password ditulis polos di sini cuma buat tahap simulasi lokal.
// Begitu masuk tahap Supabase, ini WAJIB diganti -- password
// gak boleh pernah ada di kode JS yang bisa dibaca browser.
const AKUN = {
  "guru1@sekolah.sim": { password: "guru123", nama: "Guru Kelas 1", role: "guru", kelasId: "1" },
  "kepsek@sekolah.sim": { password: "kepsek123", nama: "Kepala Sekolah", role: "admin", kelasId: null },
};

// ---------- Data siswa per kelas ----------
// Kelas 1: data asli. Kelas 2 & 3: sengaja dikosongkan (bukan 0
// siswa fiktif) karena datanya belum ada -- ditampilkan sebagai
// empty state yang jujur, bukan dikarang.
const DATA_KELAS = {
  "1": {
    nama: "Kelas 1",
    siswa: [
    { nama: "ADEEVA NAURA RANIYAH", nisn: "3195590209" },
    { nama: "AHMAD DAFFIN HAAZIQ ALWI", nisn: "3209694037" },
    { nama: "AHMAD RAMADHAN AL AYYUBI", nisn: "3198574260" },
    { nama: "AIRA SHIRLY ALNAIRA", nisn: "3207976385" },
    { nama: "ALFATHUNISSA AURIS", nisn: "3191581660" },
    { nama: "ALVINO DIRGANTARA ZAFRAN", nisn: "3196869267" },
    { nama: "AZRIKA SAKHI JOVITA", nisn: "3196868412" },
    { nama: "AZRIL RIZKI SISWANTO", nisn: "3199630466" },
    { nama: "DANIEL FAHREZA ALZAM", nisn: "3183765570" },
    { nama: "DANISH UWAIS AL QORNI", nisn: "3200601634" },
    { nama: "DEVAN SYAHREZA", nisn: "3190299154" },
    { nama: "DHELISA PUTRI ANASTASYA", nisn: "3196341563" },
    { nama: "HUMAIRA ARCHIMEDA NAUTICA", nisn: "3195288928" },
    { nama: "INTAN DWI RIZQIYAH PERMATASARI", nisn: "3196677452" },
    { nama: "KAIVAN JAGAD SULAIMAN", nisn: "3192530276" },
    { nama: "KAYLA OKALINA SYAKIRA", nisn: "3190191376" },
    { nama: "KEVIN NOVAL ARIYANTA", nisn: "3194629944" },
    { nama: "KHAYLA AZZAHRA HARTINI", nisn: "3203183486" },
    { nama: "M. FITHRON AQIIL AL-FATH", nisn: "3191775671" },
    { nama: "M. GALIH DWI SANJOYO", nisn: "3194912619" },
    { nama: "MAHESWARA JATMIKO ANGGARA", nisn: "3199372786" },
    { nama: "MAIZA RAISYA AL MUNIFAH", nisn: "3204508413" },
    { nama: "MIFTAHUL KHOIR", nisn: "3197659776" },
    { nama: "MUHAMMAD ABIMANYU AL AYYUBI", nisn: "3190222480" },
    { nama: "MUHAMMAD BILAL RAHMAN SANTOSO", nisn: "3191497098" },
    { nama: "MUHAMMAD DEVANO ARIFIN", nisn: "3198616404" },
    { nama: "MUHAMMAD DZEYVAN AL THARIZQY", nisn: "3196459460" },
    { nama: "MUHAMMAD FATHAN AL-AHZAFANI MULYA", nisn: "3198639676" },
    { nama: "MUHAMMAD GIBRAN PRATAMA", nisn: "3208690347" },
    { nama: "MUHAMMAD IBRAHIM LATHIEF", nisn: "3200427763" },
    { nama: "MUHAMMAD JORDAN SHAQUILE BAYAN", nisn: "3190908591" },
    { nama: "MUKHAMMAD ADAM RAZKA PRATAMA", nisn: "3193494331" },
    { nama: "NAZRIEL RAFIANSYAH", nisn: "3193892477" },
    { nama: "RANIA DINDA KHUMAIRA", nisn: "3199782107" },
    { nama: "RAZKA AQIL AZZHAFRAN", nisn: "3196285647" },
    { nama: "SYERLI ALESHA PUTRI", nisn: null },
    { nama: "ZIYA ZHAFIRAH", nisn: "3194802830" }
  ],
  },
  "2": { nama: "Kelas 2", siswa: [] },
  "3": { nama: "Kelas 3", siswa: [] },
};

let userAktif = null;
let statusSiswa = {}; // { "nama siswa": "hadir" | "izin" | "sakit" | "alpa" | null }

// Riwayat absensi yang udah "disimpan" selama tab ini kebuka.
// Key: "kelasId_tanggal", jadi nyimpen ulang tanggal yang sama
// bakal nimpa, bukan numpuk dobel.
//
// Bentuk satu entri:
// {
//   kelasId, kelasNama, tanggal, dicatatOleh,
//   detail: [ { nama, status }, ... ]   // urut sesuai nomor absen
// }
//
// PENTING: ini cuma variabel JS biasa -- hilang total begitu tab
// ditutup/refresh. Ini yang bikin fitur ini statusnya "simulasi".
let riwayatAbsensi = {};

// Label tampilan buat tiap status (dipakai badge di rincian rekap).
const STATUS_LABEL = { hadir: "Hadir", izin: "Izin", sakit: "Sakit", alpa: "Alpa" };

// Pesan kalau satu tanggal gak punya siswa yang cocok sama filter aktif.
const PESAN_KOSONG = {
  absen: "Semua siswa hadir.",
  izin: "Tidak ada yang izin.",
  sakit: "Tidak ada yang sakit.",
  alpa: "Tidak ada yang alpa.",
};

// Terima ARRAY status (["hadir", "izin", ...]), bukan objek. Dengan begitu
// fungsi ini bisa dipakai dari dua sumber: form yang lagi diedit
// (Object.values(statusSiswa)) dan riwayat yang udah tersimpan
// (detail.map((d) => d.status)).
function hitungStatus(daftarStatus) {
  const hitung = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  daftarStatus.forEach((s) => {
    if (s) hitung[s]++;
  });
  return hitung;
}

function el(id) {
  return document.getElementById(id);
}

// Tanggal hari ini format "YYYY-MM-DD" menurut zona waktu PERANGKAT.
// Jangan pakai new Date().toISOString(): itu selalu UTC, jadi di WIB
// (UTC+7) sebelum jam 07.00 hasilnya masih tanggal kemarin -- pas jam
// guru biasanya absen pagi. Getter lokal (getFullYear/getMonth/getDate)
// ngikutin zona waktu perangkat. getMonth() mulai dari 0, makanya +1.
function tanggalHariIni() {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

// Nama siswa bakal masuk lewat innerHTML. Datanya sekarang statis dan
// aman, tapi begitu datang dari database, teks apa pun bisa masuk --
// jadi karakter HTML di-escape dulu biar gak dieksekusi browser.
function escapeHtml(teks) {
  return String(teks).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function login(event) {
  event.preventDefault();
  const email = el("login-email").value.trim().toLowerCase();
  const password = el("login-password").value;
  const errorBox = el("login-error");

  const akun = AKUN[email];

  if (!akun || akun.password !== password) {
    errorBox.textContent = "Email atau kata sandi salah.";
    errorBox.classList.add("is-visible");
    return;
  }

  errorBox.classList.remove("is-visible");
  userAktif = akun;

  el("guru-name").textContent = akun.nama;
  el("screen-login").style.display = "none";
  el("screen-absen").style.display = "flex";

  setupPilihKelas();
  loadSiswa();
}

function logout() {
  userAktif = null;
  el("screen-absen").style.display = "none";
  el("screen-login").style.display = "flex";
  el("login-password").value = "";
}

function setupPilihKelas() {
  const select = el("pilih-kelas");
  const wrapper = select.closest(".field");

  wrapper.style.display = "block";
  select.innerHTML = Object.entries(DATA_KELAS)
    .map(([id, k]) => `<option value="${id}">${k.nama}</option>`)
    .join("");

  // Default to user's assigned class (guru) or Class 1 (admin)
  select.value = userAktif.role === "guru" ? userAktif.kelasId : "1";
  select.disabled = false;
}

function kelasAktifId() {
  return userAktif.role === "guru" ? userAktif.kelasId : el("pilih-kelas").value;
}

function loadSiswa() {
  const kelasId = kelasAktifId();
  const kelas = DATA_KELAS[kelasId];
  const list = el("siswa-list");
  list.innerHTML = "";
  statusSiswa = {};

  el("nama-kelas-aktif").textContent = kelas.nama;

  if (kelas.siswa.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>Data siswa ${kelas.nama} belum diinput ke sistem.</p>
      </div>`;
    updateSummary();
    return;
  }

  kelas.siswa.forEach((s, i) => {
    statusSiswa[s.nama] = "hadir";

    const row = document.createElement("div");
    row.className = "siswa-row";
    row.innerHTML = `
      <div>
        <p class="siswa-row__no">No. ${i + 1}</p>
        <p class="siswa-row__name">${s.nama}</p>
        <p class="siswa-row__nisn">${s.nisn ? "NISN " + s.nisn : "NISN belum terdaftar"}</p>
      </div>
      <div class="status-group" data-nama="${s.nama.replace(/"/g, "&quot;")}">
        <button type="button" class="status-btn is-active" data-status="hadir">Hadir</button>
        <button type="button" class="status-btn" data-status="izin">Izin</button>
        <button type="button" class="status-btn" data-status="sakit">Sakit</button>
        <button type="button" class="status-btn" data-status="alpa">Alpa</button>
      </div>
    `;
    list.appendChild(row);
  });

  updateSummary();
}

function handleStatusClick(event) {
  const btn = event.target.closest(".status-btn");
  if (!btn) return;

  const group = btn.closest(".status-group");
  const nama = group.dataset.nama;
  const status = btn.dataset.status;

  statusSiswa[nama] = status;

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
    total === 0 ? "Belum ada data siswa" : `${total} siswa, default semua Hadir`;
}

function simpanAbsensi() {
  const kelasId = kelasAktifId();
  const kelas = DATA_KELAS[kelasId];
  const tanggal = el("pilih-tanggal").value;

  if (kelas.siswa.length === 0) {
    showToast("Gak ada data siswa buat disimpan.");
    return;
  }

  // Key gabungan kelas+tanggal -- simpan ulang tanggal yang sama
  // bakal NIMPA data lama, bukan bikin entri dobel. Ini juga
  // sekaligus nyimulasiin perilaku yang nanti dipakai di
  // Supabase (upsert), bukan insert asal tambah terus.
  const key = `${kelasId}_${tanggal}`;

  // Simpan status PER SISWA, bukan cuma angka total. Urutan array
  // ngikutin kelas.siswa, jadi nomor di rekap sama persis kayak di form.
  // Angka ringkasan (Hadir: 4, dst) sengaja gak disimpan: dihitung
  // ulang dari detail ini pas rekap dirender, biar cuma ada satu
  // sumber data dan angka gak bisa beda sama daftar rinciannya.
  //
  // Tiap siswa dibikin objek BARU (snapshot), bukan nyimpen statusSiswa
  // langsung. statusSiswa masih terus berubah tiap tombol diklik, jadi
  // kalau disimpan mentah-mentah, riwayat lama ikut berubah diam-diam.
  const detail = kelas.siswa.map((s) => ({
    nama: s.nama,
    status: statusSiswa[s.nama],
  }));

  riwayatAbsensi[key] = {
    kelasId,
    kelasNama: kelas.nama,
    tanggal,
    dicatatOleh: userAktif.nama,
    detail,
  };

  console.log("Data absensi (simulasi, belum tersimpan permanen):", riwayatAbsensi[key]);
  showToast(`Absensi ${kelas.nama} tercatat (simulasi, belum kesambung database).`);
}

// Filter rekap. Nilainya salah satu dari:
//   "semua" | "absen" (izin+sakit+alpa) | "izin" | "sakit" | "alpa"
// Yang nyembunyiin baris siswa itu CSS (lihat data-filter di absen.css),
// JS cuma nyimpen pilihan + nempelin ke #rekap-list, jadi gak perlu
// render ulang HTML tiap tombol filter diklik.
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

  // Rincian itu <details> yang default-nya TERTUTUP. Kalau filter nyala
  // tapi kartunya masih tertutup, gak ada satu nama pun yang muncul dan
  // kelihatannya filter-nya mati. Jadi: pilih filter = buka semua rincian
  // biar hasilnya langsung kelihatan; balik ke "Semua" = tutup lagi.
  el("rekap-list").querySelectorAll("details.rekap-detail").forEach((d) => {
    d.open = nilai !== "semua";
  });
}

function bukaRekap() {
  rekapFilter = "semua"; // tiap buka rekap mulai dari tampilan lengkap
  renderRekap();
  el("screen-absen").style.display = "none";
  el("screen-rekap").style.display = "flex";
}

function tutupRekap() {
  el("screen-rekap").style.display = "none";
  el("screen-absen").style.display = "flex";
}

function renderRekap() {
  const list = el("rekap-list");

  // Guru cuma liat riwayat kelasnya sendiri. Admin liat semua.
  const entries = Object.values(riwayatAbsensi).filter(
    (r) => userAktif.role === "admin" || r.kelasId === userAktif.kelasId
  );

  // Filter cuma masuk akal kalau ada data yang bisa difilter.
  el("rekap-filter").hidden = entries.length === 0;
  terapkanFilterRekap();

  if (entries.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>Belum ada absensi yang disimpan di sesi ini. Coba isi dan simpan
        absensi dulu di layar sebelumnya.</p>
      </div>`;
    return;
  }

  // Kelompokkan per kelas dulu (urutan ngikutin DATA_KELAS), baru per
  // tanggal di dalamnya (terbaru duluan). Kelas yang belum punya absensi
  // tersimpan gak ditampilin, biar gak muncul heading kosong.
  list.innerHTML = Object.entries(DATA_KELAS)
    .map(([kelasId, kelas]) => {
      const perTanggal = entries
        .filter((r) => r.kelasId === kelasId)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

      if (perTanggal.length === 0) return "";

      return `
        <section class="rekap-kelas">
          <div class="rekap-kelas__head">
            <h2 class="rekap-kelas__title">${escapeHtml(kelas.nama)}</h2>
            <span class="rekap-kelas__count">${perTanggal.length} hari tercatat</span>
          </div>
          <div class="rekap-kelas__list">
            ${perTanggal.map(renderKartuRekap).join("")}
          </div>
        </section>`;
    })
    .join("");
}

// Satu kartu = satu tanggal di satu kelas. Ringkasan angka kelihatan
// langsung; rincian per siswa nyembunyi di <details> (native browser,
// jadi buka/tutupnya gak butuh JS tambahan dan bisa lewat keyboard).
function renderKartuRekap(r) {
  const tanggalFormat = new Date(r.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Angka dihitung dari detail, bukan dibaca dari field terpisah.
  const rekap = hitungStatus(r.detail.map((d) => d.status));

  const barisSiswa = r.detail
    .map(
      (d, i) => `
          <li class="rekap-siswa__row" data-status="${d.status}">
            <span class="siswa-row__no">${i + 1}</span>
            <span class="siswa-row__name">${escapeHtml(d.nama)}</span>
            <span class="status-badge" data-status="${d.status}">${STATUS_LABEL[d.status]}</span>
          </li>`
    )
    .join("");

  // Kalau di satu tanggal gak ada siswa yang cocok sama filter (misal filter
  // "Izin" tapi hari itu gak ada yang izin), daftarnya bakal kosong. Daripada
  // kosong tanpa penjelasan, tiap kategori yang jumlahnya 0 dapat satu baris
  // pesan. CSS yang nentuin kapan kelihatan: cuma saat filter kategori itu nyala.
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
            <span class="rekap-card__tanggal">${tanggalFormat}</span>
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
