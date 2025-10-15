<?php
// api/upload.php
// *** NO DEJES ESPACIOS/LINEAS ANTES DEL "<?php" ***

// ===== Config =====
$SECRET = 'MasTecno2025'; // <-- MISMA que VITE_UPLOAD_SECRET
$MAX_SIZE = 5 * 1024 * 1024; // 5MB
$DEST_DIR = __DIR__ . '/../images'; // guarda en /MasTecno/images
$PUBLIC_BASE = 'https://jjpiriz.com.ar/MasTecno/'; // base pública para armar la URL

// ===== CORS =====
// Usamos CORS simple (sin headers custom) -> igual devolvemos ACAO por las dudas
header('Access-Control-Allow-Origin: *'); // si querés, cambialo por tu dominio
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// ===== Helpers =====
function json_out($code, $data) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

function slugify($s) {
  $s = iconv('UTF-8', 'ASCII//TRANSLIT', $s);
  $s = strtolower($s);
  $s = preg_replace('/[^a-z0-9]+/i', '-', $s);
  $s = trim($s, '-');
  return $s ?: 'img';
}

// ===== Auth simple =====
// Token ahora llega por POST (evita preflight). Igual soportamos header viejo como fallback.
$token = $_POST['token'] ?? ($_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? '');
if (!$SECRET || $token !== $SECRET) {
  json_out(401, ['ok' => false, 'error' => 'unauthorized']);
}

// ===== Validaciones básicas =====
if (!isset($_FILES['file'])) {
  json_out(400, ['ok' => false, 'error' => 'missing_file']);
}
$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
  json_out(400, ['ok' => false, 'error' => 'upload_error', 'code' => $file['error']]);
}
if ($file['size'] > $MAX_SIZE) {
  json_out(413, ['ok' => false, 'error' => 'file_too_large']);
}

$slug = isset($_POST['slug']) ? slugify($_POST['slug']) : 'img';

$fi = new finfo(FILEINFO_MIME_TYPE);
$mime = $fi->file($file['tmp_name']) ?: 'application/octet-stream';

// Tipos permitidos
$allowed = [
  'image/jpeg' => 'jpg',
  'image/png'  => 'png',
  'image/webp' => 'webp',
  'image/avif' => 'avif',
];
if (!isset($allowed[$mime])) {
  json_out(415, ['ok' => false, 'error' => 'unsupported_type', 'mime' => $mime]);
}
$ext = $allowed[$mime];

// Asegurar carpeta destino
if (!is_dir($DEST_DIR)) {
  if (!mkdir($DEST_DIR, 0775, true)) {
    json_out(500, ['ok' => false, 'error' => 'mkdir_failed']);
  }
}
if (!is_writable($DEST_DIR)) {
  json_out(500, ['ok' => false, 'error' => 'dest_not_writable']);
}

$destPath = $DEST_DIR . '/' . $slug . '.' . $ext;

// mover archivo
if (!is_uploaded_file($file['tmp_name'])) {
  json_out(400, ['ok' => false, 'error' => 'not_uploaded_file']);
}
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
  json_out(500, ['ok' => false, 'error' => 'move_failed']);
}

// URL pública (respetando /MasTecno/images/…)
$publicUrl = rtrim($PUBLIC_BASE, '/') . '/images/' . $slug . '.' . $ext;

json_out(200, [
  'ok'   => true,
  'url'  => $publicUrl,
  'path' => 'images/' . $slug . '.' . $ext,
]);
