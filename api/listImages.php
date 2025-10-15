<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Ruta absoluta al directorio de imágenes
$dir = realpath(__DIR__ . '/../images');

// URL base fija sin ../
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
  . '://' . $_SERVER['HTTP_HOST'] . '/MasTecno/images/';

$files = array_values(array_filter(scandir($dir), function($f) use ($dir) {
  return preg_match('/\.(jpe?g|png|webp|gif|avif)$/i', $f)
    && is_file("$dir/$f");
}));

$urls = array_map(fn($f) => $baseUrl . rawurlencode($f), $files);

echo json_encode($urls, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
