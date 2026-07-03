import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Bot, Brain, CalendarDays, CheckCircle2, MessageCircle, PieChart, Sparkles, TrendingDown } from 'lucide-react'
import { transactions as txApi } from '../api.js'
import { useLanguage } from '../i18n.jsx'

const currency = (value) => `¥${Math.round(value || 0).toLocaleString()}`

const copy = {
  en: {
    title: 'Expense Analyst',
    subtitle: 'AI-style advice based on your real expense history',
    loading: 'Reading your expenses...',
    error: 'Failed to analyze expenses. Please try again.',
    retry: 'Retry',
    totalSpent: 'Total analyzed spending',
    topArea: 'Top spending area',
    riskLevel: 'Risk level',
    noDataTitle: 'No expense data yet',
    noDataBody: 'Add a few expenses or scan receipts first, then I can give smarter advice.',
    chatTitle: 'AI Advice Box',
    patternTitle: 'Detected Pattern',
    breakdownTitle: 'Expense Breakdown',
    recentTitle: 'Recent Expenses Used',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    cautionPrefix: 'Caution',
    advicePrefix: 'Advice',
    actionPrefix: 'Action',
    genericPattern: (label, percent, amount) => `${label} is your biggest spending area at ${percent}% (${currency(amount)}).`,
    genericCaution: (label) => `You spent too much on ${label}. It may quietly reduce your savings progress.`,
    genericAdvice: (label) => `Set a small weekly limit for ${label}, and move the leftover money into your active goal.`,
    genericAction: (label) => `For the next 7 days, pause one non-essential ${label} purchase and save that amount instead.`,
    gamePattern: (percent, amount) => `Game/DVD-related spending is taking ${percent}% of your expenses (${currency(amount)}).`,
    gameCaution: 'You spent too much on game/DVD purchases.',
    gameAdvice: 'Try a monthly entertainment cap, buy used games, or wait for sales before purchasing.',
    gameAction: 'Pick one game/DVD purchase to delay this week and save that money to your goal.',
    diningPattern: (percent, amount) => `Dining-out spending is taking ${percent}% of your expenses (${currency(amount)}).`,
    diningCaution: 'You spent too much on dining out.',
    diningAdvice: 'Plan a few home meals and set a weekly dining-out limit before going to restaurants or cafes.',
    diningAction: 'Skip one dining-out trip this week and move that money into your savings goal.',
    foodCaution: 'Food spending is higher than usual.',
    foodAdvice: 'Plan two home meals before eating out, and track snacks separately for one week.',
    shoppingCaution: 'Shopping is taking a big part of your budget.',
    shoppingAdvice: 'Use a 24-hour wait rule before buying non-essential items.',
    transportCaution: 'Transport costs are adding up.',
    transportAdvice: 'Try combining trips or using cheaper routes for short distances.',
    essentialAdvice: (label, amount) => `${label} spending (${currency(amount)}) looks like a normal essential expense. Keep tracking it; no caution is needed unless the pattern rises sharply.`,
    normalAdvice: (label) => `${label} does not show a serious risk yet. Keep tracking the pattern and review it again if the amount or frequency increases.`,
    reasonableLabel: 'Reasonable',
    reviewLabel: 'Review',
    riskLabel: 'Risk',
    highRiskLabel: 'Highly Risk',
    reviewCaution: (label) => `${label} is above the comfortable range. Review it, but it is not a serious risk yet.`,
    riskCaution: (label) => `${label} is showing a risky spending pattern that can reduce your savings progress.`,
    highRiskCaution: (label) => `${label} spending is unusually high and needs immediate attention before it seriously affects your savings.`,
  },
  ja: {
    title: '支出アナリスト',
    subtitle: '実際の支出履歴からAI風アドバイスを表示',
    loading: '支出を分析中...',
    error: '支出分析に失敗しました。もう一度お試しください。',
    retry: '再試行',
    totalSpent: '分析した支出合計',
    topArea: '一番多い支出',
    riskLevel: '注意レベル',
    noDataTitle: '支出データがありません',
    noDataBody: '先に支出を追加するかレシートをスキャンすると、より良いアドバイスができます。',
    chatTitle: 'AIアドバイスボックス',
    patternTitle: '検出された傾向',
    breakdownTitle: '支出内訳',
    recentTitle: '分析に使った最近の支出',
    high: '高',
    medium: '中',
    low: '低',
    cautionPrefix: '注意',
    advicePrefix: 'アドバイス',
    actionPrefix: '行動',
    genericPattern: (label, percent, amount) => `${label} が最大の支出で、全体の ${percent}%（${currency(amount)}）です。`,
    genericCaution: (label) => `${label} に使いすぎています。貯金の進み方が遅くなる可能性があります。`,
    genericAdvice: (label) => `${label} の週予算を少し決めて、余った分を目標に回しましょう。`,
    genericAction: (label) => `次の7日間は、不要な ${label} の買い物を1つ延期して、その分を貯金しましょう。`,
    gamePattern: (percent, amount) => `ゲーム/DVD関連の支出が全体の ${percent}%（${currency(amount)}）を占めています。`,
    gameCaution: 'ゲーム/DVDの購入に使いすぎています。',
    gameAdvice: '娯楽費の月上限を決める、中古を買う、セールまで待つのがおすすめです。',
    gameAction: '今週はゲーム/DVD購入を1つ延期して、その金額を目標に貯金しましょう。',
    diningPattern: (percent, amount) => `外食の支出が全体の ${percent}%（${currency(amount)}）を占めています。`,
    diningCaution: '外食に使いすぎています。',
    diningAdvice: 'レストランやカフェに行く前に、自炊の予定と週の外食予算を決めましょう。',
    diningAction: '今週は外食を1回減らして、その分を目標に貯金しましょう。',
    foodCaution: '食費が少し高めです。',
    foodAdvice: '外食前に自炊を2回計画し、1週間だけ間食も分けて記録しましょう。',
    shoppingCaution: '買い物が予算の大きな割合を占めています。',
    shoppingAdvice: '不要な買い物は24時間待ってから判断しましょう。',
    transportCaution: '交通費が積み上がっています。',
    transportAdvice: '用事をまとめたり、短距離は安いルートを試しましょう。',
    essentialAdvice: (label, amount) => `${label}（${currency(amount)}）は通常の必要経費と考えられます。急に金額や回数が増えない限り、注意は不要です。`,
    normalAdvice: (label) => `${label} は現在、深刻なリスクではありません。金額や回数が増えた時にもう一度確認しましょう。`,
    reasonableLabel: '適正',
    reviewLabel: '確認',
    riskLabel: 'リスク',
    highRiskLabel: '高リスク',
    reviewCaution: (label) => `${label} は通常より少し高めです。深刻なリスクではありませんが、内容を確認しましょう。`,
    riskCaution: (label) => `${label} にリスクのある支出傾向が見られ、貯金の進捗に影響する可能性があります。`,
    highRiskCaution: (label) => `${label} の支出が非常に高く、貯金へ大きく影響する前に早めの対応が必要です。`,
  },
  ko: {
    title: '지출 분석가',
    subtitle: '실제 지출 기록을 기반으로 AI 스타일 조언 제공',
    loading: '지출을 분석하는 중...',
    error: '지출 분석에 실패했습니다. 다시 시도해주세요.',
    retry: '다시 시도',
    totalSpent: '분석한 총 지출',
    topArea: '가장 큰 지출 영역',
    riskLevel: '위험 수준',
    noDataTitle: '아직 지출 데이터가 없습니다',
    noDataBody: '먼저 지출을 추가하거나 영수증을 스캔하면 더 똑똑한 조언을 받을 수 있습니다.',
    chatTitle: 'AI 조언 박스',
    patternTitle: '감지된 패턴',
    breakdownTitle: '지출 분석',
    recentTitle: '분석에 사용한 최근 지출',
    high: '높음',
    medium: '보통',
    low: '낮음',
    cautionPrefix: '주의',
    advicePrefix: '조언',
    actionPrefix: '실행',
    genericPattern: (label, percent, amount) => `${label} 지출이 가장 크며 전체의 ${percent}%(${currency(amount)})입니다.`,
    genericCaution: (label) => `${label}에 너무 많이 지출하고 있습니다. 저축 속도를 늦출 수 있어요.`,
    genericAdvice: (label) => `${label} 주간 한도를 정하고 남은 금액은 목표에 저축해보세요.`,
    genericAction: (label) => `다음 7일 동안 불필요한 ${label} 구매 하나를 미루고 그 금액을 저축하세요.`,
    gamePattern: (percent, amount) => `게임/DVD 관련 지출이 전체의 ${percent}%(${currency(amount)})입니다.`,
    gameCaution: '게임/DVD 구매에 너무 많이 지출했습니다.',
    gameAdvice: '월간 엔터테인먼트 한도를 정하거나 중고 구매, 세일 기간까지 기다려보세요.',
    gameAction: '이번 주 게임/DVD 구매 하나를 미루고 그 돈을 목표에 저축하세요.',
    diningPattern: (percent, amount) => `외식 지출이 전체의 ${percent}%(${currency(amount)})입니다.`,
    diningCaution: '외식에 너무 많이 지출하고 있습니다.',
    diningAdvice: '식당이나 카페에 가기 전에 집밥 계획과 주간 외식 한도를 정해보세요.',
    diningAction: '이번 주 외식 한 번을 줄이고 그 돈을 저축 목표에 넣어보세요.',
    foodCaution: '식비가 평소보다 높습니다.',
    foodAdvice: '외식 전에 집밥 두 끼를 계획하고 간식비를 일주일만 따로 기록해보세요.',
    shoppingCaution: '쇼핑이 예산의 큰 부분을 차지하고 있습니다.',
    shoppingAdvice: '필수품이 아닌 물건은 24시간 기다린 뒤 구매하세요.',
    transportCaution: '교통비가 많이 쌓이고 있습니다.',
    transportAdvice: '이동을 한 번에 묶거나 짧은 거리는 더 저렴한 방법을 사용해보세요.',
    essentialAdvice: (label, amount) => `${label} 지출(${currency(amount)})은 일반적인 필수 지출로 보입니다. 금액이나 빈도가 급격히 늘지 않는 한 주의가 필요하지 않습니다.`,
    normalAdvice: (label) => `${label}은 현재 심각한 위험이 아닙니다. 금액이나 빈도가 늘면 다시 확인하세요.`,
    reasonableLabel: '적정',
    reviewLabel: '검토',
    riskLabel: '위험',
    highRiskLabel: '고위험',
    reviewCaution: (label) => `${label} 지출이 적정 범위보다 조금 높습니다. 심각한 위험은 아니지만 확인해보세요.`,
    riskCaution: (label) => `${label}에서 저축 진행을 늦출 수 있는 위험한 지출 패턴이 보입니다.`,
    highRiskCaution: (label) => `${label} 지출이 비정상적으로 높아 저축에 큰 영향을 주기 전에 즉시 확인해야 합니다.`,
  },
  my: {
    title: 'အသုံးစရိတ် Analyst',
    subtitle: 'သင့် expense history အပေါ်မူတည်ပြီး AI ပုံစံ advice ပေးမယ်',
    loading: 'အသုံးစရိတ်တွေကို ဖတ်နေသည်...',
    error: 'Expense analysis မလုပ်နိုင်ပါ။ ထပ်စမ်းပါ။',
    retry: 'ထပ်စမ်းမည်',
    totalSpent: 'ခွဲခြမ်းစိတ်ဖြာထားတဲ့ သုံးငွေစုစုပေါင်း',
    topArea: 'အများဆုံးသုံးတဲ့နေရာ',
    riskLevel: 'သတိပေးအဆင့်',
    noDataTitle: 'Expense data မရှိသေးပါ',
    noDataBody: 'အရင် expense ထည့်ပါ သို့မဟုတ် receipt scan လုပ်ပါ။ ပြီးရင် ပိုကောင်းတဲ့ advice ပေးနိုင်မယ်။',
    chatTitle: 'AI Advice Box',
    patternTitle: 'တွေ့ရှိတဲ့ pattern',
    breakdownTitle: 'Expense ခွဲခြမ်း',
    recentTitle: 'Analysis အတွက်သုံးထားတဲ့ recent expenses',
    high: 'မြင့်',
    medium: 'အလယ်အလတ်',
    low: 'နိမ့်',
    cautionPrefix: 'သတိ',
    advicePrefix: 'အကြံပြုချက်',
    actionPrefix: 'လုပ်ဆောင်ရန်',
    genericPattern: (label, percent, amount) => `${label} က အများဆုံးသုံးနေတဲ့နေရာဖြစ်ပြီး ${percent}% (${currency(amount)}) ရှိတယ်။`,
    genericCaution: (label) => `${label} မှာ ပိုက်ဆံအရမ်းသုံးနေတယ်။ ဒါက saving progress ကို နှေးစေနိုင်တယ်။`,
    genericAdvice: (label) => `${label} အတွက် weekly limit သေးသေးတစ်ခုထားပြီး ကျန်ငွေကို active goal ထဲထည့်ပါ။`,
    genericAction: (label) => `နောက် 7 ရက်အတွင်း မလိုအပ်တဲ့ ${label} purchase တစ်ခုကို မဝယ်ဘဲ အဲဒီငွေကိုစုပါ။`,
    gamePattern: (percent, amount) => `Game/DVD နဲ့ဆိုင်တဲ့ expense က စုစုပေါင်းရဲ့ ${percent}% (${currency(amount)}) ဖြစ်နေတယ်။`,
    gameCaution: 'Game/DVD မှာ ပိုက်ဆံအရမ်းသုံးနေတယ်။',
    gameAdvice: 'Entertainment monthly cap ထားပါ၊ used game ဝယ်ပါ၊ sale ကျတဲ့အချိန်ထိစောင့်ပြီးဝယ်ပါ။',
    gameAction: 'ဒီအပတ် Game/DVD purchase တစ်ခုကိုရွှေ့ပြီး အဲဒီပိုက်ဆံကို goal ထဲစုပါ။',
    diningPattern: (percent, amount) => `အပြင်စားတာ/外食 expense က စုစုပေါင်းရဲ့ ${percent}% (${currency(amount)}) ဖြစ်နေတယ်။`,
    diningCaution: 'အပြင်စားတာမှာ ပိုက်ဆံအရမ်းသုံးနေတယ်။',
    diningAdvice: 'Restaurant/cafe မသွားခင် အိမ်မှာစားမယ့် meal plan နဲ့ weekly dining limit ထားပါ။',
    diningAction: 'ဒီအပတ် အပြင်စားတစ်ခါလျှော့ပြီး အဲဒီငွေကို goal ထဲစုပါ။',
    foodCaution: 'Food expense နည်းနည်းများနေတယ်။',
    foodAdvice: 'အပြင်မစားခင် အိမ်မှာစားမယ့် meal 2 ခု plan လုပ်ပါ၊ snack expense ကို 1 ပတ်ခွဲမှတ်ပါ။',
    shoppingCaution: 'Shopping က budget ရဲ့အပိုင်းကြီးတစ်ခုယူနေတယ်။',
    shoppingAdvice: 'မလိုအပ်တဲ့ item မဝယ်ခင် 24-hour rule သုံးပါ။',
    transportCaution: 'Transport cost တွေစုလာနေတယ်။',
    transportAdvice: 'Trip တွေပေါင်းသွားပါ၊ အနီးအနားဆို cheaper route သုံးကြည့်ပါ။',
    essentialAdvice: (label, amount) => `${label} ${currency(amount)} က ပုံမှန်လိုအပ်တဲ့ expense လို့မြင်ရတယ်။ Amount သို့မဟုတ် အကြိမ်ရေ ရုတ်တရက်မတက်သရွေ့ caution မလိုပါ။`,
    normalAdvice: (label) => `${label} က အခုအချိန်မှာ serious risk မတွေ့ရသေးပါ။ Amount သို့မဟုတ် အကြိမ်ရေတက်လာရင် ပြန်စစ်ပါ။`,
    reasonableLabel: 'သင့်တော်',
    reviewLabel: 'ပြန်စစ်ရန်',
    riskLabel: 'အန္တရာယ်ရှိ',
    highRiskLabel: 'အန္တရာယ်အလွန်မြင့်',
    reviewCaution: (label) => `${label} expense က သင့်တော်တဲ့ range ထက် နည်းနည်းမြင့်နေတယ်။ Serious risk မဟုတ်သေးပေမယ့် ပြန်စစ်ပါ။`,
    riskCaution: (label) => `${label} မှာ saving progress ကိုလျော့စေနိုင်တဲ့ risky spending pattern တွေ့ရတယ်။`,
    highRiskCaution: (label) => `${label} expense က ပုံမှန်ထက်အရမ်းမြင့်နေပြီး saving ကိုပြင်းပြင်းထန်ထန်မထိခိုက်ခင် ချက်ချင်းပြန်စစ်သင့်တယ်။`,
  },
  zh: {
    title: '支出分析师',
    subtitle: '根据真实支出记录生成 AI 风格建议',
    loading: '正在读取你的支出...',
    error: '支出分析失败，请重试。',
    retry: '重试',
    totalSpent: '已分析总支出',
    topArea: '最高支出领域',
    riskLevel: '风险等级',
    noDataTitle: '还没有支出数据',
    noDataBody: '先添加一些支出或扫描收据，我就能给出更聪明的建议。',
    chatTitle: 'AI 建议框',
    patternTitle: '检测到的模式',
    breakdownTitle: '支出明细',
    recentTitle: '用于分析的近期支出',
    high: '高',
    medium: '中',
    low: '低',
    cautionPrefix: '提醒',
    advicePrefix: '建议',
    actionPrefix: '行动',
    genericPattern: (label, percent, amount) => `${label} 是你最大的支出领域，占 ${percent}%（${currency(amount)}）。`,
    genericCaution: (label) => `你在 ${label} 上花得太多了，可能会影响储蓄进度。`,
    genericAdvice: (label) => `为 ${label} 设置一个小的每周预算，把剩余的钱转入目标储蓄。`,
    genericAction: (label) => `接下来7天，暂停一次非必要的 ${label} 消费，并把这笔钱存起来。`,
    gamePattern: (percent, amount) => `游戏/DVD 相关支出占总支出的 ${percent}%（${currency(amount)}）。`,
    gameCaution: '你在游戏/DVD购买上花得太多了。',
    gameAdvice: '可以设置每月娱乐预算，购买二手游戏，或等打折时再买。',
    gameAction: '本周延后一次游戏/DVD购买，把这笔钱存入目标。',
    diningPattern: (percent, amount) => `外出就餐支出占总支出的 ${percent}%（${currency(amount)}）。`,
    diningCaution: '你在外出就餐上花得太多了。',
    diningAdvice: '去餐厅或咖啡店前，先计划几顿在家吃，并设置每周外食预算。',
    diningAction: '本周减少一次外食，把这笔钱存入储蓄目标。',
    foodCaution: '餐饮支出偏高。',
    foodAdvice: '外出就餐前先计划两顿在家吃，并单独记录一周零食费用。',
    shoppingCaution: '购物占用了较大预算。',
    shoppingAdvice: '非必要物品先等待24小时再决定是否购买。',
    transportCaution: '交通费用正在累积。',
    transportAdvice: '尝试合并出行，短距离选择更便宜的路线。',
    essentialAdvice: (label, amount) => `${label} 支出（${currency(amount)}）看起来属于正常的必要开支。除非金额或频率突然上升，否则无需提醒。`,
    normalAdvice: (label) => `${label} 目前没有显示出严重风险。如果金额或频率增加，再重新检查。`,
    reasonableLabel: '合理',
    reviewLabel: '需检查',
    riskLabel: '风险',
    highRiskLabel: '高风险',
    reviewCaution: (label) => `${label} 支出略高于合理范围。虽然还不是严重风险，但建议检查。`,
    riskCaution: (label) => `${label} 出现了可能影响储蓄进度的风险支出模式。`,
    highRiskCaution: (label) => `${label} 支出异常高，需要立即关注，以免严重影响储蓄。`,
  },
}

const languageCopy = (language) => copy[language] || copy.en
const historyCopy = {
  en: { title: 'Advice History', empty: 'No previous advice yet.' },
  ja: { title: 'アドバイス履歴', empty: '以前のアドバイスはまだありません。' },
  ko: { title: '조언 기록', empty: '이전 조언이 아직 없습니다.' },
  my: { title: 'Advice History', empty: 'အရင် advice မရှိသေးပါ။' },
  zh: { title: '建议历史', empty: '还没有以前的建议。' },
}

const historyLabels = (language) => historyCopy[language] || historyCopy.en
const adviceHistoryKey = 'expenseAnalystAdviceHistory'
const analysisVersion = 2

const keywordGroups = [
  { id: 'game', label: 'Game/DVD', keywords: ['game', 'dvd', 'steam', 'playstation', 'ps5', 'xbox', 'nintendo', 'switch', 'gaming', 'ဂိမ်း', 'ゲーム', '游戏'] },
  { id: 'treat', label: 'Treats & Drinks', keywords: ['coffee', 'cafe', 'bubble tea', 'boba', 'dessert', 'ice cream', 'milk tea', 'ကော်ဖီ', 'မုန့်', 'コーヒー', 'カフェ', '咖啡', '奶茶'] },
  { id: 'dining', label: 'Dining Out', keywords: ['外食', 'gai shoku', 'gaishoku', 'restaurant', 'eat out', 'dining'] },
  { id: 'food', label: 'Food', keywords: ['food', 'rice', 'snack', 'meal', 'groceries', 'grocery', 'market', 'supermarket', 'vegetable', 'meat', 'convenience store', 'konbini', 'コンビニ', 'ご飯', '食料', 'ဆန်', 'စားစရာ', '大米', '食品'] },
  { id: 'shopping', label: 'Shopping', keywords: ['shopping', 'clothes', 'shirt', 'bag', 'amazon', 'mall', 'cosmetic', 'jewelry', 'luxury', 'electronics', 'gadget'] },
  { id: 'entertainment', label: 'Entertainment', keywords: ['entertainment', 'movie', 'cinema', 'concert', 'karaoke', 'netflix', 'streaming', 'anime', 'music', 'casino', 'gambling', 'bet', 'lottery', 'gacha', 'alcohol', 'bar', 'tobacco', 'vape', 'hobby', 'collectible', 'ဖျော်ဖြေရေး', '娯楽', '娱乐'] },
  { id: 'transport', label: 'Transport', keywords: ['train', 'bus', 'taxi', 'uber', 'transport', 'gas', 'fuel'] },
  { id: 'housing', label: 'Housing', keywords: ['rent', 'housing', 'apartment', 'mortgage', 'အိမ်လခ', '家賃'] },
  { id: 'healthcare', label: 'Healthcare', keywords: ['medicine', 'medical', 'hospital', 'clinic', 'doctor', 'pharmacy', 'ဆေး', '病院'] },
  { id: 'utilities', label: 'Utilities', keywords: ['electricity', 'water bill', 'gas bill', 'internet bill', 'phone bill', 'utility', '電気', '水道'] },
  { id: 'education', label: 'Education', keywords: ['school', 'education', 'tuition', 'course', 'book', 'exam', 'ကျောင်း', 'ပညာရေး', '学費'] },
  { id: 'family', label: 'Family Care', keywords: ['childcare', 'baby', 'family care', 'elder care', 'daycare'] },
  { id: 'finance', label: 'Financial Commitments', keywords: ['insurance', 'loan', 'debt', 'tax', 'pension'] },
]

const essentialTypes = new Set(['food', 'transport', 'housing', 'healthcare', 'utilities', 'education', 'family', 'finance'])
const discretionaryTypes = new Set(['game', 'shopping', 'dining', 'treat', 'entertainment'])

function transactionText(tx) {
  return `${tx.category || ''} ${tx.note || ''} ${tx.target_name || ''}`.toLowerCase()
}

function transactionNature(tx) {
  const haystack = transactionText(tx)
  const group = keywordGroups.find(item => item.keywords.some(keyword => haystack.includes(keyword)))
  if (group && essentialTypes.has(group.id)) return { nature: 'essential', type: group.id }
  if (group && discretionaryTypes.has(group.id)) return { nature: 'discretionary', type: group.id }
  return { nature: 'neutral', type: group?.id || 'general' }
}

function medianAmount(expenses) {
  const amounts = expenses.map(tx => Number(tx.amount || 0)).filter(amount => amount > 0).sort((a, b) => a - b)
  if (!amounts.length) return 0
  const middle = Math.floor(amounts.length / 2)
  return amounts.length % 2 ? amounts[middle] : (amounts[middle - 1] + amounts[middle]) / 2
}

function assessExpense(tx, baseline) {
  const amount = Number(tx.amount || 0)
  const { nature, type } = transactionNature(tx)
  const reference = Math.max(1000, baseline || 5000)

  if (nature === 'essential') {
    return { status: amount >= Math.max(100000, reference * 8) ? 'review' : 'reasonable', nature, type }
  }
  if (nature === 'discretionary') {
    if (type === 'treat') {
      if (amount >= 15000) return { status: 'high-risk', nature, type }
      if (amount >= 8000) return { status: 'risk', nature, type }
      if (amount >= 3000) return { status: 'review', nature, type }
      return { status: 'reasonable', nature, type }
    }
    if (type === 'entertainment') {
      if (amount >= 30000) return { status: 'high-risk', nature, type }
      if (amount >= 10000) return { status: 'risk', nature, type }
      if (amount >= 3000) return { status: 'review', nature, type }
      return { status: 'reasonable', nature, type }
    }
    const absoluteWasteThreshold = type === 'shopping' ? 20000 : type === 'dining' ? 12000 : 15000
    const absoluteReviewThreshold = type === 'shopping' ? 10000 : type === 'dining' ? 7000 : 8000
    const absoluteHighRiskThreshold = type === 'shopping' ? 50000 : type === 'dining' ? 30000 : 50000
    if (amount >= Math.max(absoluteHighRiskThreshold, reference * 7)) return { status: 'high-risk', nature, type }
    if (amount >= Math.max(absoluteWasteThreshold, reference * 3)) return { status: 'risk', nature, type }
    if (amount >= Math.max(absoluteReviewThreshold, reference * 1.75)) return { status: 'review', nature, type }
    return { status: 'reasonable', nature, type }
  }
  if (amount >= Math.max(250000, reference * 15)) return { status: 'high-risk', nature, type }
  if (amount >= Math.max(100000, reference * 8)) return { status: 'risk', nature, type }
  return { status: amount >= Math.max(30000, reference * 5) ? 'review' : 'reasonable', nature, type }
}

function spendingSignals(rows) {
  const amounts = rows.map(tx => Number(tx.amount || 0)).filter(amount => amount > 0)
  return {
    count: amounts.length,
    max: amounts.length ? Math.max(...amounts) : 0,
    average: amounts.length ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length : 0,
  }
}

function discretionaryCaution(type, amount, percent, signals, baseline = 5000) {
  const reference = Math.max(1000, baseline || 5000)
  if (type === 'treat') {
    return signals.max >= 8000 || amount >= 15000 || (signals.count >= 4 && amount >= 12000)
  }
  if (type === 'entertainment') {
    return signals.max >= 10000 || amount >= 15000 || (signals.count >= 3 && amount >= 10000)
  }
  const absoluteThreshold = type === 'shopping' ? 20000 : type === 'dining' ? 12000 : 15000
  const largeSingle = signals.max >= Math.max(absoluteThreshold, reference * 3)
  const repeatedLargePattern = signals.count >= 3 && amount >= Math.max(30000, reference * 6)
  if (type === 'game' || type === 'shopping' || type === 'dining' || type === 'entertainment') {
    return largeSingle || repeatedLargePattern || (signals.count >= 4 && percent >= 40)
  }
  return false
}

function detectKeywordSpending(expenses) {
  return keywordGroups.map(group => {
    const rows = expenses.filter(tx => {
      const haystack = `${tx.category || ''} ${tx.note || ''} ${tx.target_name || ''}`.toLowerCase()
      return group.keywords.some(keyword => haystack.includes(keyword))
    })
    return {
      ...group,
      rows,
      amount: rows.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    }
  }).filter(group => group.amount > 0).sort((a, b) => b.amount - a.amount)
}

function buildAnalysis(transactions, language) {
  const t = languageCopy(language)
  const expenses = transactions.filter(tx => tx.type === 'withdrawal')
  const total = expenses.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)

  if (!expenses.length || total <= 0) {
    return { expenses, total, categories: [], top: null, messages: [], risk: t.low }
  }

  const byCategory = expenses.reduce((acc, tx) => {
    const category = tx.category || 'General'
    acc[category] = (acc[category] || 0) + Number(tx.amount || 0)
    return acc
  }, {})

  const categories = Object.entries(byCategory)
    .map(([label, amount]) => ({ label, amount, percent: Math.round((amount / total) * 100) }))
    .sort((a, b) => b.amount - a.amount)

  const baseline = expenses.length >= 3 ? medianAmount(expenses) : 5000
  const assessments = Object.fromEntries(expenses.map(tx => [String(tx.id), assessExpense(tx, baseline)]))
  const keywordSpending = detectKeywordSpending(expenses)
  const riskyKeyword = keywordSpending.find(group => {
    if (!discretionaryTypes.has(group.id)) return false
    const percent = Math.round((group.amount / total) * 100)
    return discretionaryCaution(group.id, group.amount, percent, spendingSignals(group.rows), baseline)
  })
  const topKeyword = riskyKeyword || keywordSpending.find(group => group.amount / total >= 0.2)
  const top = topKeyword
    ? { label: topKeyword.label, amount: topKeyword.amount, percent: Math.round((topKeyword.amount / total) * 100), type: topKeyword.id }
    : { ...categories[0], type: categories[0]?.label?.toLowerCase() }
  const topRows = topKeyword
    ? topKeyword.rows
    : expenses.filter(tx => (tx.category || 'General') === top.label)
  const signals = spendingSignals(topRows)
  const isEssential = essentialTypes.has(top.type)
  const isKnownDiscretionary = discretionaryTypes.has(top.type)
  const severityOrder = { reasonable: 0, review: 1, risk: 2, 'high-risk': 3 }
  const rowSeverity = topRows.reduce((highest, tx) => {
    const status = assessments[String(tx.id)]?.status || 'reasonable'
    return severityOrder[status] > severityOrder[highest] ? status : highest
  }, 'reasonable')
  const repeatedRisk = isKnownDiscretionary && discretionaryCaution(top.type, top.amount, top.percent, signals, baseline)
  const cautionTier = repeatedRisk && severityOrder[rowSeverity] < severityOrder.risk ? 'risk' : rowSeverity
  const cautionNeeded = cautionTier !== 'reasonable'
  const risk = cautionTier === 'high-risk'
    ? t.highRiskLabel
    : cautionTier === 'risk'
      ? t.riskLabel
      : cautionTier === 'review'
        ? t.reviewLabel
        : t.low
  const cautionText = cautionTier === 'high-risk'
    ? t.highRiskCaution(top.label)
    : cautionTier === 'risk'
      ? t.riskCaution(top.label)
      : t.reviewCaution(top.label)
  const actionNeeded = severityOrder[cautionTier] >= severityOrder.risk
  const messages = []

  if (top.type === 'game') {
    messages.push({ kind: 'pattern', text: t.gamePattern(top.percent, top.amount) })
    if (cautionNeeded) messages.push({ kind: 'caution', severity: cautionTier, text: cautionText })
    messages.push({ kind: 'advice', text: t.gameAdvice })
    if (actionNeeded) messages.push({ kind: 'action', text: t.gameAction })
  } else if (top.type === 'dining') {
    messages.push({ kind: 'pattern', text: t.diningPattern(top.percent, top.amount) })
    if (cautionNeeded) messages.push({ kind: 'caution', severity: cautionTier, text: cautionText })
    messages.push({ kind: 'advice', text: t.diningAdvice })
    if (actionNeeded) messages.push({ kind: 'action', text: t.diningAction })
  } else {
    messages.push({ kind: 'pattern', text: t.genericPattern(top.label, top.percent, top.amount) })
    const categoryKey = top.label?.toLowerCase()
    const advice = categoryKey === 'food' ? t.foodAdvice
      : categoryKey === 'shopping' ? t.shoppingAdvice
        : categoryKey === 'transport' ? t.transportAdvice
          : t.genericAdvice(top.label)
    if (cautionNeeded) messages.push({ kind: 'caution', severity: cautionTier, text: cautionText })
    messages.push({ kind: 'advice', text: isEssential ? t.essentialAdvice(top.label, top.amount) : (cautionNeeded ? advice : t.normalAdvice(top.label)) })
    if (actionNeeded) messages.push({ kind: 'action', text: t.genericAction(top.label) })
  }

  return { expenses, total, categories, top, messages, risk, riskTone: cautionTier, cautionNeeded, signals, assessments, baseline }
}

function MessageBubble({ message, labels }) {
  const styles = {
    pattern: { icon: Brain, label: labels.patternTitle, bg: 'var(--accent-blue-light)', color: 'var(--accent-blue)' },
    advice: { icon: Sparkles, label: labels.advicePrefix, bg: 'var(--accent-green-light)', color: 'var(--accent-green)' },
    action: { icon: CheckCircle2, label: labels.actionPrefix, bg: 'var(--accent-yellow-light)', color: '#B45309' },
  }
  const cautionStyles = {
    review: { icon: AlertTriangle, label: labels.reviewLabel, bg: '#FEF3C7', color: '#B45309' },
    risk: { icon: AlertTriangle, label: labels.riskLabel, bg: '#FFEDD5', color: '#EA580C' },
    'high-risk': { icon: AlertTriangle, label: labels.highRiskLabel, bg: '#FEE2E2', color: '#DC2626' },
  }
  const style = message.kind === 'caution'
    ? (cautionStyles[message.severity] || cautionStyles.risk)
    : (styles[message.kind] || styles.advice)
  const Icon = style.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: 'none' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 12, background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ color: style.color, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>{style.label}</div>
        <div style={{ fontWeight: 700, lineHeight: 1.5 }}>{message.text}</div>
      </div>
    </motion.div>
  )
}

function readAdviceHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(adviceHistoryKey) || '[]')
    return Array.isArray(saved) ? saved.filter(item => item.analysisVersion === analysisVersion) : []
  } catch {
    return []
  }
}

function saveAdviceHistory(history) {
  localStorage.setItem(adviceHistoryKey, JSON.stringify(history.slice(0, 12)))
}

export default function ExpenseAnalyst() {
  const { language } = useLanguage()
  const t = languageCopy(language)
  const h = historyLabels(language)
  const [transactions, setTransactions] = useState([])
  const [adviceHistory, setAdviceHistory] = useState(() => readAdviceHistory())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await txApi.list()
      setTransactions(res.data || [])
    } catch (err) {
      console.error(err)
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const analysis = useMemo(() => buildAnalysis(transactions, language), [transactions, language])

  useEffect(() => {
    if (loading || analysis.total <= 0 || !analysis.top || analysis.messages.length === 0) return

    const signature = JSON.stringify({
      analysisVersion,
      language,
      total: Math.round(analysis.total),
      top: analysis.top.label,
      amount: Math.round(analysis.top.amount),
      messages: analysis.messages.map(message => message.text),
    })

    setAdviceHistory(current => {
      if (current[0]?.signature === signature) return current

      const nextItem = {
        id: `${Date.now()}`,
        analysisVersion,
        signature,
        createdAt: new Date().toISOString(),
        language,
        topLabel: analysis.top.label,
        total: analysis.total,
        risk: analysis.risk,
        messages: analysis.messages,
      }
      const next = [nextItem, ...current.filter(item => item.signature !== signature)].slice(0, 12)
      saveAdviceHistory(next)
      return next
    })
  }, [analysis, language, loading])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-paw">🐾</div>
        <p>{t.loading}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48, color: '#EF4444' }}>
        <AlertTriangle size={48} style={{ marginBottom: 16 }} />
        <h3>{error}</h3>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={load}>{t.retry}</button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-title">
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      {analysis.total <= 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Bot size={52} style={{ color: 'var(--accent-green)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{t.noDataTitle}</h3>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t.noDataBody}</p>
        </div>
      ) : (
        <>
          <div className="expense-summary-grid">
            <div className="card expense-summary-card">
              <div className="expense-summary-label">{t.totalSpent}</div>
              <div className="expense-summary-total">{currency(analysis.total)}</div>
            </div>
            <div className="card expense-summary-card">
              <div className="expense-summary-label">{t.topArea}</div>
              <div className="expense-summary-value">{analysis.top.label}</div>
              <div className="expense-summary-meta">{analysis.top.percent}% • {currency(analysis.top.amount)}</div>
            </div>
            <div className="card expense-summary-card">
              <div className="expense-summary-label">{t.riskLevel}</div>
              <div className="expense-summary-risk">
                <TrendingDown color={analysis.riskTone === 'high-risk' ? '#DC2626' : analysis.riskTone === 'risk' ? '#EA580C' : analysis.riskTone === 'review' ? '#B45309' : 'var(--accent-green)'} />
                <span>{analysis.risk}</span>
              </div>
            </div>
          </div>

          <div className="expense-analyst-grid">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <MessageCircle size={22} color="var(--accent-green)" />
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{t.chatTitle}</h3>
              </div>
              {analysis.messages.map((message, index) => (
                <MessageBubble key={`${message.kind}-${index}`} message={message} labels={t} />
              ))}
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 8, paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <CalendarDays size={18} color="var(--accent-purple)" />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{h.title}</h4>
                </div>
                {adviceHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                    {adviceHistory.map(item => (
                      <div
                        key={item.id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: 12,
                          background: 'var(--bg-secondary)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                          <div style={{ fontWeight: 900 }}>{item.topLabel}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                          {currency(item.total)} • {item.risk}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {item.messages.map((message, index) => (
                            <div key={`${item.id}-${index}`} style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--text-secondary)', fontWeight: 700 }}>
                              {message.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 14 }}>{h.empty}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <PieChart size={20} color="var(--accent-blue)" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{t.breakdownTitle}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {analysis.categories.slice(0, 6).map(category => (
                    <div key={category.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: 6 }}>
                        <span>{category.label}</span>
                        <span>{category.percent}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ width: `${category.percent}%`, height: '100%', background: category.label === analysis.top.label ? '#EF4444' : 'var(--accent-blue)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <CalendarDays size={20} color="var(--accent-purple)" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{t.recentTitle}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analysis.expenses.slice(0, 10).map(tx => {
                    const assessment = analysis.assessments[String(tx.id)] || { status: 'reasonable' }
                    const assessmentView = assessment.status === 'high-risk'
                      ? { label: t.highRiskLabel, color: '#B91C1C', background: '#FECACA' }
                      : assessment.status === 'risk'
                        ? { label: t.riskLabel, color: '#C2410C', background: '#FFEDD5' }
                        : assessment.status === 'review'
                          ? { label: t.reviewLabel, color: '#B45309', background: '#FEF3C7' }
                          : { label: t.reasonableLabel, color: '#047857', background: '#D1FAE5' }
                    return (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.note || tx.category || 'Expense'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>{tx.category || 'General'} • {new Date(tx.transaction_date).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                          <div style={{ color: '#EF4444', fontWeight: 900 }}>{currency(Number(tx.amount || 0))}</div>
                          <span style={{ padding: '3px 7px', borderRadius: 999, background: assessmentView.background, color: assessmentView.color, fontSize: 10, fontWeight: 900 }}>
                            {assessmentView.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
