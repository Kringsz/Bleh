<?php
require_once 'koneksi.php';

$kelas_id = $_GET['kelas_id'] ?? 1;

$stmt = $conn->prepare("SELECT id, nisn, nama_lengkap FROM siswa WHERE kelas_id = ? ORDER BY nama_lengkap ASC");
$stmt->bind_param("i", $kelas_id);
$stmt->execute();
$result = $stmt->get_result();

$siswa = [];
while ($row = $result->fetch_assoc()) {
    $siswa[] = $row;
}

echo json_encode(["success" => true, "data" => $siswa]);
?>