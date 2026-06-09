<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(str_replace('/api/', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)), '/');
$input = json_decode(file_get_contents('php://input'), true);

// AUTH
if ($path === 'auth/register' && $method === 'POST') {
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    if (strlen($username) < 3 || strlen($password) < 6) {
        errorResponse('Username min 3 chars, password min 6 chars');
    }
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) errorResponse('Username or email already exists');

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, coins) VALUES (?, ?, ?, 1000)");
    $stmt->execute([$username, $email, $hash]);
    $userId = $pdo->lastInsertId();

    $achievements = [
        ['First Saver', 'Save for the first time', 'piggy-bank', 'bronze', 1],
        ['Week Saver', 'Save 7 days in a row', 'calendar', 'silver', 7],
        ['Goal Getter', 'Reach 50% of a goal', 'target', 'silver', 50],
        ['Money Master', 'Save 100000 total', 'crown', 'gold', 100000],
        ['Shopaholic', 'Buy 5 accessories', 'shopping-bag', 'bronze', 5],
        ['Receipt Pro', 'Scan 10 receipts', 'camera', 'silver', 10],
        ['Diamond Hands', 'Complete 5 targets', 'gem', 'diamond', 5]
    ];
    $stmt = $pdo->prepare("INSERT INTO achievements (user_id, title, description, icon, tier, max_progress) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($achievements as $a) $stmt->execute([$userId, $a[0], $a[1], $a[2], $a[3], $a[4]]);

    $token = generateJWT($userId, $username);
    successResponse(['token' => $token, 'user' => ['id' => $userId, 'username' => $username, 'coins' => 1000, 'rank' => 'Bronze']]);
}

if ($path === 'auth/login' && $method === 'POST') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        errorResponse('Invalid credentials', 401);
    }
    $today = date('Y-m-d');
    $lastActive = $user['last_active'];
    if ($lastActive) {
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        if ($lastActive === $yesterday) {
            $pdo->prepare("UPDATE users SET streak_days = streak_days + 1, last_active = ? WHERE id = ?")->execute([$today, $user['id']]);
        } elseif ($lastActive !== $today) {
            $pdo->prepare("UPDATE users SET streak_days = 1, last_active = ? WHERE id = ?")->execute([$today, $user['id']]);
        }
    } else {
        $pdo->prepare("UPDATE users SET streak_days = 1, last_active = ? WHERE id = ?")->execute([$today, $user['id']]);
    }
    $token = generateJWT($user['id'], $user['username']);
    successResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'], 'username' => $user['username'], 'email' => $user['email'],
            'coins' => (int)$user['coins'], 'rank' => $user['rank'],
            'streak_days' => (int)$user['streak_days'],
            'total_saved' => (float)$user['total_saved'],
            'total_targets_completed' => (int)$user['total_targets_completed']
        ]
    ]);
}

// PROTECTED ROUTES
$user = getAuthUser();
if (!$user && !in_array($path, ['auth/login', 'auth/register'])) {
    errorResponse('Unauthorized', 401);
}
$userId = $user['sub'] ?? null;

if ($path === 'user' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT id, username, email, coins, rank, streak_days, total_saved, total_targets_completed FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    successResponse($stmt->fetch());
}

if ($path === 'dashboard' && $method === 'GET') {

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $userData = $stmt->fetch();

    $stmt = $pdo->prepare("
        SELECT
            t.*,
            a.happiness,
            a.energy,
            a.fullness,
            a.cleanliness,
            a.level,
            a.exp,
            a.mood,
            a.accessories
        FROM users u
        JOIN targets t
            ON u.active_target_id = t.id
        LEFT JOIN avatars a
            ON t.id = a.target_id
        WHERE u.id = ?
    ");

    $stmt->execute([$userId]);
    $activeTarget = $stmt->fetch();

    if (!$activeTarget) {

        $stmt = $pdo->prepare("
            SELECT
                t.*,
                a.happiness,
                a.energy,
                a.fullness,
                a.cleanliness,
                a.level,
                a.exp,
                a.mood,
                a.accessories
            FROM targets t
            LEFT JOIN avatars a
                ON t.id = a.target_id
            WHERE t.user_id = ?
            AND t.status = 'active'
            ORDER BY t.created_at DESC
            LIMIT 1
        ");

        $stmt->execute([$userId]);
        $activeTarget = $stmt->fetch();

        if ($activeTarget) {
            $pdo->prepare("
                UPDATE users
                SET active_target_id = ?
                WHERE id = ?
            ")->execute([$activeTarget['id'], $userId]);
        }
    }

    if ($activeTarget) {
        $activeTarget['progress'] =
            $activeTarget['target_amount'] > 0
            ? round(
                ($activeTarget['current_amount'] /
                $activeTarget['target_amount']) * 100,
                1
            )
            : 0;

        $activeTarget['accessories'] =
            json_decode($activeTarget['accessories'] ?? '[]', true);
    }

    $stmt = $pdo->prepare("
        SELECT t.*, tg.name as target_name
        FROM transactions t
        JOIN targets tg
            ON t.target_id = tg.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$userId]);
    $transactions = $stmt->fetchAll();

    $stmt = $pdo->prepare("
        SELECT *
        FROM achievements
        WHERE user_id = ?
        ORDER BY is_unlocked DESC, created_at DESC
        LIMIT 4
    ");
    $stmt->execute([$userId]);
    $achievements = $stmt->fetchAll();

    $stmt = $pdo->prepare("
        SELECT *
        FROM accessories
        ORDER BY price
        LIMIT 4
    ");
    $stmt->execute();
    $shopPreview = $stmt->fetchAll();

    successResponse([
        'user' => $userData,
        'activeTarget' => $activeTarget,
        'transactions' => $transactions,
        'achievements' => $achievements,
        'shopPreview' => $shopPreview
    ]);
}

if ($path === 'user/active-target' && $method === 'POST') {

    $targetId = intval($input['target_id'] ?? 0);

    if ($targetId <= 0) {
        errorResponse('Invalid target');
    }

    // Verify target belongs to current user
    $stmt = $pdo->prepare("
        SELECT id
        FROM targets
        WHERE id = ?
        AND user_id = ?
    ");
    $stmt->execute([$targetId, $userId]);

    if (!$stmt->fetch()) {
        errorResponse('Target not found');
    }

    $stmt = $pdo->prepare("
        UPDATE users
        SET active_target_id = ?
        WHERE id = ?
    ");

    $stmt->execute([$targetId, $userId]);

    successResponse([
        'active_target_id' => $targetId
    ]);
}


if ($path === 'targets' && $method === 'GET') {
    $status = $_GET['status'] ?? 'active';
    $stmt = $pdo->prepare("SELECT t.*, a.happiness, a.energy, a.fullness, a.cleanliness, a.level, a.mood FROM targets t LEFT JOIN avatars a ON t.id = a.target_id WHERE t.user_id = ? AND t.status = ? ORDER BY t.created_at DESC");
    $stmt->execute([$userId, $status]);
    $targets = $stmt->fetchAll();
    foreach ($targets as &$t) {
        $t['progress'] = $t['target_amount'] > 0 ? round(($t['current_amount'] / $t['target_amount']) * 100, 1) : 0;
        $t['days_left'] = $t['deadline'] ? max(0, (strtotime($t['deadline']) - time()) / 86400) : null;
    }
    successResponse($targets);
}

if ($path === 'targets' && $method === 'POST') {
    $name = trim($input['name'] ?? '');
    $targetAmount = floatval($input['target_amount'] ?? 0);
    if (empty($name) || $targetAmount <= 0) errorResponse('Name and target amount required');

    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO targets (user_id, name, description, target_amount, category, deadline, avatar_type, avatar_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $name, $input['description'] ?? '', $targetAmount, $input['category'] ?? 'General', $input['deadline'] ?? null, $input['avatar_type'] ?? 'dog', trim($input['avatar_name'] ?? 'Mochi')]);
    $targetId = $pdo->lastInsertId();
    $pdo->prepare("INSERT INTO avatars (target_id) VALUES (?)")->execute([$targetId]);
    $pdo->commit();
    successResponse(['target_id' => $targetId], 'Target created');
}

if (preg_match('/^targets\/(\d+)$/', $path, $m) && $method === 'DELETE') {
    $pdo->prepare("DELETE FROM targets WHERE id = ? AND user_id = ?")->execute([$m[1], $userId]);
    successResponse(null, 'Target deleted');
}

if ($path === 'transactions' && $method === 'POST') {
    $targetId = intval($input['target_id'] ?? 0);
    $amount = floatval($input['amount'] ?? 0);
    $type = $input['type'] ?? '';
    if ($targetId <= 0 || $amount <= 0 || !in_array($type, ['deposit', 'withdrawal'])) errorResponse('Invalid data');

    $pdo->beginTransaction();
    $stmt = $pdo->prepare("SELECT * FROM targets WHERE id = ? AND user_id = ?");
    $stmt->execute([$targetId, $userId]);
    $target = $stmt->fetch();
    if (!$target) errorResponse('Target not found');

    $pdo->prepare("INSERT INTO transactions (target_id, user_id, amount, type, note, transaction_date) VALUES (?, ?, ?, ?, ?, ?)")
        ->execute([$targetId, $userId, $amount, $type, $input['note'] ?? '', $input['date'] ?? date('Y-m-d')]);

    if ($type === 'deposit') {
        $newAmount = $target['current_amount'] + $amount;
        $pdo->prepare("UPDATE users SET total_saved = total_saved + ? WHERE id = ?")->execute([$amount, $userId]);
    } else {
        $newAmount = max(0, $target['current_amount'] - $amount);
    }

    $progress = $target['target_amount'] > 0 ? ($newAmount / $target['target_amount']) * 100 : 0;
    $status = $progress >= 100 ? 'completed' : 'active';

    $pdo->prepare("UPDATE targets SET current_amount = ?, status = ? WHERE id = ?")->execute([$newAmount, $status, $targetId]);

    $mood = 'neutral';
    if ($progress >= 100) $mood = 'celebrating';
    elseif ($progress >= 70) $mood = 'happy';
    elseif ($progress >= 40) $mood = 'neutral';
    elseif ($progress > 0) $mood = 'sad';
    else $mood = 'dirty';

    $happiness = min(100, max(0, 50 + ($progress - 50)));
    $pdo->prepare("UPDATE avatars SET mood = ?, happiness = ? WHERE target_id = ?")->execute([$mood, $happiness, $targetId]);

    if ($progress >= 100 && $target['status'] !== 'completed') {
        $coinsEarned = floor($target['target_amount'] / 100);
        $pdo->prepare("UPDATE users SET coins = coins + ?, total_targets_completed = total_targets_completed + 1 WHERE id = ?")->execute([$coinsEarned, $userId]);
        updateRank($pdo, $userId);
    }

    checkAchievements($pdo, $userId);
    $pdo->commit();
    successResponse(['new_amount' => $newAmount, 'progress' => round($progress, 1), 'status' => $status, 'mood' => $mood], 'Transaction recorded');
}

if ($path === 'transactions' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT t.*, tg.name as target_name FROM transactions t JOIN targets tg ON t.target_id = tg.id WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT 50");
    $stmt->execute([$userId]);
    successResponse($stmt->fetchAll());
}

if ($path === 'avatars/care' && $method === 'POST') {
    $targetId = intval($input['target_id'] ?? 0);
    $action = $input['action'] ?? '';
    if (!$targetId || !in_array($action, ['play', 'feed', 'rest', 'shower'])) errorResponse('Invalid care action');

    $stmt = $pdo->prepare("SELECT a.* FROM avatars a JOIN targets t ON a.target_id = t.id WHERE a.target_id = ? AND t.user_id = ?");
    $stmt->execute([$targetId, $userId]);
    $avatar = $stmt->fetch();
    if (!$avatar) errorResponse('Avatar not found');

    $updates = []; $expGain = 10;
    switch ($action) {
        case 'play': $updates['happiness'] = min(100, $avatar['happiness'] + 10); $updates['energy'] = max(0, $avatar['energy'] - 5); break;
        case 'feed': $updates['fullness'] = min(100, $avatar['fullness'] + 10); $updates['energy'] = min(100, $avatar['energy'] + 5); break;
        case 'rest': $updates['energy'] = min(100, $avatar['energy'] + 10); $updates['happiness'] = max(0, $avatar['happiness'] - 2); break;
        case 'shower': $updates['cleanliness'] = min(100, $avatar['cleanliness'] + 10); $updates['happiness'] = min(100, $avatar['happiness'] + 5); break;
    }

    $newExp = $avatar['exp'] + $expGain;
    $newLevel = $avatar['level'];
    if ($newExp >= $avatar['level'] * 100) { $newLevel++; $newExp = 0; }

    $pdo->prepare("UPDATE avatars SET happiness = ?, energy = ?, fullness = ?, cleanliness = ?, exp = ?, level = ? WHERE target_id = ?")
        ->execute([$updates['happiness'] ?? $avatar['happiness'], $updates['energy'] ?? $avatar['energy'], $updates['fullness'] ?? $avatar['fullness'], $updates['cleanliness'] ?? $avatar['cleanliness'], $newExp, $newLevel, $targetId]);
    successResponse(['level' => $newLevel, 'exp' => $newExp, 'stats' => $updates], 'Avatar cared for!');
}

if ($path === 'shop' && $method === 'GET') {
    $category = $_GET['category'] ?? null;
    if ($category) { $stmt = $pdo->prepare("SELECT * FROM accessories WHERE category = ? ORDER BY price"); $stmt->execute([$category]); }
    else { $stmt = $pdo->query("SELECT * FROM accessories ORDER BY price"); }
    $items = $stmt->fetchAll();
    $stmt = $pdo->prepare("SELECT accessory_id FROM inventory WHERE user_id = ?");
    $stmt->execute([$userId]);
    $owned = array_column($stmt->fetchAll(), 'accessory_id');
    foreach ($items as &$item) $item['owned'] = in_array($item['id'], $owned);
    successResponse($items);
}

if ($path === 'shop/buy' && $method === 'POST') {
    $accessoryId = intval($input['accessory_id'] ?? 0);
    $targetId = intval($input['target_id'] ?? 0);
    $stmt = $pdo->prepare("SELECT * FROM accessories WHERE id = ?"); $stmt->execute([$accessoryId]);
    $item = $stmt->fetch(); if (!$item) errorResponse('Item not found');
    $stmt = $pdo->prepare("SELECT coins FROM users WHERE id = ?"); $stmt->execute([$userId]);
    $userCoins = $stmt->fetchColumn();
    if ($userCoins < $item['price']) errorResponse('Not enough coins');

    $pdo->beginTransaction();
    $pdo->prepare("UPDATE users SET coins = coins - ? WHERE id = ?")->execute([$item['price'], $userId]);
    $pdo->prepare("INSERT INTO inventory (user_id, accessory_id, target_id) VALUES (?, ?, ?)")->execute([$userId, $accessoryId, $targetId ?: null]);
    $pdo->prepare("UPDATE achievements SET progress = progress + 1 WHERE user_id = ? AND title = 'Shopaholic'")->execute([$userId]);
    checkAchievements($pdo, $userId);
    $pdo->commit();
    successResponse(null, 'Purchase successful!');
}

if ($path === 'inventory' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT i.*, a.name, a.icon, a.category, a.effect_happiness FROM inventory i JOIN accessories a ON i.accessory_id = a.id WHERE i.user_id = ?");
    $stmt->execute([$userId]);
    successResponse($stmt->fetchAll());
}

if ($path === 'achievements' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM achievements WHERE user_id = ? ORDER BY is_unlocked DESC, tier DESC");
    $stmt->execute([$userId]);
    successResponse($stmt->fetchAll());
}

if ($path === 'receipts' && $method === 'POST') {
    $targetId = intval($input['target_id'] ?? 0);
    $totalPrice = floatval($input['total_price'] ?? 0);
    $pdo->prepare("INSERT INTO receipts (user_id, image_path, shop_name, total_price, receipt_date, category, items, target_id, is_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)")
        ->execute([$userId, $input['image_path'] ?? null, trim($input['shop_name'] ?? ''), $totalPrice, $input['date'] ?? date('Y-m-d'), $input['category'] ?? 'Shopping', json_encode($input['items'] ?? []), $targetId]);
    $receiptId = $pdo->lastInsertId();

    if ($targetId && $totalPrice > 0) {
        $pdo->prepare("INSERT INTO transactions (target_id, user_id, amount, type, note, transaction_date) VALUES (?, ?, ?, 'deposit', ?, ?)")
            ->execute([$targetId, $userId, $totalPrice, "Receipt: " . ($input['shop_name'] ?? ''), $input['date'] ?? date('Y-m-d')]);
        $stmt = $pdo->prepare("SELECT * FROM targets WHERE id = ?"); $stmt->execute([$targetId]);
        $target = $stmt->fetch();
        if ($target) {
            $newAmount = $target['current_amount'] + $totalPrice;
            $progress = $target['target_amount'] > 0 ? ($newAmount / $target['target_amount']) * 100 : 0;
            $status = $progress >= 100 ? 'completed' : 'active';
            $pdo->prepare("UPDATE targets SET current_amount = ?, status = ? WHERE id = ?")->execute([$newAmount, $status, $targetId]);
        }
    }
    $pdo->prepare("UPDATE achievements SET progress = progress + 1 WHERE user_id = ? AND title = 'Receipt Pro'")->execute([$userId]);
    checkAchievements($pdo, $userId);
    successResponse(['receipt_id' => $receiptId], 'Receipt saved');
}

if ($path === 'receipts' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $receipts = $stmt->fetchAll();
    foreach ($receipts as &$r) $r['items'] = json_decode($r['items'] ?? '[]', true);
    successResponse($receipts);
}

if ($path === 'rankings' && $method === 'GET') {
    $stmt = $pdo->query("SELECT id, username, rank, total_targets_completed, total_saved, coins, CASE WHEN rank = 'Platinum' THEN 5 WHEN rank = 'Diamond' THEN 4 WHEN rank = 'Gold' THEN 3 WHEN rank = 'Silver' THEN 2 ELSE 1 END as rank_value FROM users ORDER BY rank_value DESC, total_targets_completed DESC, total_saved DESC LIMIT 50");
    successResponse($stmt->fetchAll());
}

// HELPERS
function checkAchievements($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = ?"); $stmt->execute([$userId]);
    $count = $stmt->fetchColumn();
    $pdo->prepare("UPDATE achievements SET progress = ?, is_unlocked = ? WHERE user_id = ? AND title = 'First Saver'")->execute([$count, $count >= 1, $userId]);

    $stmt = $pdo->prepare("SELECT streak_days FROM users WHERE id = ?"); $stmt->execute([$userId]);
    $streak = $stmt->fetchColumn();
    $pdo->prepare("UPDATE achievements SET progress = ?, is_unlocked = ? WHERE user_id = ? AND title = 'Week Saver'")->execute([$streak, $streak >= 7, $userId]);

    $stmt = $pdo->prepare("SELECT MAX(current_amount/target_amount*100) FROM targets WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$userId]);
    $maxProgress = $stmt->fetchColumn() ?: 0;
    $pdo->prepare("UPDATE achievements SET progress = ?, is_unlocked = ? WHERE user_id = ? AND title = 'Goal Getter'")->execute([$maxProgress, $maxProgress >= 50, $userId]);

    $stmt = $pdo->prepare("SELECT total_saved FROM users WHERE id = ?"); $stmt->execute([$userId]);
    $saved = $stmt->fetchColumn();
    $pdo->prepare("UPDATE achievements SET progress = ?, is_unlocked = ? WHERE user_id = ? AND title = 'Money Master'")->execute([$saved, $saved >= 100000, $userId]);

    $stmt = $pdo->prepare("SELECT total_targets_completed FROM users WHERE id = ?"); $stmt->execute([$userId]);
    $completed = $stmt->fetchColumn();
    $pdo->prepare("UPDATE achievements SET progress = ?, is_unlocked = ? WHERE user_id = ? AND title = 'Diamond Hands'")->execute([$completed, $completed >= 5, $userId]);

    $pdo->prepare("UPDATE achievements SET unlocked_at = IF(is_unlocked = TRUE AND unlocked_at IS NULL, NOW(), unlocked_at) WHERE user_id = ?")->execute([$userId]);
}

function updateRank($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT total_targets_completed FROM users WHERE id = ?"); $stmt->execute([$userId]);
    $completed = $stmt->fetchColumn();
    $rank = 'Bronze';
    if ($completed >= 20) $rank = 'Platinum';
    elseif ($completed >= 10) $rank = 'Diamond';
    elseif ($completed >= 5) $rank = 'Gold';
    elseif ($completed >= 1) $rank = 'Silver';
    $pdo->prepare("UPDATE users SET rank = ? WHERE id = ? AND rank != ?")->execute([$rank, $userId, $rank]);
}

errorResponse(
    'Endpoint not found. Path=' . $path .
    ' Method=' . $method,
    404
);
