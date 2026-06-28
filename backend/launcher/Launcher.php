<?php
/**
 * Wakingdream Launcher Backend
 *
 * Lives at: fusioncms/application/modules/launcher/controllers/Launcher.php
 * URL prefix: /api/launcher/*
 */
class Launcher extends MX_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->database();
    }

    /* ---------- /api/launcher/manifest ---------- */
    public function manifest()
    {
        header('Content-Type: application/json');
        header('Cache-Control: public, max-age=60');

        // Static delegate: serve the manifest that's hosted on patches.wakingdream.cc.
        // In the future this can be computed from DB (per-version, per-OS, etc).
        $manifest = [
            'version'           => date('Y.m.d-Hi'),
            'generated_at'      => gmdate('c'),
            'min_client_build'  => 12340,
            'realm_address'     => 'wakingdream.cc',
            'realm_port'        => 8085,
            'patches'           => [],
            'patch_notes_url'   => 'https://wakingdream.cc/api/launcher/news',
        ];
        echo json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    }

    /* ---------- /api/launcher/status ---------- */
    public function status()
    {
        header('Content-Type: application/json');
        header('Cache-Control: public, max-age=30');

        // Pull online real-player count from auth DB.
        $online = $this->db->query(
            "SELECT COUNT(*) AS n FROM acore_characters.characters c
             JOIN acore_auth.account a ON a.id = c.account
             WHERE c.online > 0 AND a.username NOT LIKE 'rndbot%'"
        )->row()->n ?? 0;

        // Active boss events
        $bosses = $this->db->query(
            "SELECT eventEntry, description, length, start_time
             FROM acore_world.game_event
             WHERE eventEntry BETWEEN 200 AND 221
             AND NOW() BETWEEN start_time AND DATE_ADD(start_time, INTERVAL length MINUTE)"
        )->result_array();

        echo json_encode([
            'server_online'        => true,
            'real_players_online'  => (int)$online,
            'active_world_bosses'  => $bosses,
            'next_reroll'          => 'Wed 07:00 UTC',
        ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    }

    /* ---------- /api/launcher/news ---------- */
    public function news()
    {
        header('Content-Type: application/json');
        header('Cache-Control: public, max-age=300');

        // Pull recent news/articles from cms_bug or news table — TBD wire to actual feed.
        $rows = $this->db->query("SELECT id, title, description, created_at FROM cms_bug ORDER BY id DESC LIMIT 10")->result_array();
        echo json_encode($rows, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    }

    /* ---------- POST /api/launcher/register ---------- */
    public function register()
    {
        header('Content-Type: application/json');
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        $email    = trim($input['email'] ?? '');

        // Basic validation
        if (strlen($username) < 4 || strlen($username) > 16) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'username must be 4-16 chars']); return;
        }
        if (strlen($password) < 8) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'password must be ≥8 chars']); return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'invalid email']); return;
        }

        // Check existence
        $existing = $this->db->query(
            "SELECT id FROM acore_auth.account WHERE username = ?",
            [strtoupper($username)]
        )->row();
        if ($existing) {
            http_response_code(409);
            echo json_encode(['ok' => false, 'error' => 'username already taken']); return;
        }

        // AC SRP6: shared secret = SHA1(username:password) uppercase. AC uses verifier.
        // Real implementation must compute v = g^x mod N where x = SHA1(salt || h_xor).
        // For brevity: defer to FCMS's existing register-controller helper.
        require_once APPPATH . 'modules/register/models/external_account_model.php';
        $accountModel = new External_account_model();
        $result = $accountModel->createAccount(strtoupper($username), $password, $email);
        if (!$result) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'account creation failed']); return;
        }
        echo json_encode(['ok' => true]);
    }
}
