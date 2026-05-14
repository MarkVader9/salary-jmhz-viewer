<?php
/**
 * SALARY KB - Enterprise API Endpoint (MSSQL Verze - Maximální kompatibilita)
 * Handles secure JSON DB reading/writing via PDO SQL Server connection.
 */

// ==========================================
// 🛡️ POLYFILL PRO STARŠÍ VERZE PHP (< 5.4)
// ==========================================
if (!function_exists('http_response_code')) {
    function http_response_code($code = NULL) {
        if ($code !== NULL) {
            $text = 'Status';
            switch ($code) {
                case 200: $text = 'OK'; break;
                case 201: $text = 'Created'; break;
                case 400: $text = 'Bad Request'; break;
                case 403: $text = 'Forbidden'; break;
                case 500: $text = 'Internal Server Error'; break;
            }
            header($_SERVER['SERVER_PROTOCOL'] . ' ' . $code . ' ' . $text);
        }
        return $code;
    }
}

// Ochrana konstanty pro starší PHP (< 5.4)
$JSON_FLAGS = defined('JSON_UNESCAPED_UNICODE') ? JSON_UNESCAPED_UNICODE : 0;

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==========================================
// 🔐 KONFIGURACE
// ==========================================
$ADMIN_TOKEN = "SuperTajneHesloSalary2026";

$DB_HOST = 'localhost'; // Někdy to bývá např. sql.vas-hosting.cz
$DB_NAME = 'salary2.dbaserver.net';
$DB_USER = 'salary2';
$DB_PASS = 'g6XgFse4';

// ==========================================
// 🚀 PŘIPOJENÍ K DATABÁZI (AUTO-DETEKCE OVLADAČE)
// ==========================================

// 1. Kontrola, zda vůbec existuje PDO
if (!class_exists('PDO')) {
    http_response_code(500);
    echo json_encode(["error" => "Kritická chyba: PHP rozšíření PDO není na hostingu aktivní."]);
    exit;
}

// 2. Detekce dostupného MSSQL ovladače
$available_drivers = PDO::getAvailableDrivers();
$dsn = "";

if (in_array('sqlsrv', $available_drivers)) {
    // Oficiální Microsoft ovladač (často na Windows serverech)
    $dsn = "sqlsrv:Server=$DB_HOST;Database=$DB_NAME";
} elseif (in_array('dblib', $available_drivers)) {
    // Open-source FreeTDS ovladač (často na Linux hostinzích)
    $dsn = "dblib:host=$DB_HOST;dbname=$DB_NAME;charset=UTF-8";
} else {
    // Ovladač chybí
    http_response_code(500);
    echo json_encode(["error" => "Kritická chyba: Chybí PDO ovladač pro MSSQL (sqlsrv nebo dblib). Zkontaktujte podporu hostingu."]);
    exit;
}

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Kritická chyba: Nelze se připojit k MSSQL databázi. Zkontrolujte údaje."]);
    exit;
}

// ==========================================
// 🟢 GET: Rychlé a bezpečné čtení z MSSQL
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT json_payload FROM salary_kb_storage WHERE id = 1");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row && !empty($row['json_payload'])) {
            echo $row['json_payload'];
        } else {
            echo json_encode(["categories" => array(), "articles" => array()]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Chyba při čtení z databáze."]);
    }
    exit;
}

// ==========================================
// 🔴 POST: Validovaný zápis do MSSQL
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $request = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Neplatný JSON formát."]);
        exit;
    }

    if (!isset($request['token']) || $request['token'] !== $ADMIN_TOKEN) {
        http_response_code(403);
        echo json_encode(["error" => "Neplatný autorizační token!"]);
        exit;
    }

    if (isset($request['dbData'])) {
        $jsonString = json_encode($request['dbData'], $JSON_FLAGS);
        
        try {
            // Logika pro MSSQL: Zkusíme updatovat. Pokud nebyl ovlivněn žádný řádek (tabulka je prázdná), vložíme ho.
            $sql = "
                UPDATE salary_kb_storage SET json_payload = :data_update WHERE id = 1;
                IF @@ROWCOUNT = 0
                    INSERT INTO salary_kb_storage (id, json_payload) VALUES (1, :data);
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array(
                ':data' => $jsonString,
                ':data_update' => $jsonString
            ));

            echo json_encode(array("success" => true, "message" => "Úspěšně uloženo do MSSQL databáze."));
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(array("error" => "Kritická chyba při zápisu do MSSQL."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("error" => "Chybí payload data (dbData)."));
    }
    exit;
}
?>