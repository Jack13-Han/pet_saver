import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "ko", label: "Korean" },
  { code: "my", label: "Burmese" },
  { code: "zh", label: "Chinese" },
];

const DICTIONARIES = {
  ja: {
    "Loading Pet Saver...": "Pet Saverを読み込み中...",
    "Grow with your savings": "貯金と一緒に育てよう",
    Home: "ホーム",
    Goals: "目標",
    Expenses: "支出",
    Insights: "分析",
    "Expense Analyst": "支出アナリスト",
    "Receipt Scanner": "レシートスキャナー",
    Shop: "ショップ",
    Achievements: "実績",
    Rankings: "ランキング",
    Settings: "設定",
    Coins: "コイン",
    Logout: "ログアウト",
    "Keep saving to help your pet grow!": "貯金を続けてペットを育てよう！",
    "Settings ⚙️": "設定 ⚙️",
    "Manage your account and preferences": "アカウントと設定を管理",
    Profile: "プロフィール",
    Notifications: "通知",
    Privacy: "プライバシー",
    Appearance: "表示",
    "Profile Information": "プロフィール情報",
    Username: "ユーザー名",
    Email: "メール",
    "Save Changes": "変更を保存",
    Saving: "保存中",
    "Saving...": "保存中...",
    "Notification Preferences": "通知設定",
    "Daily Saving Reminder": "毎日の貯金リマインダー",
    "Get reminded to save every day": "毎日貯金をリマインド",
    "Goal Milestones": "目標マイルストーン",
    "Notify when you reach 25%, 50%, 75%": "25%、50%、75%達成時に通知",
    "Streak Alerts": "継続アラート",
    "Warn when streak is about to break": "継続が切れそうな時に警告",
    "Achievement Unlocks": "実績解除",
    "Celebrate when you earn badges": "バッジ獲得時にお祝い",
    "Weekly Summary": "週間サマリー",
    "Weekly report of savings": "貯金の週間レポート",
    "Privacy & Security": "プライバシーとセキュリティ",
    "Public Profile": "公開プロフィール",
    "Allow others to see your stats": "他の人に統計を表示",
    "Show on Leaderboard": "ランキングに表示",
    "Appear in global rankings": "全体ランキングに表示",
    "Share Achievements": "実績を共有",
    "Let friends see your badges": "友達にバッジを表示",
    "Change Password": "パスワード変更",
    "Dark Mode": "ダークモード",
    "Switch to dark theme": "暗いテーマに切り替え",
    Language: "言語",
    "Choose app language": "アプリの言語を選択",
    "Compact View": "コンパクト表示",
    "Show more items per page": "1ページに多く表示",
    Animations: "アニメーション",
    "Enable smooth animations": "滑らかなアニメーションを有効化",
    "Expenses & Savings 📊": "支出と貯金 📊",
    "Track your spending and savings clearly": "支出と貯金をわかりやすく管理",
    "Total Saved": "貯金合計",
    "Total Spent": "支出合計",
    "Net Savings": "純貯金",
    "Completed Goals": "達成した目標",
    "Savings Streak": "貯金ストリーク",
    "Saver Rank": "セーバーランク",
    "Search transactions...": "取引を検索...",
    "Expense Breakdown": "支出内訳",
    "Daily Spending": "日別支出",
    "Expenses List": "支出リスト",
    "Savings List": "貯金リスト",
    "No expenses found": "支出がありません",
    "No savings found": "貯金がありません",
    "Used money": "使ったお金",
    "Saved money": "貯金したお金",
    "Leaderboard 🏆": "ランキング 🏆",
    "Compete with other savers and climb the ranks!": "他のユーザーと競ってランクを上げよう！",
    You: "あなた",
    "Receipt Scanner 📸": "レシートスキャナー 📸",
    "Snap a receipt, auto-detect details, save instantly!": "レシートを撮って自動読み取り、すぐ保存！",
    "BEST FEATURE": "おすすめ機能",
    "Take a Photo or Upload Receipt": "写真を撮るかレシートをアップロード",
    "Drag & drop or click to select an image": "ドラッグ＆ドロップ、またはクリックして画像選択",
    "Choose File": "ファイルを選択",
    "Gemini AI is detecting shop, price, and date": "Gemini AIが店名、金額、日付を検出中",
    "Shop Name": "店名",
    "Total Price": "合計金額",
    Date: "日付",
    Category: "カテゴリ",
    "Save Receipt": "レシートを保存",
    "Scan Another": "もう一度スキャン",
    "Shopping": "買い物",
    "Dashboard": "ダッシュボード",
    "Welcome back": "おかえりなさい",
    "Quick Save": "クイック貯金",
    "Current Goal": "現在の目標",
    "Edit Goal": "目標を編集",
    "Pet Status": "ペット状態",
    "View All": "すべて表示",
    "Take Care of": "お世話する:",
    "Come back tomorrow for more activities!": "明日またアクティビティをしよう！",
    "Tip: Keep your pet happy by saving money and completing challenges!": "ヒント: 貯金とチャレンジ達成でペットを喜ばせよう！",
    "Earn coins by saving and completing challenges!": "貯金とチャレンジ達成でコインを獲得！",
    "No active goal": "有効な目標がありません",
    "Create Goal": "目標を作成",
    "My Goals": "私の目標",
    "Create New Goal": "新しい目標を作成",
    "Target Amount": "目標金額",
    "Deadline": "期限",
    "Cancel": "キャンセル",
    Create: "作成",
    Level: "レベル",
    goals: "目標",
    "days left": "日残り",
    Saved: "貯金済み",
  },
  ko: {
    "Loading Pet Saver...": "Pet Saver 로딩 중...",
    "Grow with your savings": "저축과 함께 성장하세요",
    Home: "홈",
    Goals: "목표",
    Expenses: "지출",
    Insights: "인사이트",
    "Expense Analyst": "지출 분석가",
    "Receipt Scanner": "영수증 스캐너",
    Shop: "상점",
    Achievements: "업적",
    Rankings: "랭킹",
    Settings: "설정",
    Coins: "코인",
    Logout: "로그아웃",
    "Keep saving to help your pet grow!": "계속 저축해서 펫을 키워보세요!",
    "Settings ⚙️": "설정 ⚙️",
    "Manage your account and preferences": "계정과 환경설정을 관리하세요",
    Profile: "프로필",
    Notifications: "알림",
    Privacy: "개인정보",
    Appearance: "화면",
    "Profile Information": "프로필 정보",
    Username: "사용자 이름",
    Email: "이메일",
    "Save Changes": "변경 저장",
    Saving: "저장 중",
    "Saving...": "저장 중...",
    "Notification Preferences": "알림 설정",
    "Daily Saving Reminder": "일일 저축 알림",
    "Get reminded to save every day": "매일 저축 알림 받기",
    "Goal Milestones": "목표 단계",
    "Notify when you reach 25%, 50%, 75%": "25%, 50%, 75% 달성 시 알림",
    "Streak Alerts": "연속 기록 알림",
    "Warn when streak is about to break": "연속 기록이 끊기기 전 알림",
    "Achievement Unlocks": "업적 달성",
    "Celebrate when you earn badges": "배지를 얻으면 축하",
    "Weekly Summary": "주간 요약",
    "Weekly report of savings": "저축 주간 리포트",
    "Privacy & Security": "개인정보 및 보안",
    "Public Profile": "공개 프로필",
    "Allow others to see your stats": "다른 사람이 내 통계를 볼 수 있음",
    "Show on Leaderboard": "리더보드에 표시",
    "Appear in global rankings": "전체 랭킹에 표시",
    "Share Achievements": "업적 공유",
    "Let friends see your badges": "친구가 내 배지를 볼 수 있음",
    "Change Password": "비밀번호 변경",
    "Dark Mode": "다크 모드",
    "Switch to dark theme": "어두운 테마로 전환",
    Language: "언어",
    "Choose app language": "앱 언어 선택",
    "Compact View": "컴팩트 보기",
    "Show more items per page": "페이지에 더 많이 표시",
    Animations: "애니메이션",
    "Enable smooth animations": "부드러운 애니메이션 사용",
    "Expenses & Savings 📊": "지출 및 저축 📊",
    "Track your spending and savings clearly": "지출과 저축을 명확하게 관리",
    "Total Saved": "총 저축",
    "Total Spent": "총 지출",
    "Net Savings": "순저축",
    "Completed Goals": "달성한 목표",
    "Savings Streak": "저축 스트릭",
    "Saver Rank": "세이버 등급",
    "Search transactions...": "거래 검색...",
    "Expense Breakdown": "지출 분석",
    "Daily Spending": "일별 지출",
    "Expenses List": "지출 목록",
    "Savings List": "저축 목록",
    "No expenses found": "지출이 없습니다",
    "No savings found": "저축이 없습니다",
    "Used money": "사용한 돈",
    "Saved money": "저축한 돈",
    "Leaderboard 🏆": "리더보드 🏆",
    "Compete with other savers and climb the ranks!": "다른 사용자와 경쟁하고 순위를 올리세요!",
    You: "나",
    "Receipt Scanner 📸": "영수증 스캐너 📸",
    "Snap a receipt, auto-detect details, save instantly!": "영수증을 찍고 자동 인식 후 바로 저장!",
    "BEST FEATURE": "추천 기능",
    "Take a Photo or Upload Receipt": "사진 촬영 또는 영수증 업로드",
    "Drag & drop or click to select an image": "드래그 앤 드롭 또는 클릭하여 이미지 선택",
    "Choose File": "파일 선택",
    "Gemini AI is detecting shop, price, and date": "Gemini AI가 매장, 가격, 날짜를 감지 중",
    "Shop Name": "상점명",
    "Total Price": "총 금액",
    Date: "날짜",
    Category: "카테고리",
    "Save Receipt": "영수증 저장",
    "Scan Another": "다시 스캔",
    Shopping: "쇼핑",
    Dashboard: "대시보드",
    "Welcome back": "다시 오신 것을 환영합니다",
    "Quick Save": "빠른 저축",
    "Current Goal": "현재 목표",
    "Edit Goal": "목표 수정",
    "Pet Status": "펫 상태",
    "View All": "전체 보기",
    "Take Care of": "돌보기:",
    "Come back tomorrow for more activities!": "더 많은 활동은 내일 다시 해보세요!",
    "Tip: Keep your pet happy by saving money and completing challenges!": "팁: 저축하고 도전을 완료해서 펫을 행복하게 하세요!",
    "Earn coins by saving and completing challenges!": "저축과 도전 완료로 코인을 얻으세요!",
    "No active goal": "활성 목표 없음",
    "Create Goal": "목표 만들기",
    "My Goals": "내 목표",
    "Create New Goal": "새 목표 만들기",
    "Target Amount": "목표 금액",
    Deadline: "마감일",
    Cancel: "취소",
    Create: "만들기",
    Level: "레벨",
    goals: "목표",
    "days left": "일 남음",
    Saved: "저축됨",
  },
  my: {
    "Loading Pet Saver...": "Pet Saver ဖွင့်နေသည်...",
    "Grow with your savings": "စုငွေနဲ့အတူ ကြီးထွားပါ",
    Home: "မူလစာမျက်နှာ",
    Goals: "ရည်မှန်းချက်များ",
    Expenses: "အသုံးစရိတ်",
    Insights: "ခွဲခြမ်းစိတ်ဖြာမှု",
    "Expense Analyst": "အသုံးစရိတ် Analyst",
    "Receipt Scanner": "ဘောင်ချာ စကင်နာ",
    Shop: "ဆိုင်",
    Achievements: "အောင်မြင်မှုများ",
    Rankings: "အဆင့်စာရင်း",
    Settings: "ဆက်တင်",
    Coins: "ဒင်္ဂါး",
    Logout: "ထွက်မည်",
    "Keep saving to help your pet grow!": "Pet ကြီးထွားအောင် ဆက်စုပါ!",
    "Settings ⚙️": "ဆက်တင် ⚙️",
    "Manage your account and preferences": "အကောင့်နဲ့ preference တွေကို စီမံပါ",
    Profile: "ပရိုဖိုင်",
    Notifications: "အသိပေးချက်",
    Privacy: "ကိုယ်ရေးလုံခြုံမှု",
    Appearance: "အသွင်အပြင်",
    "Profile Information": "ပရိုဖိုင်အချက်အလက်",
    Username: "အသုံးပြုသူအမည်",
    Email: "အီးမေးလ်",
    "Save Changes": "ပြောင်းလဲမှု သိမ်းမည်",
    Saving: "သိမ်းနေသည်",
    "Saving...": "သိမ်းနေသည်...",
    "Notification Preferences": "အသိပေးချက် ဆက်တင်",
    "Daily Saving Reminder": "နေ့စဉ်စုငွေ သတိပေးချက်",
    "Get reminded to save every day": "နေ့တိုင်းစုရန် သတိပေးမည်",
    "Goal Milestones": "ရည်မှန်းချက်မှတ်တိုင်များ",
    "Notify when you reach 25%, 50%, 75%": "25%, 50%, 75% ရောက်လျှင် အသိပေးမည်",
    "Streak Alerts": "Streak သတိပေးချက်",
    "Warn when streak is about to break": "Streak ပျက်တော့မည်ဆို သတိပေးမည်",
    "Achievement Unlocks": "အောင်မြင်မှုဖွင့်ခြင်း",
    "Celebrate when you earn badges": "Badge ရလျှင် ဂုဏ်ပြုမည်",
    "Weekly Summary": "အပတ်စဉ် အနှစ်ချုပ်",
    "Weekly report of savings": "စုငွေ အပတ်စဉ် report",
    "Privacy & Security": "ကိုယ်ရေးလုံခြုံမှုနှင့် လုံခြုံရေး",
    "Public Profile": "Public ပရိုဖိုင်",
    "Allow others to see your stats": "အခြားသူတွေက stats ကြည့်နိုင်မည်",
    "Show on Leaderboard": "Leaderboard မှာပြမည်",
    "Appear in global rankings": "အဆင့်စာရင်းမှာ ပေါ်မည်",
    "Share Achievements": "အောင်မြင်မှုမျှဝေမည်",
    "Let friends see your badges": "သူငယ်ချင်းတွေ badge ကြည့်နိုင်မည်",
    "Change Password": "စကားဝှက်ပြောင်းမည်",
    "Dark Mode": "Dark Mode",
    "Switch to dark theme": "မှောင်သော theme သို့ပြောင်းမည်",
    Language: "ဘာသာစကား",
    "Choose app language": "App ဘာသာစကားရွေးပါ",
    "Compact View": "ကျစ်လစ်မြင်ကွင်း",
    "Show more items per page": "တစ်မျက်နှာမှာ ပိုပြမည်",
    Animations: "Animation",
    "Enable smooth animations": "ချောမွေ့သော animation ဖွင့်မည်",
    "Expenses & Savings 📊": "အသုံးစရိတ်နှင့်စုငွေ 📊",
    "Track your spending and savings clearly": "သုံးငွေနဲ့စုငွေကို ရှင်းရှင်းလင်းလင်းကြည့်ပါ",
    "Total Saved": "စုငွေစုစုပေါင်း",
    "Total Spent": "သုံးငွေစုစုပေါင်း",
    "Net Savings": "Net စုငွေ",
    "Completed Goals": "အောင်မြင်ပြီး Goal များ",
    "Savings Streak": "စုငွေ Streak",
    "Saver Rank": "Saver အဆင့်",
    "Search transactions...": "Transaction ရှာမည်...",
    "Expense Breakdown": "အသုံးစရိတ်ခွဲခြမ်း",
    "Daily Spending": "နေ့စဉ်အသုံးစရိတ်",
    "Expenses List": "အသုံးစရိတ်စာရင်း",
    "Savings List": "စုငွေစာရင်း",
    "No expenses found": "အသုံးစရိတ်မရှိပါ",
    "No savings found": "စုငွေမရှိပါ",
    "Used money": "သုံးထားသောငွေ",
    "Saved money": "စုထားသောငွေ",
    "Leaderboard 🏆": "Leaderboard 🏆",
    "Compete with other savers and climb the ranks!": "အခြားသူတွေနဲ့ယှဉ်ပြီး အဆင့်တက်ပါ!",
    You: "သင်",
    "Receipt Scanner 📸": "ဘောင်ချာ စကင်နာ 📸",
    "Snap a receipt, auto-detect details, save instantly!": "ဘောင်ချာရိုက်ပြီး အလိုအလျောက်ဖတ်၊ ချက်ချင်းသိမ်းပါ!",
    "BEST FEATURE": "အကောင်းဆုံး Feature",
    "Take a Photo or Upload Receipt": "ဓာတ်ပုံရိုက်ပါ သို့မဟုတ် ဘောင်ချာတင်ပါ",
    "Drag & drop or click to select an image": "Drag & drop သို့မဟုတ် click နှိပ်ပြီး ပုံရွေးပါ",
    "Choose File": "File ရွေးမည်",
    "Gemini AI is detecting shop, price, and date": "Gemini AI က ဆိုင်၊ စျေးနှုန်း၊ ရက်စွဲ ဖတ်နေသည်",
    "Shop Name": "ဆိုင်အမည်",
    "Total Price": "စုစုပေါင်းစျေးနှုန်း",
    Date: "ရက်စွဲ",
    Category: "အမျိုးအစား",
    "Save Receipt": "ဘောင်ချာသိမ်းမည်",
    "Scan Another": "နောက်တစ်ခုစကင်မည်",
    Shopping: "စျေးဝယ်",
    Dashboard: "Dashboard",
    "Welcome back": "ပြန်လာတာ ကြိုဆိုပါတယ်",
    "Quick Save": "အမြန်စုမည်",
    "Current Goal": "လက်ရှိရည်မှန်းချက်",
    "Edit Goal": "ရည်မှန်းချက်ပြင်မည်",
    "Pet Status": "Pet အခြေအနေ",
    "View All": "အားလုံးကြည့်မည်",
    "Take Care of": "ဂရုစိုက်မည်:",
    "Come back tomorrow for more activities!": "နောက်ထပ် activity အတွက် မနက်ဖြန်ပြန်လာပါ!",
    "Tip: Keep your pet happy by saving money and completing challenges!": "Tip: ငွေစုပြီး challenge ပြီးအောင်လုပ်ရင် pet ပျော်မယ်!",
    "Earn coins by saving and completing challenges!": "ငွေစုပြီး challenge ပြီးအောင်လုပ်ရင် coin ရမယ်!",
    "No active goal": "Active goal မရှိပါ",
    "Create Goal": "Goal ဖန်တီးမည်",
    "My Goals": "ကျွန်ုပ်၏ Goal များ",
    "Create New Goal": "Goal အသစ်ဖန်တီးမည်",
    "Target Amount": "ရည်မှန်းငွေပမာဏ",
    Deadline: "နောက်ဆုံးရက်",
    Cancel: "မလုပ်တော့ပါ",
    Create: "ဖန်တီးမည်",
    Level: "အဆင့်",
    goals: "Goal",
    "days left": "ရက်ကျန်",
    Saved: "စုထားသည်",
  },
  zh: {
    "Loading Pet Saver...": "正在加载 Pet Saver...",
    "Grow with your savings": "和你的储蓄一起成长",
    Home: "首页",
    Goals: "目标",
    Expenses: "支出",
    Insights: "洞察",
    "Expense Analyst": "支出分析师",
    "Receipt Scanner": "收据扫描",
    Shop: "商店",
    Achievements: "成就",
    Rankings: "排名",
    Settings: "设置",
    Coins: "金币",
    Logout: "退出登录",
    "Keep saving to help your pet grow!": "继续储蓄，帮助宠物成长！",
    "Settings ⚙️": "设置 ⚙️",
    "Manage your account and preferences": "管理账号和偏好",
    Profile: "个人资料",
    Notifications: "通知",
    Privacy: "隐私",
    Appearance: "外观",
    "Profile Information": "个人资料信息",
    Username: "用户名",
    Email: "邮箱",
    "Save Changes": "保存更改",
    Saving: "保存中",
    "Saving...": "保存中...",
    "Notification Preferences": "通知偏好",
    "Daily Saving Reminder": "每日储蓄提醒",
    "Get reminded to save every day": "每天提醒储蓄",
    "Goal Milestones": "目标里程碑",
    "Notify when you reach 25%, 50%, 75%": "达到25%、50%、75%时通知",
    "Streak Alerts": "连续记录提醒",
    "Warn when streak is about to break": "连续记录即将中断时提醒",
    "Achievement Unlocks": "成就解锁",
    "Celebrate when you earn badges": "获得徽章时庆祝",
    "Weekly Summary": "每周总结",
    "Weekly report of savings": "储蓄周报",
    "Privacy & Security": "隐私与安全",
    "Public Profile": "公开资料",
    "Allow others to see your stats": "允许他人查看你的统计",
    "Show on Leaderboard": "显示在排行榜",
    "Appear in global rankings": "出现在全局排名中",
    "Share Achievements": "分享成就",
    "Let friends see your badges": "让朋友看到你的徽章",
    "Change Password": "修改密码",
    "Dark Mode": "深色模式",
    "Switch to dark theme": "切换到深色主题",
    Language: "语言",
    "Choose app language": "选择应用语言",
    "Compact View": "紧凑视图",
    "Show more items per page": "每页显示更多项目",
    Animations: "动画",
    "Enable smooth animations": "启用流畅动画",
    "Expenses & Savings 📊": "支出与储蓄 📊",
    "Track your spending and savings clearly": "清晰追踪支出和储蓄",
    "Total Saved": "总储蓄",
    "Total Spent": "总支出",
    "Net Savings": "净储蓄",
    "Completed Goals": "已达成目标",
    "Savings Streak": "储蓄连续天数",
    "Saver Rank": "储蓄者等级",
    "Search transactions...": "搜索交易...",
    "Expense Breakdown": "支出明细",
    "Daily Spending": "每日支出",
    "Expenses List": "支出列表",
    "Savings List": "储蓄列表",
    "No expenses found": "没有支出",
    "No savings found": "没有储蓄",
    "Used money": "已使用金额",
    "Saved money": "已储蓄金额",
    "Leaderboard 🏆": "排行榜 🏆",
    "Compete with other savers and climb the ranks!": "与其他储蓄者竞争并提升排名！",
    You: "你",
    "Receipt Scanner 📸": "收据扫描 📸",
    "Snap a receipt, auto-detect details, save instantly!": "拍摄收据，自动识别并立即保存！",
    "BEST FEATURE": "最佳功能",
    "Take a Photo or Upload Receipt": "拍照或上传收据",
    "Drag & drop or click to select an image": "拖放或点击选择图片",
    "Choose File": "选择文件",
    "Gemini AI is detecting shop, price, and date": "Gemini AI 正在识别商店、价格和日期",
    "Shop Name": "商店名称",
    "Total Price": "总价",
    Date: "日期",
    Category: "类别",
    "Save Receipt": "保存收据",
    "Scan Another": "继续扫描",
    Shopping: "购物",
    Dashboard: "仪表盘",
    "Welcome back": "欢迎回来",
    "Quick Save": "快速储蓄",
    "Current Goal": "当前目标",
    "Edit Goal": "编辑目标",
    "Pet Status": "宠物状态",
    "View All": "查看全部",
    "Take Care of": "照顾:",
    "Come back tomorrow for more activities!": "明天再回来参加更多活动！",
    "Tip: Keep your pet happy by saving money and completing challenges!": "提示：通过储蓄和完成挑战让宠物开心！",
    "Earn coins by saving and completing challenges!": "通过储蓄和完成挑战赚取金币！",
    "No active goal": "没有进行中的目标",
    "Create Goal": "创建目标",
    "My Goals": "我的目标",
    "Create New Goal": "创建新目标",
    "Target Amount": "目标金额",
    Deadline: "截止日期",
    Cancel: "取消",
    Create: "创建",
    Level: "等级",
    goals: "目标",
    "days left": "天剩余",
    Saved: "已储蓄",
  },
};

const FEATURE_TRANSLATIONS = {
  ja: {
    Planner: "プランナー",
    "Money Planner": "お金プランナー",
    "Budgets, recurring money, missions, forecasts, receipts, and export in one place": "予算、定期支出、ミッション、予測、レシート、エクスポートを一か所で管理",
    "Export CSV": "CSV出力",
    "This Month Spent": "今月の支出",
    "This Month Saved": "今月の貯金",
    "Month-End Estimate": "月末予想",
    "Emergency Fund": "緊急資金",
    "Not set": "未設定",
    "Budget Limits": "予算上限",
    "Monthly limit": "月の上限",
    "Save": "保存",
    "Add category budgets to unlock automatic warnings.": "カテゴリ予算を追加すると自動警告が使えます。",
    "Recurring Savings and Expenses": "定期的な貯金と支出",
    "Due items run automatically when you open the app. Delete a recurring item when a subscription or payment stops.": "期限が来た項目はアプリを開くと自動で記録されます。支払いを止めたら定期項目を削除してください。",
    Name: "名前",
    Amount: "金額",
    Expense: "支出",
    Savings: "貯金",
    Monthly: "毎月",
    Weekly: "毎週",
    "Active goal": "現在の目標",
    Add: "追加",
    "No recurring entries yet.": "定期項目はまだありません。",
    "Delete this recurring item?": "この定期項目を削除しますか？",
    "AI Spending Coach": "AI支出コーチ",
    "Goal Forecast": "目標予測",
    Missions: "ミッション",
    Claimed: "受け取り済み",
    "Receipt History": "レシート履歴",
    "No scanned receipts yet.": "スキャン済みレシートはまだありません。",
    "Unknown Shop": "不明な店",
    "Scanned receipts will appear here.": "スキャンしたレシートがここに表示されます。",
    "budget is over limit": "予算上限を超えています",
    "is close to the limit": "上限に近づいています",
    "You spent {spent} against {limit}. Freeze non-essential {category} spending first.": "{limit} に対して {spent} 使いました。まず不要な {category} 支出を止めましょう。",
    "You are at {percent}%. Keep the next few purchases small to finish the month cleanly.": "現在 {percent}% です。月末まで次の買い物を小さく抑えましょう。",
    "Goal path looks measurable": "目標までの道筋が見えています",
    "At this pace, {goal} can finish around {date}.": "このペースなら {goal} は {date} ごろ達成できます。",
    "Build the next useful signal": "次の有用なサインを作りましょう",
    "{days} days": "{days}日",
    "Needs savings pace": "貯金ペースが必要です",
    "Remaining {amount} for {goal}.": "{goal} まで残り {amount}。",
    "Create an active goal to see a forecast.": "予測を見るには有効な目標を作成してください。",
    "Save once today": "今日1回貯金する",
    "Record any savings deposit today.": "今日、貯金の入金を記録しましょう。",
    "3 days no shopping": "3日間買い物なし",
    "Avoid Shopping expenses for 3 separate days this week.": "今週3日間、買い物支出を避けましょう。",
    "Stay under every budget": "すべての予算内に収める",
    "Keep all monthly category budgets under 100%.": "すべての月間カテゴリ予算を100%未満に保ちましょう。",
    "Claim {coins} coins": "{coins}コインを受け取る",
    "next": "次回",
    weekly: "毎週",
    monthly: "毎月",
  },
  ko: {
    Planner: "플래너",
    "Money Planner": "머니 플래너",
    "Budgets, recurring money, missions, forecasts, receipts, and export in one place": "예산, 반복 지출, 미션, 예측, 영수증, 내보내기를 한곳에서 관리",
    "Export CSV": "CSV 내보내기",
    "This Month Spent": "이번 달 지출",
    "This Month Saved": "이번 달 저축",
    "Month-End Estimate": "월말 예상",
    "Emergency Fund": "비상금",
    "Not set": "미설정",
    "Budget Limits": "예산 한도",
    "Monthly limit": "월 한도",
    "Save": "저장",
    "Add category budgets to unlock automatic warnings.": "카테고리 예산을 추가하면 자동 경고를 사용할 수 있습니다.",
    "Recurring Savings and Expenses": "반복 저축 및 지출",
    "Due items run automatically when you open the app. Delete a recurring item when a subscription or payment stops.": "기한이 된 항목은 앱을 열 때 자동으로 기록됩니다. 구독이나 결제가 중지되면 반복 항목을 삭제하세요.",
    Name: "이름",
    Amount: "금액",
    Expense: "지출",
    Savings: "저축",
    Monthly: "매월",
    Weekly: "매주",
    "Active goal": "현재 목표",
    Add: "추가",
    "No recurring entries yet.": "반복 항목이 아직 없습니다.",
    "Delete this recurring item?": "이 반복 항목을 삭제할까요?",
    "AI Spending Coach": "AI 지출 코치",
    "Goal Forecast": "목표 예측",
    Missions: "미션",
    Claimed: "수령 완료",
    "Receipt History": "영수증 기록",
    "No scanned receipts yet.": "스캔한 영수증이 아직 없습니다.",
    "Unknown Shop": "알 수 없는 상점",
    "Scanned receipts will appear here.": "스캔한 영수증이 여기에 표시됩니다.",
    "budget is over limit": "예산 한도를 넘었습니다",
    "is close to the limit": "한도에 가까워졌습니다",
    "You spent {spent} against {limit}. Freeze non-essential {category} spending first.": "{limit} 중 {spent}을 사용했습니다. 먼저 불필요한 {category} 지출을 멈추세요.",
    "You are at {percent}%. Keep the next few purchases small to finish the month cleanly.": "현재 {percent}%입니다. 이번 달을 잘 마무리하려면 다음 지출을 작게 유지하세요.",
    "Goal path looks measurable": "목표 달성 경로가 보입니다",
    "At this pace, {goal} can finish around {date}.": "이 속도라면 {goal}은 {date}쯤 완료할 수 있습니다.",
    "Build the next useful signal": "다음 유용한 신호를 만들어보세요",
    "{days} days": "{days}일",
    "Needs savings pace": "저축 속도가 필요합니다",
    "Remaining {amount} for {goal}.": "{goal}까지 {amount} 남았습니다.",
    "Create an active goal to see a forecast.": "예측을 보려면 활성 목표를 만드세요.",
    "Save once today": "오늘 한 번 저축하기",
    "Record any savings deposit today.": "오늘 저축 입금을 기록하세요.",
    "3 days no shopping": "3일 쇼핑 안 하기",
    "Avoid Shopping expenses for 3 separate days this week.": "이번 주 3일 동안 쇼핑 지출을 피하세요.",
    "Stay under every budget": "모든 예산 안에 머무르기",
    "Keep all monthly category budgets under 100%.": "모든 월간 카테고리 예산을 100% 아래로 유지하세요.",
    "Claim {coins} coins": "{coins}코인 받기",
    "next": "다음",
    weekly: "매주",
    monthly: "매월",
  },
  my: {
    Planner: "အစီအစဉ်",
    "Money Planner": "ငွေကြေး အစီအစဉ်",
    "Budgets, recurring money, missions, forecasts, receipts, and export in one place": "Budget, ထပ်ခါထပ်ခါ ဝင်/ထွက်ငွေ, mission, ခန့်မှန်းချက်, receipt နဲ့ export ကိုတစ်နေရာတည်းမှာ စီမံပါ",
    "Export CSV": "CSV ထုတ်ရန်",
    "This Month Spent": "ဒီလ သုံးငွေ",
    "This Month Saved": "ဒီလ စုငွေ",
    "Month-End Estimate": "လကုန် ခန့်မှန်းငွေ",
    "Emergency Fund": "အရေးပေါ်ငွေ",
    "Not set": "မသတ်မှတ်ရသေးပါ",
    "Budget Limits": "Budget ကန့်သတ်ချက်",
    "Monthly limit": "လစဉ် ကန့်သတ်ငွေ",
    "Save": "သိမ်းရန်",
    "Add category budgets to unlock automatic warnings.": "အလိုအလျောက် warning ပြစေရန် category budget ထည့်ပါ။",
    "Recurring Savings and Expenses": "အလိုအလျောက် ထပ်ခါထပ်ခါ စုငွေ/သုံးငွေ",
    "Due items run automatically when you open the app. Delete a recurring item when a subscription or payment stops.": "App ဖွင့်တဲ့အချိန် due ဖြစ်နေတဲ့ item တွေကို အလိုအလျောက် မှတ်တမ်းထည့်မယ်။ Subscription/payment ရပ်သွားရင် recurring item ကိုဖျက်ပါ။",
    Name: "အမည်",
    Amount: "ငွေပမာဏ",
    Expense: "သုံးငွေ",
    Savings: "စုငွေ",
    Monthly: "လစဉ်",
    Weekly: "အပတ်စဉ်",
    "Active goal": "လက်ရှိ goal",
    Add: "ထည့်ရန်",
    "No recurring entries yet.": "Recurring item မရှိသေးပါ။",
    "Delete this recurring item?": "ဒီ recurring item ကိုဖျက်မလား?",
    "AI Spending Coach": "AI သုံးငွေ အကြံပေး",
    "Goal Forecast": "Goal ခန့်မှန်းချက်",
    Missions: "Mission များ",
    Claimed: "ရယူပြီး",
    "Receipt History": "Receipt မှတ်တမ်း",
    "No scanned receipts yet.": "Scan လုပ်ထားတဲ့ receipt မရှိသေးပါ။",
    "Unknown Shop": "ဆိုင်အမည်မသိ",
    "Scanned receipts will appear here.": "Scan လုပ်ထားတဲ့ receipt တွေဒီမှာပေါ်မယ်။",
    "budget is over limit": "budget ကန့်သတ်ချက် ကျော်နေပါပြီ",
    "is close to the limit": "ကန့်သတ်ချက်နား ရောက်နေပါပြီ",
    "You spent {spent} against {limit}. Freeze non-essential {category} spending first.": "{limit} ထဲက {spent} သုံးထားပါတယ်။ မလိုအပ်တဲ့ {category} spending ကိုအရင်ရပ်ပါ။",
    "You are at {percent}%. Keep the next few purchases small to finish the month cleanly.": "အခု {percent}% ရောက်နေပါပြီ။ ဒီလကုန်အထိ သုံးငွေကိုနည်းနည်းလျှော့ထားပါ။",
    "Goal path looks measurable": "Goal ရောက်ဖို့လမ်းကြောင်း ခန့်မှန်းလို့ရနေပါပြီ",
    "At this pace, {goal} can finish around {date}.": "ဒီနှုန်းနဲ့ဆို {goal} ကို {date} လောက်မှာပြီးနိုင်ပါတယ်။",
    "Build the next useful signal": "နောက်ထပ် အသုံးဝင်တဲ့ signal တစ်ခုထည့်ပါ",
    "{days} days": "{days} ရက်",
    "Needs savings pace": "စုငွေ pace လိုအပ်နေပါတယ်",
    "Remaining {amount} for {goal}.": "{goal} အတွက် {amount} ကျန်ပါတယ်။",
    "Create an active goal to see a forecast.": "Forecast ကြည့်ဖို့ active goal တစ်ခုဖန်တီးပါ။",
    "Save once today": "ဒီနေ့ တစ်ကြိမ်စုပါ",
    "Record any savings deposit today.": "ဒီနေ့ savings deposit တစ်ခုမှတ်တမ်းထည့်ပါ။",
    "3 days no shopping": "၃ ရက် shopping မလုပ်ပါ",
    "Avoid Shopping expenses for 3 separate days this week.": "ဒီအပတ်ထဲ ၃ ရက် Shopping expense ကိုရှောင်ပါ။",
    "Stay under every budget": "Budget အားလုံး မကျော်အောင်နေပါ",
    "Keep all monthly category budgets under 100%.": "လစဉ် category budget အားလုံးကို 100% အောက်ထားပါ။",
    "Claim {coins} coins": "{coins} coins ရယူရန်",
    "next": "နောက်တစ်ကြိမ်",
    weekly: "အပတ်စဉ်",
    monthly: "လစဉ်",
  },
  zh: {
    Planner: "规划",
    "Money Planner": "资金规划",
    "Budgets, recurring money, missions, forecasts, receipts, and export in one place": "在一个页面管理预算、周期收支、任务、预测、收据和导出",
    "Export CSV": "导出 CSV",
    "This Month Spent": "本月支出",
    "This Month Saved": "本月储蓄",
    "Month-End Estimate": "月底预估",
    "Emergency Fund": "应急基金",
    "Not set": "未设置",
    "Budget Limits": "预算上限",
    "Monthly limit": "月度上限",
    "Save": "保存",
    "Add category budgets to unlock automatic warnings.": "添加分类预算即可启用自动提醒。",
    "Recurring Savings and Expenses": "周期储蓄与支出",
    "Due items run automatically when you open the app. Delete a recurring item when a subscription or payment stops.": "到期项目会在打开应用时自动记录。订阅或付款停止时，请删除对应周期项目。",
    Name: "名称",
    Amount: "金额",
    Expense: "支出",
    Savings: "储蓄",
    Monthly: "每月",
    Weekly: "每周",
    "Active goal": "当前目标",
    Add: "添加",
    "No recurring entries yet.": "还没有周期项目。",
    "Delete this recurring item?": "要删除这个周期项目吗？",
    "AI Spending Coach": "AI 支出教练",
    "Goal Forecast": "目标预测",
    Missions: "任务",
    Claimed: "已领取",
    "Receipt History": "收据历史",
    "No scanned receipts yet.": "还没有扫描的收据。",
    "Unknown Shop": "未知商店",
    "Scanned receipts will appear here.": "扫描的收据会显示在这里。",
    "budget is over limit": "已超过预算上限",
    "is close to the limit": "接近预算上限",
    "You spent {spent} against {limit}. Freeze non-essential {category} spending first.": "预算 {limit} 中已花费 {spent}。请先暂停非必要的 {category} 支出。",
    "You are at {percent}%. Keep the next few purchases small to finish the month cleanly.": "目前已达到 {percent}%。请控制接下来的消费，以便顺利结束本月。",
    "Goal path looks measurable": "目标进度可以预测",
    "At this pace, {goal} can finish around {date}.": "按这个速度，{goal} 大约可在 {date} 完成。",
    "Build the next useful signal": "建立下一个有用信号",
    "{days} days": "{days}天",
    "Needs savings pace": "需要储蓄节奏",
    "Remaining {amount} for {goal}.": "{goal} 还剩 {amount}。",
    "Create an active goal to see a forecast.": "创建一个有效目标即可查看预测。",
    "Save once today": "今天储蓄一次",
    "Record any savings deposit today.": "今天记录一笔储蓄。",
    "3 days no shopping": "3天不购物",
    "Avoid Shopping expenses for 3 separate days this week.": "本周任选3天避免购物支出。",
    "Stay under every budget": "保持所有预算不超支",
    "Keep all monthly category budgets under 100%.": "让所有月度分类预算保持在100%以下。",
    "Claim {coins} coins": "领取 {coins} 个金币",
    "next": "下次",
    weekly: "每周",
    monthly: "每月",
  },
};

const LanguageContext = createContext(null);

const textNodeOriginals = new WeakMap();
const attrOriginalKey = (attr) => `i18nOriginal${attr.replace(/[^a-z]/gi, "")}`;

function preserveSpacing(original, translated) {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function translateDynamic(text, dict) {
  const trimmed = text.trim();
  const fill = (template, values) =>
    Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);

  const levelMatch = trimmed.match(/^Level (.+)$/);
  if (levelMatch) return preserveSpacing(text, `${dict.Level || "Level"} ${levelMatch[1]}`);

  const goalsMatch = trimmed.match(/^(\d+) goals$/);
  if (goalsMatch) return preserveSpacing(text, `${goalsMatch[1]} ${dict.goals || "goals"}`);

  const daysMatch = trimmed.match(/^(\d+) days left$/);
  if (daysMatch) return preserveSpacing(text, `${daysMatch[1]} ${dict["days left"] || "days left"}`);

  const savedMatch = trimmed.match(/^Saved: (.+)$/);
  if (savedMatch) return preserveSpacing(text, `${dict.Saved || "Saved"}: ${savedMatch[1]}`);

  if (trimmed.startsWith("Take Care of ")) {
    return preserveSpacing(text, `${dict["Take Care of"] || "Take Care of"} ${trimmed.replace("Take Care of ", "")}`);
  }

  const overBudgetMatch = trimmed.match(/^(.+) budget is over limit$/);
  if (overBudgetMatch) return preserveSpacing(text, `${overBudgetMatch[1]} ${dict["budget is over limit"] || "budget is over limit"}`);

  const warningBudgetMatch = trimmed.match(/^(.+) is close to the limit$/);
  if (warningBudgetMatch) return preserveSpacing(text, `${warningBudgetMatch[1]} ${dict["is close to the limit"] || "is close to the limit"}`);

  const spentAgainstMatch = trimmed.match(/^You spent (.+) against (.+)\. Freeze non-essential (.+) spending first\.$/);
  if (spentAgainstMatch && dict["You spent {spent} against {limit}. Freeze non-essential {category} spending first."]) {
    return preserveSpacing(text, fill(dict["You spent {spent} against {limit}. Freeze non-essential {category} spending first."], {
      spent: spentAgainstMatch[1],
      limit: spentAgainstMatch[2],
      category: spentAgainstMatch[3],
    }));
  }

  const percentMatch = trimmed.match(/^You are at (.+)%\. Keep the next few purchases small to finish the month cleanly\.$/);
  if (percentMatch && dict["You are at {percent}%. Keep the next few purchases small to finish the month cleanly."]) {
    return preserveSpacing(text, fill(dict["You are at {percent}%. Keep the next few purchases small to finish the month cleanly."], {
      percent: percentMatch[1],
    }));
  }

  const paceMatch = trimmed.match(/^At this pace, (.+) can finish around (.+)\.$/);
  if (paceMatch && dict["At this pace, {goal} can finish around {date}."]) {
    return preserveSpacing(text, fill(dict["At this pace, {goal} can finish around {date}."], {
      goal: paceMatch[1],
      date: paceMatch[2],
    }));
  }

  const compactDaysMatch = trimmed.match(/^(\d+) days$/);
  if (compactDaysMatch && dict["{days} days"]) {
    return preserveSpacing(text, fill(dict["{days} days"], { days: compactDaysMatch[1] }));
  }

  const remainingMatch = trimmed.match(/^Remaining (.+) for (.+)\.$/);
  if (remainingMatch && dict["Remaining {amount} for {goal}."]) {
    return preserveSpacing(text, fill(dict["Remaining {amount} for {goal}."], {
      amount: remainingMatch[1],
      goal: remainingMatch[2],
    }));
  }

  const claimCoinsMatch = trimmed.match(/^Claim (\d+) coins$/);
  if (claimCoinsMatch && dict["Claim {coins} coins"]) {
    return preserveSpacing(text, fill(dict["Claim {coins} coins"], { coins: claimCoinsMatch[1] }));
  }

  const recurringMetaMatch = trimmed.match(/^(weekly|monthly)\s+.+\s+next\s+(.+)\s+.+\s+(.+)$/);
  if (recurringMetaMatch) {
    return preserveSpacing(text, `${dict[recurringMetaMatch[1]] || recurringMetaMatch[1]} · ${dict.next || "next"} ${recurringMetaMatch[2]} · ${recurringMetaMatch[3]}`);
  }

  return null;
}

function translateText(text, language) {
  if (language === "en") return text;

  const dict = { ...(DICTIONARIES[language] || {}), ...(FEATURE_TRANSLATIONS[language] || {}) };
  const trimmed = text.trim();
  if (!trimmed) return text;

  if (dict[trimmed]) return preserveSpacing(text, dict[trimmed]);
  const dynamic = translateDynamic(text, dict);
  if (dynamic) return dynamic;

  let translated = trimmed;
  for (const [source, target] of Object.entries(dict)) {
    if (source.length > 3 && translated.includes(source)) {
      translated = translated.replaceAll(source, target);
    }
  }

  return translated === trimmed ? text : preserveSpacing(text, translated);
}

function translateNodeTree(root, language) {
  if (!root || root.nodeType !== Node.ELEMENT_NODE) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    if (!textNodeOriginals.has(node)) {
      textNodeOriginals.set(node, node.nodeValue);
    }
    const original = textNodeOriginals.get(node);
    node.nodeValue = translateText(original, language);
  }

  const elements = root.querySelectorAll("[placeholder], [title], [aria-label]");
  for (const element of elements) {
    for (const attr of ["placeholder", "title", "aria-label"]) {
      if (!element.hasAttribute(attr)) continue;
      const key = attrOriginalKey(attr);
      if (!element.dataset[key]) {
        element.dataset[key] = element.getAttribute(attr);
      }
      element.setAttribute(attr, translateText(element.dataset[key], language));
    }
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem("language") || "en");

  const setLanguage = (nextLanguage) => {
    localStorage.setItem("language", nextLanguage);
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    const translate = () => translateNodeTree(document.body, language);

    window.requestAnimationFrame(translate);
    const observer = new MutationObserver(() => window.requestAnimationFrame(translate));
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, languages: LANGUAGES }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
