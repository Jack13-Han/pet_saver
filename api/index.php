<?php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// 2. Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}


ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Convert PHP errors/warnings into ErrorExceptions
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Catch all uncaught exceptions and output as JSON
set_exception_handler(function($exception) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $exception->getMessage(),
        'file' => basename($exception->getFile()),
        'line' => $exception->getLine()
    ]);
    exit();
});


require_once 'config.php';

const MAX_MONEY_AMOUNT = 9999999999999.99;
const CARE_DAILY_LIMIT = 3;
const STARTER_AVATAR_TYPES = ['dog', 'cat'];
const AVATAR_UNLOCKS = [
    [
        'type' => 'rabbit',
        'name' => 'Rabbit Avatar',
        'description' => 'Unlock the rabbit avatar for new goals',
        'price' => 600,
        'icon' => 'rabbit',
    ],
    [
        'type' => 'pig',
        'name' => 'Pig Avatar',
        'description' => 'Unlock the pig avatar for new goals',
        'price' => 700,
        'icon' => 'pig',
    ],
    [
        'type' => 'bird',
        'name' => 'Bird Avatar',
        'description' => 'Unlock the bird avatar for new goals',
        'price' => 800,
        'icon' => 'bird',
    ],
    [
        'type' => 'naruto',
        'name' => 'Naruto Avatar',
        'description' => 'Unlock the Naruto avatar for new goals',
        'price' => 900,
        'icon' => 'naruto',
    ],
    [
        'type' => 'pikachu',
        'name' => 'Pikachu Avatar',
        'description' => 'Unlock the Pikachu avatar for new goals',
        'price' => 1000,
        'icon' => 'pikachu',
    ],
    [
        'type' => 'chiikawa',
        'name' => 'Chiikawa Avatar',
        'description' => 'Unlock the Chiikawa avatar for new goals',
        'price' => 1100,
        'icon' => 'chiikawa',
    ],
    [
        'type' => 'lufy',
        'name' => 'Lufy Avatar',
        'description' => 'Unlock the Lufy avatar for new goals',
        'price' => 1200,
        'icon' => 'lufy',
    ],
];

set_exception_handler(function (Throwable $e) use ($pdo) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'error' => 'Server error. Please try again.'
    ]);
    exit();
});

ensureUserPrivacyColumns($pdo);
ensureFinanceFeatureTables($pdo);

$method = $_SERVER['REQUEST_METHOD'];

$path = $_GET['route'] ?? '';
$path = trim($path, '/');


$input = json_decode(file_get_contents('php://input'), true);

//newly added


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
        ['Diamond Hands', 'Complete 5 targets', 'gem', 'platinum', 5]
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
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'coins' => (int)$user['coins'],
            'rank' => $user['rank'],
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

if ($userId) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    if (!$stmt->fetch()) {
        errorResponse('Unauthorized', 401);
    }

    applyDueRecurringEntries($pdo, $userId);
}

if ($path === 'user' && $method === 'GET') {
    $stmt = $pdo->prepare("
    SELECT
        id,
        username,
        email,
        coins,
        `rank`,
        streak_days,
        total_saved,
        total_targets_completed,
        COALESCE(public_profile, 0) AS public_profile,
        COALESCE(show_on_leaderboard, 1) AS show_on_leaderboard
    FROM users
    WHERE id = ?
    ");
    $stmt->execute([$userId]);
    successResponse($stmt->fetch());
}

if ($path === 'user' && $method === 'PUT') {
    $updates = [];
    $params = [];

    if (array_key_exists('username', $input)) {
        $username = trim($input['username'] ?? '');
        if (strlen($username) < 3) {
            errorResponse('Username min 3 chars');
        }
        $updates[] = 'username = ?';
        $params[] = $username;
    }

    if (array_key_exists('email', $input)) {
        $email = trim($input['email'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            errorResponse('Invalid email');
        }
        $updates[] = 'email = ?';
        $params[] = $email;
    }

    if (array_key_exists('public_profile', $input)) {
        $updates[] = 'public_profile = ?';
        $params[] = !empty($input['public_profile']) ? 1 : 0;
    }

    if (array_key_exists('show_on_leaderboard', $input)) {
        $updates[] = 'show_on_leaderboard = ?';
        $params[] = !empty($input['show_on_leaderboard']) ? 1 : 0;
    }

    if (!$updates) {
        errorResponse('No updates provided');
    }

    $params[] = $userId;
    $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?');
    $stmt->execute($params);

    $stmt = $pdo->prepare("
        SELECT
            id,
            username,
            email,
            coins,
            `rank`,
            streak_days,
            total_saved,
            total_targets_completed,
            COALESCE(public_profile, 0) AS public_profile,
            COALESCE(show_on_leaderboard, 1) AS show_on_leaderboard
        FROM users
        WHERE id = ?
    ");
    $stmt->execute([$userId]);

    successResponse($stmt->fetch(), 'Settings updated');
}

if ($path === 'user/active-target' && $method === 'POST') {

    $targetId = intval($input['target_id'] ?? 0);

    if ($targetId <= 0) {
        errorResponse('Invalid target');
    }

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

if ($path === 'dashboard' && $method === 'GET') {
    ensureCareActivityType($pdo);
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $userData = $stmt->fetch();

    $stmt = $pdo->prepare("
    SELECT t.*, a.happiness, a.energy, a.fullness,
        a.cleanliness, a.level, a.exp,
        a.mood, a.accessories
    FROM targets t
    LEFT JOIN avatars a ON t.id = a.target_id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC LIMIT 1
    ");
    $stmt->execute([$userId]);
    $activeTarget = $stmt->fetch();

    if ($activeTarget) {
        $stmt = $pdo->prepare("
            SELECT
                COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS net_savings
            FROM transactions
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $netSavings = max(0, (float)$stmt->fetchColumn());

        $activeTarget['current_amount'] = $netSavings;
        $activeTarget['progress'] = $activeTarget['target_amount'] > 0 ? round(($netSavings / $activeTarget['target_amount']) * 100, 1) : 0;
        $activeTarget['status'] = $activeTarget['progress'] >= 100 ? 'completed' : 'active';
        $activeTarget['accessories'] = json_decode($activeTarget['accessories'] ?? '[]', true);
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM activity_log WHERE user_id = ? AND activity_type = 'care' AND activity_date = CURDATE()");
        $stmt->execute([$userId]);
        $careActionsToday = (int)$stmt->fetchColumn();
        $activeTarget['care_actions_today'] = $careActionsToday;
        $activeTarget['care_actions_remaining'] = max(0, CARE_DAILY_LIMIT - $careActionsToday);
    }

    $stmt = $pdo->prepare("SELECT t.*, tg.name as target_name FROM transactions t LEFT JOIN targets tg ON t.target_id = tg.id WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT 10");
    $stmt->execute([$userId]);
    $transactions = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT * FROM achievements WHERE user_id = ? ORDER BY is_unlocked DESC, created_at DESC LIMIT 4");
    $stmt->execute([$userId]);
    $achievements = $stmt->fetchAll();

    ensureAvatarShopItems($pdo);
    $avatarNames = avatarUnlockNames();
    $placeholders = implode(',', array_fill(0, count($avatarNames), '?'));
    $stmt = $pdo->prepare("SELECT * FROM accessories WHERE name IN ($placeholders) ORDER BY price LIMIT 4");
    $stmt->execute($avatarNames);
    $shopPreview = normalizeShopItems($stmt->fetchAll());

    successResponse(['user' => $userData, 'activeTarget' => $activeTarget, 'transactions' => $transactions, 'achievements' => $achievements, 'shopPreview' => $shopPreview]);
}

if ($path === 'targets' && $method === 'GET') {
    $status = $_GET['status'] ?? 'active';
    if ($status === 'all') {
        $stmt = $pdo->prepare("SELECT t.*, a.happiness, a.energy, a.fullness, a.cleanliness, a.level, a.mood FROM targets t LEFT JOIN avatars a ON t.id = a.target_id WHERE t.user_id = ? ORDER BY t.created_at DESC");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->prepare("SELECT t.*, a.happiness, a.energy, a.fullness, a.cleanliness, a.level, a.mood FROM targets t LEFT JOIN avatars a ON t.id = a.target_id WHERE t.user_id = ? AND t.status = ? ORDER BY t.created_at DESC");
        $stmt->execute([$userId, $status]);
    }
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
    $category = trim($input['category'] ?? 'General');
    $categoryLength = function_exists('mb_strlen') ? mb_strlen($category) : strlen($category);
    if (empty($name) || $targetAmount <= 0) errorResponse('Name and target amount required');
    if ($category === '' || $categoryLength > 50) errorResponse('Category must be between 1 and 50 characters');
    ensureTargetAvatarTypes($pdo);
    ensureAvatarShopItems($pdo);

    $avatarType = strtolower(trim($input['avatar_type'] ?? 'dog'));
    $validAvatarTypes = array_merge(STARTER_AVATAR_TYPES, array_column(AVATAR_UNLOCKS, 'type'));
    if (!in_array($avatarType, $validAvatarTypes, true)) {
        errorResponse('Invalid avatar type');
    }

    if (!in_array($avatarType, STARTER_AVATAR_TYPES, true)) {
        $unlockName = avatarUnlockNameForType($avatarType);
        $stmt = $pdo->prepare("
            SELECT i.id
            FROM inventory i
            JOIN accessories a ON i.accessory_id = a.id
            WHERE i.user_id = ? AND a.name = ?
            LIMIT 1
        ");
        $stmt->execute([$userId, $unlockName]);
        if (!$stmt->fetch()) {
            errorResponse('Buy this avatar in the shop first.', 403);
        }
    }

    // Check if user already has an active goal
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM targets WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$userId]);
    if ($stmt->fetchColumn() > 0) {
        errorResponse('You can only have one active goal at a time. Please complete or delete your current goal first.', 400);
    }

    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare("INSERT INTO targets (user_id, name, description, target_amount, category, deadline, avatar_type, avatar_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $name, $input['description'] ?? '', $targetAmount, $category, $input['deadline'] ?? null, $avatarType, trim($input['avatar_name'] ?? 'Mochi')]);

        $targetId = $pdo->lastInsertId();
        // Check if user already has an active goal

        $stmt = $pdo->prepare("

    SELECT active_target_id

    FROM users

    WHERE id = ?

");

        $stmt->execute([$userId]);

        $user = $stmt->fetch();

        if (empty($user['active_target_id'])) {

            $stmt = $pdo->prepare("
    
        UPDATE users

        SET active_target_id = ?

        WHERE id = ?

    ");

            $stmt->execute([

                $targetId,

                $userId

            ]);
        }




        $pdo->prepare("INSERT INTO avatars (target_id) VALUES (?)")->execute([$targetId]);

        // ROLLOVER LOGIC: Move excess savings from previous targets to this new target
        $stmt = $pdo->prepare("SELECT id, current_amount, target_amount FROM targets WHERE user_id = ? AND current_amount > target_amount AND id != ?");
        $stmt->execute([$userId, $targetId]);
        $excessTargets = $stmt->fetchAll();

        $totalExcess = 0;
        foreach ($excessTargets as $et) {
            $excess = $et['current_amount'] - $et['target_amount'];
            $totalExcess += $excess;
            // Cap the old target to its target_amount
            $pdo->prepare("UPDATE targets SET current_amount = target_amount WHERE id = ?")->execute([$et['id']]);
            // Record a withdrawal for the deduction to balance ledger
            $pdo->prepare("INSERT INTO transactions (target_id, user_id, amount, type, note, transaction_date) VALUES (?, ?, ?, 'withdrawal', 'Rollover to new goal', NOW())")->execute([$et['id'], $userId, $excess]);
        }

        if ($totalExcess > 0) {
            // Apply excess to the new target
            $pdo->prepare("INSERT INTO transactions (target_id, user_id, amount, type, note, transaction_date) VALUES (?, ?, ?, 'deposit', 'Rollover from previous goal', NOW())")->execute([$targetId, $userId, $totalExcess]);
            
            $progress = ($totalExcess / $targetAmount) * 100;
            $status = $progress >= 100 ? 'completed' : 'active';
            $pdo->prepare("UPDATE targets SET current_amount = ?, status = ? WHERE id = ?")->execute([$totalExcess, $status, $targetId]);
            
            // update avatar mood
            $mood = 'neutral';
            if ($progress >= 100) $mood = 'celebrating';
            elseif ($progress >= 70) $mood = 'happy';
            elseif ($progress >= 40) $mood = 'neutral';
            elseif ($progress > 0) $mood = 'sad';
            else $mood = 'dirty';
            $happiness = min(100, max(0, 50 + ($progress - 50)));
            $pdo->prepare("UPDATE avatars SET mood = ?, happiness = ? WHERE target_id = ?")->execute([$mood, $happiness, $targetId]);
        }

        $pdo->commit();
        successResponse(['target_id' => $targetId], 'Target created');
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        errorResponse('Failed to create target', 500);
    }
}

if (preg_match('/^targets\/(\d+)$/', $path, $m) && $method === 'DELETE') {
    $targetId = (int)$m[1];
    $pdo->beginTransaction();
    $pdo->prepare("DELETE FROM targets WHERE id = ? AND user_id = ?")->execute([$targetId, $userId]);
    $pdo->prepare("UPDATE users SET active_target_id = NULL WHERE id = ? AND active_target_id = ?")->execute([$userId, $targetId]);
    $pdo->commit();
    successResponse(null, 'Target deleted');
}

if (preg_match('/^targets\/(\d+)$/', $path, $m) && $method === 'PUT') {
    $targetId = intval($m[1]);
    
    // Check if target exists and belongs to user
    $stmt = $pdo->prepare("SELECT * FROM targets WHERE id = ? AND user_id = ?");
    $stmt->execute([$targetId, $userId]);
    $target = $stmt->fetch();
    if (!$target) errorResponse('Target not found', 404);

    $name = trim($input['name'] ?? '');
    $targetAmount = floatval($input['target_amount'] ?? 0);
    if (empty($name) || $targetAmount <= 0) errorResponse('Name and target amount required');

    $description = $input['description'] ?? '';
    $category = $input['category'] ?? 'General';
    $deadline = $input['deadline'] ?? null;
    if (empty($deadline)) $deadline = null;
    $avatarType = $input['avatar_type'] ?? 'dog';
    $avatarName = trim($input['avatar_name'] ?? 'Mochi');

    // Recalculate status based on new target amount and existing current_amount
    $progress = $targetAmount > 0 ? ($target['current_amount'] / $targetAmount) * 100 : 0;
    $status = $progress >= 100 ? 'completed' : 'active';

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("UPDATE targets SET name = ?, description = ?, target_amount = ?, category = ?, deadline = ?, avatar_type = ?, avatar_name = ?, status = ? WHERE id = ?");
        $stmt->execute([$name, $description, $targetAmount, $category, $deadline, $avatarType, $avatarName, $status, $targetId]);

        // Update avatar mood based on new progress
        $mood = 'neutral';
        if ($progress >= 100) $mood = 'celebrating';
        elseif ($progress >= 70) $mood = 'happy';
        elseif ($progress >= 40) $mood = 'neutral';
        elseif ($progress > 0) $mood = 'sad';
        else $mood = 'dirty';
        
        $happiness = min(100, max(0, 50 + ($progress - 50)));
        $pdo->prepare("UPDATE avatars SET mood = ?, happiness = ? WHERE target_id = ?")->execute([$mood, $happiness, $targetId]);

        $pdo->commit();
        successResponse(null, 'Target updated');
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        errorResponse('Failed to update target', 500);
    }
}

if ($path === 'transactions' && $method === 'POST') {
    $targetId = intval($input['target_id'] ?? 0);
    $amountInput = $input['amount'] ?? null;
    $amount = is_numeric($amountInput) ? round((float)$amountInput, 2) : 0;
    $type = $input['type'] ?? '';
    if ($targetId <= 0 || $amount <= 0 || !in_array($type, ['deposit', 'withdrawal'])) errorResponse('Invalid data');
    if (!is_finite($amount) || $amount > MAX_MONEY_AMOUNT) {
        errorResponse('Amount is too large. Please enter a value up to 9,999,999,999,999.99');
    }

    $stmt = $pdo->prepare("SELECT * FROM targets WHERE id = ? AND user_id = ?");
    $stmt->execute([$targetId, $userId]);
    $target = $stmt->fetch();
    if (!$target) errorResponse('Target not found');

    // Extract category if explicitly passed, else try to parse from note, or fallback to General
    $category = trim($input['category'] ?? '');
    if (empty($category) && !empty($input['note'])) {
        if (strpos($input['note'], ' · ') !== false) {
            $parts = explode(' · ', $input['note']);
            $category = trim($parts[0]);
        }
    }
    if (empty($category)) {
        $category = 'General';
    }

    $pdo->prepare("INSERT INTO transactions (target_id, user_id, amount, type, category, note, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)")
        ->execute([$targetId, $userId, $amount, $type, $category, $input['note'] ?? '', $input['date'] ?? date('Y-m-d')]);

    if ($type === 'deposit') {
        $newAmount = $target['current_amount'] + $amount;
        $pdo->prepare("UPDATE users SET total_saved = total_saved + ? WHERE id = ?")->execute([$amount, $userId]);
    } else {
        $newAmount = max(0, $target['current_amount'] - $amount);
    }

    $stmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0)
        FROM transactions
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $newAmount = max(0, (float)$stmt->fetchColumn());

    $progress = $target['target_amount'] > 0 ? ($newAmount / $target['target_amount']) * 100 : 0;
    $displayProgress = min(100, $progress);
    $status = $progress >= 100 ? 'completed' : 'active';

    if ($status === 'completed') {
        $pdo->prepare("UPDATE targets SET current_amount = ?, status = ?, completion_date = COALESCE(completion_date, NOW()) WHERE id = ?")->execute([$newAmount, $status, $targetId]);
        $pdo->prepare("UPDATE users SET active_target_id = NULL WHERE id = ? AND active_target_id = ?")->execute([$userId, $targetId]);
    } else {
        $pdo->prepare("UPDATE targets SET current_amount = ?, status = ? WHERE id = ?")->execute([$newAmount, $status, $targetId]);
    }

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
    successResponse(['new_amount' => $newAmount, 'progress' => round($displayProgress, 1), 'actual_progress' => round($progress, 1), 'status' => $status, 'mood' => $mood], 'Transaction recorded');
}

if ($path === 'transactions' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT t.*, tg.name as target_name FROM transactions t LEFT JOIN targets tg ON t.target_id = tg.id WHERE t.user_id = ? ORDER BY t.created_at DESC");
    $stmt->execute([$userId]);
    successResponse($stmt->fetchAll());
}

if ($path === 'transactions/insights' && $method === 'GET') {
    // 1. Get total spending (withdrawals) grouped by category
    $stmt = $pdo->prepare("
        SELECT category, SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'withdrawal'
        GROUP BY category
        ORDER BY total DESC
    ");
    $stmt->execute([$userId]);
    $categories = $stmt->fetchAll();

    // 2. Get total savings (deposits) vs total spending (withdrawals)
    $stmt = $pdo->prepare("
        SELECT 
            SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_savings,
            SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_spending
        FROM transactions
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $totals = $stmt->fetch();

    // 3. Get recent 6 months spending history by month for monthly comparison
    $stmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(transaction_date, '%Y-%m') as raw_month,
            DATE_FORMAT(transaction_date, '%b %Y') as month_year,
            SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'withdrawal'
        GROUP BY raw_month, month_year
        ORDER BY raw_month ASC
        LIMIT 6
    ");
    $stmt->execute([$userId]);
    $monthlyTrend = $stmt->fetchAll();

    successResponse([
        'categories' => $categories,
        'totals' => [
            'savings' => floatval($totals['total_savings'] ?? 0),
            'spending' => floatval($totals['total_spending'] ?? 0),
        ],
        'monthlyTrend' => $monthlyTrend
    ]);
}

//calendar
if ($path === 'calendar' && $method === 'GET') {

    $stmt = $pdo->prepare("
        SELECT
            DATE(created_at) as day,
            SUM(amount) as total
        FROM transactions
        WHERE user_id = ?
        AND type = 'withdrawal'
        GROUP BY DATE(created_at)
    ");

    $stmt->execute([$userId]);

    successResponse(
        $stmt->fetchAll()
    );
}

if ($path === 'avatars/care' && $method === 'POST') {
    $targetId = intval($input['target_id'] ?? 0);
    $action = $input['action'] ?? '';
    if (!$targetId || !in_array($action, ['play', 'feed', 'rest', 'shower'])) errorResponse('Invalid care action');

    ensureCareActivityType($pdo);
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? FOR UPDATE");
    $stmt->execute([$userId]);

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM activity_log WHERE user_id = ? AND activity_type = 'care' AND activity_date = CURDATE()");
    $stmt->execute([$userId]);
    $careActionsToday = (int)$stmt->fetchColumn();
    if ($careActionsToday >= CARE_DAILY_LIMIT) {
        $pdo->rollBack();
        errorResponse('You can take care of your avatar only 3 times per day.', 429);
    }

    $stmt = $pdo->prepare("SELECT a.* FROM avatars a JOIN targets t ON a.target_id = t.id WHERE a.target_id = ? AND t.user_id = ?");
    $stmt->execute([$targetId, $userId]);
    $avatar = $stmt->fetch();
    if (!$avatar) {
        $pdo->rollBack();
        errorResponse('Avatar not found');
    }

    $updates = [];
    $expGain = 10;
    switch ($action) {
        case 'play':
            $updates['happiness'] = min(100, $avatar['happiness'] + 10);
            $updates['energy'] = max(0, $avatar['energy'] - 5);
            break;
        case 'feed':
            $updates['fullness'] = min(100, $avatar['fullness'] + 10);
            $updates['energy'] = min(100, $avatar['energy'] + 5);
            break;
        case 'rest':
            $updates['energy'] = min(100, $avatar['energy'] + 10);
            $updates['happiness'] = max(0, $avatar['happiness'] - 2);
            break;
        case 'shower':
            $updates['cleanliness'] = min(100, $avatar['cleanliness'] + 10);
            $updates['happiness'] = min(100, $avatar['happiness'] + 5);
            break;
    }

    $newExp = $avatar['exp'] + $expGain;
    $newLevel = $avatar['level'];
    if ($newExp >= $avatar['level'] * 100) {
        $newLevel++;
        $newExp = 0;
    }

    $pdo->prepare("UPDATE avatars SET happiness = ?, energy = ?, fullness = ?, cleanliness = ?, exp = ?, level = ? WHERE target_id = ?")
        ->execute([$updates['happiness'] ?? $avatar['happiness'], $updates['energy'] ?? $avatar['energy'], $updates['fullness'] ?? $avatar['fullness'], $updates['cleanliness'] ?? $avatar['cleanliness'], $newExp, $newLevel, $targetId]);
    $pdo->prepare("INSERT INTO activity_log (user_id, activity_type, points, activity_date) VALUES (?, 'care', 0, CURDATE())")
        ->execute([$userId]);
    $pdo->commit();

    $careActionsToday++;
    successResponse([
        'level' => $newLevel,
        'exp' => $newExp,
        'stats' => $updates,
        'care_actions_today' => $careActionsToday,
        'care_actions_remaining' => max(0, CARE_DAILY_LIMIT - $careActionsToday),
    ], 'Avatar cared for!');
}

if ($path === 'shop' && $method === 'GET') {
    ensureAvatarShopItems($pdo);
    $avatarNames = avatarUnlockNames();
    $placeholders = implode(',', array_fill(0, count($avatarNames), '?'));
    $stmt = $pdo->prepare("SELECT * FROM accessories WHERE name IN ($placeholders) ORDER BY price");
    $stmt->execute($avatarNames);
    $items = $stmt->fetchAll();
    $stmt = $pdo->prepare("SELECT accessory_id FROM inventory WHERE user_id = ?");
    $stmt->execute([$userId]);
    $owned = array_column($stmt->fetchAll(), 'accessory_id');
    successResponse(normalizeShopItems($items, $owned));
}

if ($path === 'shop/buy' && $method === 'POST') {
    ensureAvatarShopItems($pdo);
    $accessoryId = intval($input['accessory_id'] ?? 0);
    $targetId = intval($input['target_id'] ?? 0);
    $stmt = $pdo->prepare("SELECT * FROM accessories WHERE id = ?");
    $stmt->execute([$accessoryId]);
    $item = $stmt->fetch();
    if (!$item) errorResponse('Item not found');
    if (!in_array($item['name'], avatarUnlockNames(), true)) {
        errorResponse('This item is not available');
    }
    $stmt = $pdo->prepare("SELECT id FROM inventory WHERE user_id = ? AND accessory_id = ? AND target_id IS NULL LIMIT 1");
    $stmt->execute([$userId, $accessoryId]);
    if ($stmt->fetch()) errorResponse('Item already owned');

    $stmt = $pdo->prepare("SELECT coins FROM users WHERE id = ?");
    $stmt->execute([$userId]);
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

if ($path === 'receipts/scan' && $method === 'POST') {
    $image = $input['image'] ?? '';
    $mimeType = $input['mime_type'] ?? 'image/jpeg';

    if (empty($image)) {
        errorResponse('Receipt image is required');
    }

    successResponse(scanReceiptWithGemini($image, $mimeType), 'Receipt scanned');
}

if ($path === 'receipts' && $method === 'POST') {
    $targetId = intval($input['target_id'] ?? 0);
    $totalPriceInput = $input['total_price'] ?? null;
    $totalPrice = is_numeric($totalPriceInput) ? round((float)$totalPriceInput, 2) : 0;
    if ($totalPrice < 0 || !is_finite($totalPrice) || $totalPrice > MAX_MONEY_AMOUNT) {
        errorResponse('Receipt total is too large');
    }
    $pdo->prepare("INSERT INTO receipts (user_id, image_path, shop_name, total_price, receipt_date, category, items, target_id, is_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)")
        ->execute([$userId, $input['image_path'] ?? null, trim($input['shop_name'] ?? ''), $totalPrice, $input['date'] ?? date('Y-m-d'), $input['category'] ?? 'Shopping', json_encode($input['items'] ?? []), $targetId ?: null]);
    $receiptId = $pdo->lastInsertId();

    if ($totalPrice > 0) {
        $receiptCategory = trim($input['category'] ?? 'Shopping');
        $pdo->prepare("INSERT INTO transactions (target_id, user_id, amount, type, category, note, transaction_date) VALUES (?, ?, ?, 'withdrawal', ?, ?, ?)")
            ->execute([$targetId ?: null, $userId, $totalPrice, $receiptCategory, "Receipt: " . ($input['shop_name'] ?? ''), $input['date'] ?? date('Y-m-d')]);
        
        if ($targetId) {
            $stmt = $pdo->prepare("SELECT * FROM targets WHERE id = ?");
            $stmt->execute([$targetId]);
            $target = $stmt->fetch();
            if ($target) {
                $newAmount = max(0, $target['current_amount'] - $totalPrice);
                $progress = $target['target_amount'] > 0 ? ($newAmount / $target['target_amount']) * 100 : 0;
                $status = $progress >= 100 ? 'completed' : 'active';
                $pdo->prepare("UPDATE targets SET current_amount = ?, status = ? WHERE id = ?")->execute([$newAmount, $status, $targetId]);
            }
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
    $stmt = $pdo->query("SELECT id, username, `rank`, total_targets_completed, total_saved, coins, CASE WHEN `rank` = 'Platinum' THEN 5 WHEN `rank` = 'Diamond' THEN 4 WHEN `rank` = 'Gold' THEN 3 WHEN `rank` = 'Silver' THEN 2 ELSE 1 END as rank_value FROM users WHERE COALESCE(show_on_leaderboard, 1) = 1 ORDER BY rank_value DESC, total_targets_completed DESC, total_saved DESC LIMIT 50");
    successResponse($stmt->fetchAll());
}

if ($path === 'budgets' && $method === 'GET') {
    successResponse(getBudgetRows($pdo, $userId));
}

if ($path === 'budgets' && $method === 'POST') {
    $category = trim($input['category'] ?? '');
    $amount = floatval($input['monthly_limit'] ?? 0);

    if ($category === '' || $amount < 0) {
        errorResponse('Category and monthly limit are required');
    }

    $stmt = $pdo->prepare("
        INSERT INTO budgets (user_id, category, monthly_limit)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit), updated_at = CURRENT_TIMESTAMP
    ");
    $stmt->execute([$userId, $category, $amount]);

    successResponse(getBudgetRows($pdo, $userId), 'Budget saved');
}

if ($path === 'recurring' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM recurring_entries WHERE user_id = ? ORDER BY next_run_date ASC, id DESC");
    $stmt->execute([$userId]);
    successResponse($stmt->fetchAll());
}

if ($path === 'recurring' && $method === 'POST') {
    $name = trim($input['name'] ?? '');
    $amount = floatval($input['amount'] ?? 0);
    $type = $input['type'] ?? '';
    $category = trim($input['category'] ?? 'General');
    $frequency = $input['frequency'] ?? 'monthly';
    $nextRun = $input['next_run_date'] ?? date('Y-m-d');
    $targetId = !empty($input['target_id']) ? intval($input['target_id']) : null;

    if ($name === '' || $amount <= 0 || !in_array($type, ['deposit', 'withdrawal']) || !in_array($frequency, ['weekly', 'monthly'])) {
        errorResponse('Valid name, amount, type, and frequency are required');
    }

    $stmt = $pdo->prepare("
        INSERT INTO recurring_entries (user_id, target_id, name, amount, type, category, frequency, next_run_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ");
    $stmt->execute([$userId, $targetId, $name, $amount, $type, $category, $frequency, $nextRun]);

    successResponse(null, 'Recurring entry saved');
}

if (preg_match('/^recurring\/(\d+)$/', $path, $m) && $method === 'DELETE') {
    $pdo->prepare("DELETE FROM recurring_entries WHERE id = ? AND user_id = ?")->execute([intval($m[1]), $userId]);
    successResponse(null, 'Recurring entry deleted');
}

if ($path === 'finance/overview' && $method === 'GET') {
    successResponse(getFinanceOverview($pdo, $userId));
}

if ($path === 'finance/export' && $method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT t.transaction_date, t.type, t.category, t.amount, t.note, tg.name AS target_name
        FROM transactions t
        LEFT JOIN targets tg ON t.target_id = tg.id
        WHERE t.user_id = ?
        ORDER BY t.transaction_date DESC, t.id DESC
    ");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="pet-saver-transactions.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['date', 'type', 'category', 'amount', 'note', 'target']);
    foreach ($rows as $row) {
        fputcsv($out, [$row['transaction_date'], $row['type'], $row['category'], $row['amount'], $row['note'], $row['target_name']]);
    }
    fclose($out);
    exit();
}

if ($path === 'missions/claim' && $method === 'POST') {
    $missionId = trim($input['mission_id'] ?? '');
    $overview = getFinanceOverview($pdo, $userId);
    $mission = null;

    foreach ($overview['missions'] as $candidate) {
        if ($candidate['id'] === $missionId) {
            $mission = $candidate;
            break;
        }
    }

    if (!$mission || empty($mission['completed'])) {
        errorResponse('Mission is not completed');
    }

    $stmt = $pdo->prepare("SELECT id FROM mission_claims WHERE user_id = ? AND mission_id = ?");
    $stmt->execute([$userId, $missionId]);
    if ($stmt->fetch()) {
        errorResponse('Mission already claimed');
    }

    $reward = intval($mission['reward'] ?? 0);
    $pdo->beginTransaction();
    $pdo->prepare("INSERT INTO mission_claims (user_id, mission_id, reward_coins) VALUES (?, ?, ?)")
        ->execute([$userId, $missionId, $reward]);
    $pdo->prepare("UPDATE users SET coins = coins + ? WHERE id = ?")->execute([$reward, $userId]);
    $pdo->commit();

    successResponse(['coins' => $reward], 'Mission reward claimed');
}

// HELPERS
function avatarUnlockNames()
{
    return array_map(fn($unlock) => $unlock['name'], AVATAR_UNLOCKS);
}

function avatarUnlockNameForType($avatarType)
{
    foreach (AVATAR_UNLOCKS as $unlock) {
        if ($unlock['type'] === $avatarType) {
            return $unlock['name'];
        }
    }

    return null;
}

function avatarUnlockTypeForName($name)
{
    foreach (AVATAR_UNLOCKS as $unlock) {
        if ($unlock['name'] === $name) {
            return $unlock['type'];
        }
    }

    return null;
}

function ensureTargetAvatarTypes($pdo)
{
    try {
        $column = $pdo->query("SHOW COLUMNS FROM targets LIKE 'avatar_type'")->fetch();
        if ($column && strpos($column['Type'], "'lufy'") === false) {
            $pdo->exec("ALTER TABLE targets MODIFY avatar_type ENUM('dog','cat','tree','bird','rabbit','pig','naruto','pikachu','chiikawa','lufy') DEFAULT 'dog'");
        }
    } catch (Throwable $e) {
        // Older local databases may already be compatible or lack DDL permissions.
    }
}

function ensureAccessoryAvatarCategory($pdo)
{
    try {
        $column = $pdo->query("SHOW COLUMNS FROM accessories LIKE 'category'")->fetch();
        if ($column && strpos($column['Type'], "'avatar'") === false) {
            $pdo->exec("ALTER TABLE accessories MODIFY category ENUM('hat','glasses','scarf','collar','toy','background','avatar') DEFAULT 'hat'");
        }
    } catch (Throwable $e) {
        // Fallback category below keeps the shop working without DDL permissions.
    }
}

function getAvatarAccessoryCategory($pdo)
{
    try {
        $column = $pdo->query("SHOW COLUMNS FROM accessories LIKE 'category'")->fetch();
        if ($column && strpos($column['Type'], "'avatar'") !== false) {
            return 'avatar';
        }
    } catch (Throwable $e) {
        return 'toy';
    }

    return 'toy';
}

function ensureAvatarShopItems($pdo)
{
    ensureAccessoryAvatarCategory($pdo);
    $category = getAvatarAccessoryCategory($pdo);

    foreach (AVATAR_UNLOCKS as $unlock) {
        $stmt = $pdo->prepare("SELECT id FROM accessories WHERE name = ?");
        $stmt->execute([$unlock['name']]);
        $id = $stmt->fetchColumn();

        if ($id) {
            $stmt = $pdo->prepare("UPDATE accessories SET description = ?, price = ?, icon = ?, category = ? WHERE id = ?");
            $stmt->execute([$unlock['description'], $unlock['price'], $unlock['icon'], $category, $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO accessories (name, description, price, icon, category, effect_happiness, effect_energy) VALUES (?, ?, ?, ?, ?, 0, 0)");
            $stmt->execute([$unlock['name'], $unlock['description'], $unlock['price'], $unlock['icon'], $category]);
        }
    }
}

function scanReceiptWithGemini($image, $mimeType)
{
    $apiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');
    if ($apiKey === '') {
        $apiKey = getenv('VITE_GEMINI_API_KEY') ?: ($_ENV['VITE_GEMINI_API_KEY'] ?? '');
    }

    if ($apiKey === '') {
        errorResponse('Gemini API key is missing in api/.env', 500);
    }

    if (!preg_match('/^image\/(jpeg|jpg|png|webp|heic|heif)$/i', $mimeType)) {
        errorResponse('Unsupported receipt image type');
    }

    $prompt = "Analyze this receipt image and return strict JSON only. "
        . "Extract the official store name, final total paid amount, and transaction date. "
        . "If the receipt is Japanese, keep the store name in Japanese. "
        . "For the total, use the final paid amount only and return an integer. "
        . "For missing year, assume 2026. Date format must be YYYY-MM-DD. "
        . "JSON keys: shop_name, total_price, date.";

    $payload = [
        'systemInstruction' => [
            'parts' => [[
                'text' => 'You are a highly accurate receipt parser. Return valid JSON only.'
            ]]
        ],
        'contents' => [[
            'role' => 'user',
            'parts' => [
                ['text' => $prompt],
                [
                    'inline_data' => [
                        'mime_type' => $mimeType,
                        'data' => $image
                    ]
                ]
            ]
        ]],
        'generationConfig' => [
            'responseMimeType' => 'application/json'
        ]
    ];

    $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . rawurlencode($apiKey);
    [$status, $body] = postJson($endpoint, $payload);

    if ($status < 200 || $status >= 300) {
        $code = $status === 503 ? 503 : 500;
        $errorPayload = json_decode($body, true);
        $message = $errorPayload['error']['message'] ?? ('Gemini scan failed: HTTP ' . $status);
        errorResponse($message, $code);
    }

    $decoded = json_decode($body, true);
    $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
    $text = trim(preg_replace('/^```json|```$/m', '', $text));
    $parsed = json_decode($text, true);

    if (!is_array($parsed)) {
        errorResponse('Gemini returned unreadable receipt data', 500);
    }

    return [
        'shop_name' => trim($parsed['shop_name'] ?? 'Unknown Shop') ?: 'Unknown Shop',
        'total_price' => max(0, (int)round((float)($parsed['total_price'] ?? 0))),
        'date' => preg_match('/^\d{4}-\d{2}-\d{2}$/', $parsed['date'] ?? '') ? $parsed['date'] : date('Y-m-d')
    ];
}

function postJson($url, $payload)
{
    $json = json_encode($payload);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_TIMEOUT => 45,
        ]);
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            errorResponse('Gemini network error: ' . $error, 500);
        }

        return [$status, $body];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $json,
            'timeout' => 45,
            'ignore_errors' => true,
        ]
    ]);

    $body = file_get_contents($url, false, $context);
    $status = 0;
    if (!empty($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
        $status = (int)$matches[1];
    }

    if ($body === false) {
        errorResponse('Gemini network error', 500);
    }

    return [$status, $body];
}

function ensureFinanceFeatureTables($pdo)
{
    try {
        $pdo->query("SELECT category FROM transactions LIMIT 1");
    } catch (PDOException $e) {
        try {
            $pdo->exec("ALTER TABLE transactions ADD COLUMN category VARCHAR(50) DEFAULT 'General' AFTER type");
        } catch (PDOException $ignored) {
        }
    }

    try {
        $pdo->exec("ALTER TABLE transactions MODIFY target_id INT DEFAULT NULL");
    } catch (PDOException $ignored) {
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS budgets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            category VARCHAR(50) NOT NULL,
            monthly_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_budget_category (user_id, category)
        )
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS recurring_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            target_id INT DEFAULT NULL,
            name VARCHAR(100) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            type ENUM('deposit','withdrawal') NOT NULL,
            category VARCHAR(50) DEFAULT 'General',
            frequency ENUM('weekly','monthly') DEFAULT 'monthly',
            next_run_date DATE NOT NULL,
            last_run_date DATE DEFAULT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS mission_claims (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            mission_id VARCHAR(80) NOT NULL,
            reward_coins INT NOT NULL DEFAULT 0,
            claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_mission (user_id, mission_id)
        )
    ");
}

function ensureUserPrivacyColumns($pdo)
{
    try {
        $pdo->query("SELECT public_profile, show_on_leaderboard FROM users LIMIT 1");
    } catch (PDOException $e) {
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN public_profile TINYINT(1) NOT NULL DEFAULT 0");
        } catch (PDOException $ignored) {
        }

        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN show_on_leaderboard TINYINT(1) NOT NULL DEFAULT 1");
        } catch (PDOException $ignored) {
        }
    }
}

function normalizeShopItems($items, $owned = [])
{
    $ownedIds = array_map('intval', $owned);

    foreach ($items as &$item) {
        $avatarType = avatarUnlockTypeForName($item['name'] ?? '');
        if ($avatarType) {
            $item['category'] = 'avatar';
            $item['avatar_type'] = $avatarType;
            $item['icon'] = $avatarType;
        }
        $item['owned'] = in_array((int)$item['id'], $ownedIds, true);
    }

    return $items;
}

function ensureCareActivityType($pdo)
{
    try {
        $column = $pdo->query("SHOW COLUMNS FROM activity_log LIKE 'activity_type'")->fetch();
        if ($column && strpos($column['Type'], "'care'") === false) {
            $pdo->exec("ALTER TABLE activity_log MODIFY activity_type ENUM('save','receipt_scan','purchase','goal_complete','login','care') NOT NULL");
        }
    } catch (Throwable $e) {
        // Existing compatible databases need no migration.
    }
}

function getBudgetRows($pdo, $userId)
{
    $stmt = $pdo->prepare("SELECT * FROM budgets WHERE user_id = ? ORDER BY category ASC");
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

function applyDueRecurringEntries($pdo, $userId)
{
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("
        SELECT *
        FROM recurring_entries
        WHERE user_id = ? AND is_active = 1 AND next_run_date <= ?
        ORDER BY next_run_date ASC
    ");
    $stmt->execute([$userId, $today]);
    $entries = $stmt->fetchAll();
    $applied = [];

    foreach ($entries as $entry) {
        $targetId = $entry['target_id'];
        if (!$targetId) {
            $targetStmt = $pdo->prepare("SELECT active_target_id FROM users WHERE id = ?");
            $targetStmt->execute([$userId]);
            $targetId = $targetStmt->fetchColumn();
        }

        if (!$targetId) {
            continue;
        }

        $nextRun = $entry['next_run_date'];
        $runs = 0;

        while ($nextRun <= $today && $runs < 24) {
            $pdo->beginTransaction();

            $pdo->prepare("INSERT INTO transactions (target_id, user_id, amount, type, category, note, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)")
                ->execute([$targetId, $userId, $entry['amount'], $entry['type'], $entry['category'], 'Recurring: ' . $entry['name'], $nextRun]);

            if ($entry['type'] === 'deposit') {
                $pdo->prepare("UPDATE users SET total_saved = total_saved + ? WHERE id = ?")
                    ->execute([$entry['amount'], $userId]);
            }

            $lastRun = $nextRun;
            $nextRun = $entry['frequency'] === 'weekly'
                ? date('Y-m-d', strtotime($nextRun . ' +7 days'))
                : date('Y-m-d', strtotime($nextRun . ' +1 month'));

            $pdo->prepare("UPDATE recurring_entries SET last_run_date = ?, next_run_date = ? WHERE id = ? AND user_id = ?")
                ->execute([$lastRun, $nextRun, $entry['id'], $userId]);

            syncTargetFromTransactions($pdo, $userId, $targetId);
            $pdo->commit();

            $applied[] = [
                'id' => (int)$entry['id'],
                'name' => $entry['name'],
                'amount' => (float)$entry['amount'],
                'run_date' => $lastRun,
                'next_run_date' => $nextRun
            ];

            $runs++;
        }
    }

    if ($applied) {
        checkAchievements($pdo, $userId);
    }

    return $applied;
}

function syncTargetFromTransactions($pdo, $userId, $targetId)
{
    $stmt = $pdo->prepare("SELECT * FROM targets WHERE id = ? AND user_id = ?");
    $stmt->execute([$targetId, $userId]);
    $target = $stmt->fetch();

    if (!$target) {
        return;
    }

    $stmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0)
        FROM transactions
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $newAmount = max(0, (float)$stmt->fetchColumn());

    $progress = $target['target_amount'] > 0 ? ($newAmount / $target['target_amount']) * 100 : 0;
    $status = $progress >= 100 ? 'completed' : 'active';

    $pdo->prepare("UPDATE targets SET current_amount = ?, status = ? WHERE id = ? AND user_id = ?")
        ->execute([$newAmount, $status, $targetId, $userId]);

    $mood = 'neutral';
    if ($progress >= 100) $mood = 'celebrating';
    elseif ($progress >= 70) $mood = 'happy';
    elseif ($progress >= 40) $mood = 'neutral';
    elseif ($progress > 0) $mood = 'sad';
    else $mood = 'dirty';

    $happiness = min(100, max(0, 50 + ($progress - 50)));
    $pdo->prepare("UPDATE avatars SET mood = ?, happiness = ? WHERE target_id = ?")
        ->execute([$mood, $happiness, $targetId]);
}

function getFinanceOverview($pdo, $userId)
{
    $monthStart = date('Y-m-01');
    $today = date('Y-m-d');
    $daysElapsed = max(1, (int)date('j'));
    $daysInMonth = (int)date('t');

    $stmt = $pdo->prepare("
        SELECT category, SUM(amount) AS spent
        FROM transactions
        WHERE user_id = ? AND type = 'withdrawal' AND transaction_date BETWEEN ? AND ?
        GROUP BY category
    ");
    $stmt->execute([$userId, $monthStart, $today]);
    $spentRows = $stmt->fetchAll();
    $spentByCategory = [];
    foreach ($spentRows as $row) {
        $spentByCategory[$row['category'] ?: 'General'] = (float)$row['spent'];
    }

    $budgets = getBudgetRows($pdo, $userId);
    $budgetSummary = [];
    foreach ($budgets as $budget) {
        $spent = $spentByCategory[$budget['category']] ?? 0;
        $limit = (float)$budget['monthly_limit'];
        $budgetSummary[] = [
            'id' => (int)$budget['id'],
            'category' => $budget['category'],
            'monthly_limit' => $limit,
            'spent' => $spent,
            'remaining' => max(0, $limit - $spent),
            'percent' => $limit > 0 ? round(($spent / $limit) * 100, 1) : 0,
            'status' => $limit > 0 && $spent >= $limit ? 'over' : ($limit > 0 && $spent >= $limit * 0.8 ? 'warning' : 'ok')
        ];
    }

    $stmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) AS saved,
            COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS spent
        FROM transactions
        WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
    ");
    $stmt->execute([$userId, $monthStart, $today]);
    $monthTotals = $stmt->fetch();
    $monthSaved = (float)$monthTotals['saved'];
    $monthSpent = (float)$monthTotals['spent'];
    $projectedSpending = round(($monthSpent / $daysElapsed) * $daysInMonth, 2);

    $stmt = $pdo->prepare("
        SELECT *
        FROM recurring_entries
        WHERE user_id = ? AND is_active = 1
        ORDER BY next_run_date ASC
        LIMIT 8
    ");
    $stmt->execute([$userId]);
    $recurring = $stmt->fetchAll();

    $stmt = $pdo->prepare("
        SELECT r.*, t.id AS transaction_id
        FROM receipts r
        LEFT JOIN transactions t
            ON t.user_id = r.user_id
            AND t.type = 'withdrawal'
            AND t.amount = r.total_price
            AND t.transaction_date = r.receipt_date
            AND t.note LIKE CONCAT('Receipt: ', r.shop_name, '%')
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    ");
    $stmt->execute([$userId]);
    $receipts = $stmt->fetchAll();
    foreach ($receipts as &$receipt) {
        $receipt['items'] = json_decode($receipt['items'] ?? '[]', true);
    }

    $stmt = $pdo->prepare("
        SELECT *
        FROM targets
        WHERE user_id = ? AND (category = 'Emergency' OR name LIKE '%emergency%')
        ORDER BY status = 'active' DESC, created_at DESC
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $emergency = $stmt->fetch();

    $stmt = $pdo->prepare("SELECT active_target_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $activeTargetId = $stmt->fetchColumn();
    $activeTarget = null;
    if ($activeTargetId) {
        $stmt = $pdo->prepare("SELECT * FROM targets WHERE id = ? AND user_id = ?");
        $stmt->execute([$activeTargetId, $userId]);
        $activeTarget = $stmt->fetch();
    }

    $dailyNet = ($monthSaved - $monthSpent) / $daysElapsed;
    $goalForecast = null;
    if ($activeTarget) {
        $remaining = max(0, (float)$activeTarget['target_amount'] - (float)$activeTarget['current_amount']);
        $daysToGoal = $dailyNet > 0 ? (int)ceil($remaining / $dailyNet) : null;
        $goalForecast = [
            'target_name' => $activeTarget['name'],
            'remaining' => $remaining,
            'daily_net' => round($dailyNet, 2),
            'days_to_goal' => $daysToGoal,
            'estimated_date' => $daysToGoal ? date('Y-m-d', strtotime("+$daysToGoal days")) : null
        ];
    }

    $claimsStmt = $pdo->prepare("SELECT mission_id FROM mission_claims WHERE user_id = ?");
    $claimsStmt->execute([$userId]);
    $claimed = array_flip(array_column($claimsStmt->fetchAll(), 'mission_id'));

    $noShoppingDays = countNoSpendDays($pdo, $userId, 'Shopping', 3);
    $missions = [
        [
            'id' => 'save_once_today_' . date('Ymd'),
            'title' => 'Save once today',
            'desc' => 'Record any savings deposit today.',
            'progress' => hasTransactionToday($pdo, $userId, 'deposit') ? 1 : 0,
            'target' => 1,
            'reward' => 25
        ],
        [
            'id' => 'no_shopping_3_' . date('YW'),
            'title' => '3 days no shopping',
            'desc' => 'Avoid Shopping expenses for 3 separate days this week.',
            'progress' => $noShoppingDays,
            'target' => 3,
            'reward' => 60
        ],
        [
            'id' => 'under_budget_' . date('Ym'),
            'title' => 'Stay under every budget',
            'desc' => 'Keep all monthly category budgets under 100%.',
            'progress' => budgetsAreHealthy($budgetSummary) ? 1 : 0,
            'target' => 1,
            'reward' => 80
        ]
    ];

    foreach ($missions as &$mission) {
        $mission['completed'] = $mission['progress'] >= $mission['target'];
        $mission['claimed'] = isset($claimed[$mission['id']]);
    }

    return [
        'month' => [
            'saved' => $monthSaved,
            'spent' => $monthSpent,
            'net' => $monthSaved - $monthSpent,
            'projected_spending' => $projectedSpending
        ],
        'budgets' => $budgetSummary,
        'recurring' => $recurring,
        'forecast' => $goalForecast,
        'missions' => $missions,
        'receipts' => $receipts,
        'emergency' => $emergency,
        'export_url' => 'finance/export'
    ];
}

function hasTransactionToday($pdo, $userId, $type)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = ? AND type = ? AND transaction_date = CURDATE()");
    $stmt->execute([$userId, $type]);
    return (int)$stmt->fetchColumn() > 0;
}

function countNoSpendDays($pdo, $userId, $category, $targetDays)
{
    $start = date('Y-m-d', strtotime('monday this week'));
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT transaction_date)
        FROM transactions
        WHERE user_id = ? AND type = 'withdrawal' AND category = ? AND transaction_date BETWEEN ? AND ?
    ");
    $stmt->execute([$userId, $category, $start, $today]);
    $shoppingDays = (int)$stmt->fetchColumn();
    $daysElapsed = max(1, floor((strtotime($today) - strtotime($start)) / 86400) + 1);
    return min($targetDays, max(0, $daysElapsed - $shoppingDays));
}

function budgetsAreHealthy($budgetSummary)
{
    if (!$budgetSummary) {
        return false;
    }

    foreach ($budgetSummary as $budget) {
        if ($budget['monthly_limit'] > 0 && $budget['spent'] > $budget['monthly_limit']) {
            return false;
        }
    }

    return true;
}

function checkAchievements($pdo, $userId)
{

    $userId = (int)$userId;

    // First Saver
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = ?");
    $stmt->execute([$userId]);
    $count = (int)$stmt->fetchColumn();

    $pdo->prepare("
        UPDATE achievements
        SET progress = ?, is_unlocked = ?
        WHERE user_id = ? AND title = 'First Saver'
    ")->execute([
        $count,
        ($count >= 1 ? 1 : 0),
        $userId
    ]);

    // Week Saver
    $stmt = $pdo->prepare("SELECT streak_days FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $streak = (int)$stmt->fetchColumn();

    $pdo->prepare("
        UPDATE achievements
        SET progress = ?, is_unlocked = ?
        WHERE user_id = ? AND title = 'Week Saver'
    ")->execute([
        $streak,
        ($streak >= 7 ? 1 : 0),
        $userId
    ]);

    // Goal Getter
    $stmt = $pdo->prepare("
        SELECT MAX(current_amount / target_amount * 100)
        FROM targets
        WHERE user_id = ? AND status = 'active'
    ");

    $stmt->execute([$userId]);

    $maxProgress = (float)($stmt->fetchColumn() ?: 0);

    $pdo->prepare("
        UPDATE achievements
        SET progress = ?, is_unlocked = ?
        WHERE user_id = ? AND title = 'Goal Getter'
    ")->execute([
        $maxProgress,
        ($maxProgress >= 50 ? 1 : 0),
        $userId
    ]);

    // Money Master
    $stmt = $pdo->prepare("SELECT total_saved FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    $saved = (float)$stmt->fetchColumn();

    $pdo->prepare("
        UPDATE achievements
        SET progress = ?, is_unlocked = ?
        WHERE user_id = ? AND title = 'Money Master'
    ")->execute([
        $saved,
        ($saved >= 100000 ? 1 : 0),
        $userId
    ]);

    // Diamond Hands
    $stmt = $pdo->prepare("
        SELECT total_targets_completed
        FROM users
        WHERE id = ?
    ");

    $stmt->execute([$userId]);

    $completed = (int)$stmt->fetchColumn();

    $pdo->prepare("
        UPDATE achievements
        SET progress = ?, is_unlocked = ?
        WHERE user_id = ? AND title = 'Diamond Hands'
    ")->execute([
        $completed,
        ($completed >= 5 ? 1 : 0),
        $userId
    ]);

    // unlocked_at
    $pdo->prepare("
        UPDATE achievements
        SET unlocked_at =
            IF(is_unlocked = 1 AND unlocked_at IS NULL, NOW(), unlocked_at)
        WHERE user_id = ?
    ")->execute([$userId]);
}

function updateRank($pdo, $userId)
{
    $stmt = $pdo->prepare("SELECT total_targets_completed FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $completed = $stmt->fetchColumn();
    $rank = 'Bronze';
    if ($completed >= 20) $rank = 'Platinum';
    elseif ($completed >= 10) $rank = 'Diamond';
    elseif ($completed >= 5) $rank = 'Gold';
    elseif ($completed >= 1) $rank = 'Silver';
    $pdo->prepare("UPDATE users SET `rank` = ? WHERE id = ? AND `rank` != ?")->execute([$rank, $userId, $rank]);
}

errorResponse(
    'Endpoint not found. Path=' . $path .
        ' Method=' . $method,
    404
);
