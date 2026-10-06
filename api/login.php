<?php
require_once 'koneksi.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Email dan password wajib diisi"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, nama_lengkap, email, role, kelas_id FROM users WHERE email = ? AND password = ?");
$stmt->bind_param("ss", $email, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    echo json_encode([
        "success" => true,
        "message" => "Login berhasil",
        "data" => $user
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Email atau password salah"]);
}
?>