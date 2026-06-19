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

  return null;
}

function translateText(text, language) {
  if (language === "en") return text;

  const dict = DICTIONARIES[language] || {};
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
