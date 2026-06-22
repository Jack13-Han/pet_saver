ALTER TABLE transactions
  MODIFY target_id INT DEFAULT NULL,
  ADD COLUMN category VARCHAR(50) DEFAULT 'General' AFTER type;

CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(50) NOT NULL,
  monthly_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_budget_category (user_id, category)
);

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
);

CREATE TABLE IF NOT EXISTS mission_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mission_id VARCHAR(80) NOT NULL,
  reward_coins INT NOT NULL DEFAULT 0,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_mission (user_id, mission_id)
);
