-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1:3306
-- 生成日時: 2026-06-02 08:36:50
-- サーバのバージョン： 8.4.0
-- PHP のバージョン: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- データベース: `pet_saver`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `accessories`
--

CREATE TABLE `accessories` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` int NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'hat',
  `category` enum('hat','glasses','scarf','collar','toy','background','avatar') COLLATE utf8mb4_unicode_ci DEFAULT 'hat',
  `effect_happiness` int DEFAULT '0',
  `effect_energy` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `accessories`
--

INSERT INTO `accessories` (`id`, `name`, `description`, `price`, `icon`, `category`, `effect_happiness`, `effect_energy`, `created_at`) VALUES
(1, 'Red Ball', 'A bouncy ball for play time', 200, 'ball', 'toy', 10, 0, '2026-05-27 16:52:44'),
(2, 'Cool Cap', 'Stylish cap for your avatar', 300, 'hat', 'hat', 5, 0, '2026-05-27 16:52:44'),
(3, 'Reading Glasses', 'Makes your avatar look smart', 400, 'glasses', 'glasses', 5, 0, '2026-05-27 16:52:44'),
(4, 'Warm Scarf', 'Cozy scarf for cold days', 500, 'scarf', 'scarf', 8, 0, '2026-05-27 16:52:44'),
(5, 'Golden Collar', 'Premium collar for champions', 1000, 'collar', 'collar', 15, 0, '2026-05-27 16:52:44'),
(6, 'Flower Pot', 'Decorate your background', 600, 'plant', 'background', 10, 0, '2026-05-27 16:52:44'),
(7, 'Party Hat', 'Celebrate your achievements', 800, 'party-hat', 'hat', 20, 0, '2026-05-27 16:52:44'),
(8, 'Sunglasses', 'Cool shades for sunny days', 700, 'sunglasses', 'glasses', 12, 0, '2026-05-27 16:52:44'),
(9, 'Rabbit Avatar', 'Unlock the rabbit avatar for new goals', 600, 'rabbit', 'avatar', 0, 0, '2026-06-18 00:00:00'),
(10, 'Pig Avatar', 'Unlock the pig avatar for new goals', 700, 'pig', 'avatar', 0, 0, '2026-06-18 00:00:00'),
(11, 'Bird Avatar', 'Unlock the bird avatar for new goals', 800, 'bird', 'avatar', 0, 0, '2026-06-18 00:00:00'),
(12, 'Naruto Avatar', 'Unlock the Naruto avatar for new goals', 900, 'naruto', 'avatar', 0, 0, '2026-06-18 00:00:00'),
(13, 'Pikachu Avatar', 'Unlock the Pikachu avatar for new goals', 1000, 'pikachu', 'avatar', 0, 0, '2026-06-18 00:00:00'),
(14, 'Chiikawa Avatar', 'Unlock the Chiikawa avatar for new goals', 1100, 'chiikawa', 'avatar', 0, 0, '2026-06-18 00:00:00'),
(15, 'Lufy Avatar', 'Unlock the Lufy avatar for new goals', 1200, 'lufy', 'avatar', 0, 0, '2026-06-18 00:00:00');

-- --------------------------------------------------------

--
-- テーブルの構造 `achievements`
--

CREATE TABLE `achievements` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'trophy',
  `tier` enum('bronze','silver','gold','platinum','diamond') COLLATE utf8mb4_unicode_ci DEFAULT 'bronze',
  `progress` int DEFAULT '0',
  `max_progress` int DEFAULT '100',
  `is_unlocked` tinyint(1) DEFAULT '0',
  `unlocked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `achievements`
--

INSERT INTO `achievements` (`id`, `user_id`, `title`, `description`, `icon`, `tier`, `progress`, `max_progress`, `is_unlocked`, `unlocked_at`, `created_at`) VALUES
(1, 1, 'First Saver', 'Save for the first time', 'piggy-bank', 'bronze', 71, 1, 1, '2026-05-28 15:33:12', '2026-05-27 16:53:20'),
(2, 1, 'Week Saver', 'Save 7 days in a row', 'calendar', 'silver', 1, 7, 0, NULL, '2026-05-27 16:53:20'),
(3, 1, 'Goal Getter', 'Reach 50% of a goal', 'target', 'silver', 100, 50, 1, '2026-05-28 15:33:50', '2026-05-27 16:53:20'),
(4, 1, 'Money Master', 'Save 100000 total', 'crown', 'gold', 257703, 100000, 1, '2026-05-29 04:10:23', '2026-05-27 16:53:20'),
(5, 1, 'Shopaholic', 'Buy 5 accessories', 'shopping-bag', 'bronze', 1, 5, 0, NULL, '2026-05-27 16:53:20'),
(6, 1, 'Receipt Pro', 'Scan 10 receipts', 'camera', 'silver', 0, 10, 0, NULL, '2026-05-27 16:53:20'),
(7, 1, 'Diamond Hands', 'Complete 5 targets', 'gem', 'platinum', 0, 5, 0, NULL, '2026-05-27 16:53:20');

-- --------------------------------------------------------

--
-- テーブルの構造 `activity_log`
--

CREATE TABLE `activity_log` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `activity_type` enum('save','receipt_scan','purchase','goal_complete','login','care') COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int DEFAULT '0',
  `activity_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `avatars`
--

CREATE TABLE `avatars` (
  `id` int NOT NULL,
  `target_id` int NOT NULL,
  `happiness` int DEFAULT '50',
  `energy` int DEFAULT '50',
  `fullness` int DEFAULT '50',
  `cleanliness` int DEFAULT '50',
  `level` int DEFAULT '1',
  `exp` int DEFAULT '0',
  `accessories` json DEFAULT NULL,
  `mood` enum('happy','neutral','sad','dirty','celebrating') COLLATE utf8mb4_unicode_ci DEFAULT 'neutral'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `avatars`
--

INSERT INTO `avatars` (`id`, `target_id`, `happiness`, `energy`, `fullness`, `cleanliness`, `level`, `exp`, `accessories`, `mood`) VALUES
(2, 2, 100, 100, 100, 100, 4, 380, NULL, 'happy'),
(4, 4, 100, 0, 60, 50, 3, 20, NULL, 'dirty');

-- --------------------------------------------------------

--
-- テーブルの構造 `inventory`
--

CREATE TABLE `inventory` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `accessory_id` int NOT NULL,
  `is_equipped` tinyint(1) DEFAULT '0',
  `target_id` int DEFAULT NULL,
  `purchased_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `inventory`
--

INSERT INTO `inventory` (`id`, `user_id`, `accessory_id`, `is_equipped`, `target_id`, `purchased_at`) VALUES
(3, 1, 4, 0, NULL, '2026-05-28 15:37:36');

-- --------------------------------------------------------

--
-- テーブルの構造 `receipts`
--

CREATE TABLE `receipts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shop_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_price` decimal(15,2) DEFAULT NULL,
  `receipt_date` date DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Shopping',
  `items` json DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `is_processed` tinyint(1) DEFAULT '0',
  `ocr_confidence` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `targets`
--

CREATE TABLE `targets` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `target_amount` decimal(15,2) NOT NULL,
  `current_amount` decimal(15,2) DEFAULT '0.00',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `deadline` date DEFAULT NULL,
  `status` enum('active','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `avatar_type` enum('dog','cat','tree','bird','rabbit','pig','naruto','pikachu','chiikawa','lufy') COLLATE utf8mb4_unicode_ci DEFAULT 'dog',
  `avatar_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Mochi',
  `completion_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `targets`
--

INSERT INTO `targets` (`id`, `user_id`, `name`, `description`, `target_amount`, `current_amount`, `category`, `deadline`, `status`, `avatar_type`, `avatar_name`, `completion_date`, `created_at`) VALUES
(2, 1, 'school fee', '', 40000.00, 39999.00, 'Education', '2003-03-09', 'active', 'cat', 'Mochi', NULL, '2026-05-28 15:10:17'),
(4, 1, 'kkk', '', 7777.00, 0.00, 'General', '2026-05-13', 'active', 'cat', 'Mochi', NULL, '2026-05-29 16:18:49');

-- --------------------------------------------------------

--
-- テーブルの構造 `transactions`
--

CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `target_id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('deposit','withdrawal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `transactions`
--

INSERT INTO `transactions` (`id`, `target_id`, `user_id`, `amount`, `type`, `note`, `transaction_date`, `created_at`) VALUES
(18, 2, 1, 100.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:33:12'),
(19, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:33:17'),
(20, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-28', '2026-05-28 15:33:21'),
(21, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-28', '2026-05-28 15:33:24'),
(22, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:33:47'),
(23, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:33:50'),
(24, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:33:53'),
(25, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-28', '2026-05-28 15:50:38'),
(26, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-28', '2026-05-28 15:50:43'),
(27, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:50:53'),
(28, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-28', '2026-05-28 15:51:01'),
(29, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:51:06'),
(30, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:51:09'),
(33, 2, 1, 1000.00, 'deposit', 'Daily savings', '2026-05-28', '2026-05-28 15:51:25'),
(36, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 02:12:14'),
(37, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 02:12:22'),
(38, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 02:13:30'),
(39, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 02:13:34'),
(40, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 03:57:29'),
(41, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 03:57:34'),
(42, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 03:57:37'),
(43, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 03:57:42'),
(44, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 04:05:37'),
(46, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 04:10:23'),
(47, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 04:10:26'),
(51, 4, 1, 5000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 17:16:43'),
(53, 4, 1, 1000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 17:16:54'),
(54, 4, 1, 1000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 18:16:34'),
(55, 4, 1, 100.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 18:16:40'),
(56, 4, 1, 100.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 18:16:44'),
(58, 4, 1, 500.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 18:16:50'),
(60, 4, 1, 76.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 18:17:10'),
(62, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-05-29', '2026-05-29 18:17:48'),
(63, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 18:18:01'),
(64, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 18:18:04'),
(65, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-29', '2026-05-29 18:18:08'),
(69, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-05-30', '2026-05-30 17:25:37'),
(70, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-05-30', '2026-05-30 17:25:43'),
(71, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-05-30', '2026-05-30 17:25:46'),
(72, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-05-30', '2026-05-30 17:25:50'),
(73, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-05-30', '2026-05-30 17:25:56'),
(74, 2, 1, 500.00, 'deposit', 'Daily savings', '2026-05-30', '2026-05-30 17:26:00'),
(75, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-31', '2026-05-31 15:25:52'),
(76, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-31', '2026-05-31 15:25:55'),
(77, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-31', '2026-05-31 15:25:59'),
(78, 4, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-31', '2026-05-31 15:26:58'),
(81, 4, 1, 7776.00, 'deposit', 'Daily savings', '2026-05-31', '2026-05-31 15:27:14'),
(82, 4, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-31', '2026-05-31 15:47:27'),
(83, 4, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-05-31', '2026-05-31 15:47:34'),
(85, 4, 1, 7776.00, 'deposit', 'Daily savings', '2026-05-31', '2026-05-31 15:47:46'),
(86, 4, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-06-01', '2026-06-01 00:16:49'),
(87, 4, 1, 7776.00, 'deposit', 'Daily savings', '2026-06-01', '2026-06-01 01:32:12'),
(90, 4, 1, 4444.00, 'withdrawal', 'Expense deduction', '2026-06-01', '2026-06-01 01:32:33'),
(91, 4, 1, 1000.00, 'withdrawal', 'Expense deduction', '2026-06-01', '2026-06-01 01:32:39'),
(92, 4, 1, 1000.00, 'withdrawal', 'Expense deduction', '2026-06-01', '2026-06-01 01:32:43'),
(93, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-06-01', '2026-06-01 01:57:26'),
(94, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-06-01', '2026-06-01 01:57:32'),
(95, 2, 1, 1000.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 04:29:08'),
(96, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 04:29:16'),
(97, 2, 1, 5000.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 04:29:18'),
(98, 4, 1, 5000.00, 'withdrawal', 'Expense deduction', '2026-06-02', '2026-06-02 06:03:39'),
(99, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-06-02', '2026-06-02 06:04:17'),
(100, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-06-02', '2026-06-02 06:04:20'),
(101, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 06:05:25'),
(102, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 06:10:30'),
(103, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-06-02', '2026-06-02 06:10:37'),
(104, 2, 1, 10000.00, 'withdrawal', 'Expense deduction', '2026-06-02', '2026-06-02 06:10:41'),
(105, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 06:10:47'),
(106, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 06:10:49'),
(107, 2, 1, 10000.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 06:10:52'),
(111, 2, 1, 8999.00, 'deposit', 'Daily savings', '2026-06-02', '2026-06-02 06:11:23');

-- --------------------------------------------------------

--
-- テーブルの構造 `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coins` int DEFAULT '1000',
  `rank` enum('Bronze','Silver','Gold','Diamond','Platinum') COLLATE utf8mb4_unicode_ci DEFAULT 'Bronze',
  `streak_days` int DEFAULT '0',
  `last_active` date DEFAULT NULL,
  `total_saved` decimal(15,2) DEFAULT '0.00',
  `total_targets_completed` int DEFAULT '0',
  `public_profile` tinyint(1) NOT NULL DEFAULT '0',
  `show_on_leaderboard` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active_target_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `coins`, `rank`, `streak_days`, `last_active`, `total_saved`, `total_targets_completed`, `public_profile`, `show_on_leaderboard`, `created_at`, `updated_at`, `active_target_id`) VALUES
(1, 'khant', 'khant@gmail.com', '$2y$10$oT2kykzKNGjGtfQvxjVm6u0B5vovZW6NsVdK9rm7ANPDNaAVtib/K', 500, 'Bronze', 1, '2026-06-02', 257703.00, 0, 0, 1, '2026-05-27 16:53:20', '2026-06-02 06:11:23', 2);

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `accessories`
--
ALTER TABLE `accessories`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `achievements`
--
ALTER TABLE `achievements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `avatars`
--
ALTER TABLE `avatars`
  ADD PRIMARY KEY (`id`),
  ADD KEY `target_id` (`target_id`);

--
-- テーブルのインデックス `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_accessory_target` (`user_id`,`accessory_id`,`target_id`),
  ADD KEY `accessory_id` (`accessory_id`),
  ADD KEY `target_id` (`target_id`);

--
-- テーブルのインデックス `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `target_id` (`target_id`);

--
-- テーブルのインデックス `targets`
--
ALTER TABLE `targets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `target_id` (`target_id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `accessories`
--
ALTER TABLE `accessories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- テーブルの AUTO_INCREMENT `achievements`
--
ALTER TABLE `achievements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- テーブルの AUTO_INCREMENT `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `avatars`
--
ALTER TABLE `avatars`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- テーブルの AUTO_INCREMENT `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- テーブルの AUTO_INCREMENT `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `targets`
--
ALTER TABLE `targets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- テーブルの AUTO_INCREMENT `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=112;

--
-- テーブルの AUTO_INCREMENT `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `achievements`
--
ALTER TABLE `achievements`
  ADD CONSTRAINT `achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `activity_log`
--
ALTER TABLE `activity_log`
  ADD CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `avatars`
--
ALTER TABLE `avatars`
  ADD CONSTRAINT `avatars_ibfk_1` FOREIGN KEY (`target_id`) REFERENCES `targets` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`accessory_id`) REFERENCES `accessories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_ibfk_3` FOREIGN KEY (`target_id`) REFERENCES `targets` (`id`) ON DELETE SET NULL;

--
-- テーブルの制約 `receipts`
--
ALTER TABLE `receipts`
  ADD CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `receipts_ibfk_2` FOREIGN KEY (`target_id`) REFERENCES `targets` (`id`) ON DELETE SET NULL;

--
-- テーブルの制約 `targets`
--
ALTER TABLE `targets`
  ADD CONSTRAINT `targets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`target_id`) REFERENCES `targets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
