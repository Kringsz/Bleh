<?php
require_once 'koneksi.php';
$data = json_decode(file_get_contents("php://input"), true);

$kelas_id = $data['kelas_id'] ?? 0;
$tanggal  = $data['tanggal'] ?? '';
$absensi  = $data['absensi'] ?? [];

if (!$kelas_id || !$tanggal || empty($absensi)) {
    echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO absensi (siswa_id, kelas_id, tanggal, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)");

foreach ($absensi as $item) {
    $stmt->bind_param("iiss", $item['siswa_id'], $kelas_id, $tanggal, $item['status']);
    $stmt->execute();
}

echo json_encode(["success" => true, "message" => "Absensi berhasil disimpan ke MySQL!"]);
?>