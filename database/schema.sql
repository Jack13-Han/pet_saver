-- Pet Saver Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE TABLE
    users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        coins INT DEFAULT 1000,
        `rank` ENUM ('Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum') DEFAULT 'Bronze',
        streak_days INT DEFAULT 0,
        last_active DATE DEFAULT NULL,
        total_saved DECIMAL(15, 2) DEFAULT 0,
        total_targets_completed INT DEFAULT 0,
        active_target_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE
    targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        target_amount DECIMAL(15, 2) NOT NULL,
        current_amount DECIMAL(15, 2) DEFAULT 0,
        category VARCHAR(50) DEFAULT 'General',
        deadline DATE,
        status ENUM ('active', 'completed', 'failed') DEFAULT 'active',
        avatar_type ENUM ('dog', 'cat', 'tree', 'bird', 'rabbit') DEFAULT 'dog',
        avatar_name VARCHAR(50) DEFAULT 'Mochi',
        completion_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

CREATE TABLE
    avatars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_id INT NOT NULL,
        happiness INT DEFAULT 50 CHECK (happiness BETWEEN 0 AND 100),
        energy INT DEFAULT 50 CHECK (energy BETWEEN 0 AND 100),
        fullness INT DEFAULT 50 CHECK (fullness BETWEEN 0 AND 100),
        cleanliness INT DEFAULT 50 CHECK (cleanliness BETWEEN 0 AND 100),
        level INT DEFAULT 1,
        exp INT DEFAULT 0,
        accessories JSON DEFAULT '[]',
        mood ENUM ('happy', 'neutral', 'sad', 'dirty', 'celebrating') DEFAULT 'neutral',
        FOREIGN KEY (target_id) REFERENCES targets (id) ON DELETE CASCADE
    );

CREATE TABLE
    transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_id INT NOT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        type ENUM ('deposit', 'withdrawal') NOT NULL,
        category VARCHAR(50) DEFAULT 'General',
        note VARCHAR(255),
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (target_id) REFERENCES targets (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

CREATE TABLE
    accessories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price INT NOT NULL,
        icon VARCHAR(50) DEFAULT 'hat',
        category ENUM (
            'hat',
            'glasses',
            'scarf',
            'collar',
            'toy',
            'background'
        ) DEFAULT 'hat',
        effect_happiness INT DEFAULT 0,
        effect_energy INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        accessory_id INT NOT NULL,
        is_equipped BOOLEAN DEFAULT FALSE,
        target_id INT DEFAULT NULL,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (accessory_id) REFERENCES accessories (id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES targets (id) ON DELETE SET NULL,
        UNIQUE KEY unique_user_accessory_target (user_id, accessory_id, target_id)
    );

CREATE TABLE
    achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'trophy',
        tier ENUM ('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
        progress INT DEFAULT 0,
        max_progress INT DEFAULT 100,
        is_unlocked BOOLEAN DEFAULT FALSE,
        unlocked_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

CREATE TABLE
    receipts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        image_path LONGTEXT,
        shop_name VARCHAR(100),
        total_price DECIMAL(15, 2),
        receipt_date DATE,
        category VARCHAR(50) DEFAULT 'Shopping',
        items JSON,
        target_id INT,
        is_processed BOOLEAN DEFAULT FALSE,
        ocr_confidence DECIMAL(5, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES targets (id) ON DELETE SET NULL
    );

CREATE TABLE
    activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        activity_type ENUM (
            'save',
            'receipt_scan',
            'purchase',
            'goal_complete',
            'login'
        ) NOT NULL,
        points INT DEFAULT 0,
        activity_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

-- Default Accessories
INSERT INTO
    accessories (
        name,
        description,
        price,
        icon,
        category,
        effect_happiness
    )
VALUES
    (
        'Red Ball',
        'A bouncy ball for play time',
        200,
        'ball',
        'toy',
        10
    ),
    (
        'Cool Cap',
        'Stylish cap for your avatar',
        300,
        'hat',
        'hat',
        5
    ),
    (
        'Reading Glasses',
        'Makes your avatar look smart',
        400,
        'glasses',
        'glasses',
        5
    ),
    (
        'Warm Scarf',
        'Cozy scarf for cold days',
        500,
        'scarf',
        'scarf',
        8
    ),
    (
        'Golden Collar',
        'Premium collar for champions',
        1000,
        'collar',
        'collar',
        15
    ),
    (
        'Flower Pot',
        'Decorate your background',
        600,
        'plant',
        'background',
        10
    ),
    (
        'Party Hat',
        'Celebrate your achievements',
        800,
        'party-hat',
        'hat',
        20
    ),
    (
        'Sunglasses',
        'Cool shades for sunny days',
        700,
        'sunglasses',
        'glasses',
        12
    );