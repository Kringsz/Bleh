<?php
require_once 'koneksi.php';
$result = $conn->query("SELECT id, nama_kelas FROM kelas ORDER BY id ASC");
$kelas = [];
while ($row = $result->fetch_assoc()) { $kelas[] = $row; }
echo json_encode(["success" => true, "data" => $kelas]);
?>