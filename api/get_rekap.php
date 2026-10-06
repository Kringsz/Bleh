<?php
require_once 'koneksi.php';
$kelas_id = $_GET['kelas_id'] ?? '';

$sql = "SELECT a.tanggal, k.nama_kelas, s.nama_lengkap, a.status 
        FROM absensi a 
        JOIN siswa s ON a.siswa_id = s.id 
        JOIN kelas k ON a.kelas_id = k.id ";

if (!empty($kelas_id)) {
    $sql .= "WHERE a.kelas_id = " . intval($kelas_id) . " ";
}
$sql .= "ORDER BY a.tanggal DESC, s.nama_lengkap ASC";

$result = $conn->query($sql);
$grouped = [];

while ($row = $result->fetch_assoc()) {
    $key = $row['nama_kelas'] . '_' . $row['tanggal'];
    if (!isset($grouped[$key])) {
        $grouped[$key] = [
            'nama_kelas' => $row['nama_kelas'],
            'tanggal' => $row['tanggal'],
            'detail' => []
        ];
    }
    $grouped[$key]['detail'][] = [
        'nama_lengkap' => $row['nama_lengkap'],
        'status' => $row['status']
    ];
}

echo json_encode(["success" => true, "data" => array_values($grouped)]);
?>