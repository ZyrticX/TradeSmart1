# 📊 TradeSmart - מדריך מלא למסד הנתונים

## 📋 תוכן עניינים
1. [מבנה הטבלאות](#מבנה-הטבלאות)
2. [פונקציות אוטומטיות](#פונקציות-אוטומטיות)
3. [אבטחה (RLS)](#אבטחה-rls)
4. [API - איך להשתמש](#api---איך-להשתמש)
5. [דוגמאות קוד](#דוגמאות-קוד)
6. [שאילתות שימושיות](#שאילתות-שימושיות)

---

## 🗄️ מבנה הטבלאות

### 1. `accounts` - חשבונות מסחר

חשבון מסחר הוא הישות המרכזית. כל משתמש יכול ליצור מספר חשבונות.

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,              -- מזהה המשתמש (Supabase Auth)
    name TEXT NOT NULL,                 -- שם החשבון
    account_size DECIMAL(15,2),         -- גודל החשבון בדולר
    default_risk_percentage DECIMAL(5,2), -- אחוז סיכון ברירת מחדל
    max_position_size_percentage DECIMAL(5,2), -- מקסימום גודל פוזיציה
    commission_fee DECIMAL(10,2),       -- עמלת ברוקר
    strategies TEXT[],                  -- רשימת אסטרטגיות
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**שדות חובה:**
- ✅ `name` - שם החשבון
- ✅ `user_id` - מתווסף אוטומטית!

**ברירות מחדל:**
- `account_size`: 100,000
- `default_risk_percentage`: 2.0
- `max_position_size_percentage`: 25.0
- `commission_fee`: 0

**דוגמה:**
```javascript
const account = await Account.create({
  name: "Main Trading Account",
  account_size: 50000,
  default_risk_percentage: 2,
  strategies: ["Breakout", "Support/Resistance"]
});
// user_id יתווסף אוטומטית!
```

---

### 2. `trades` - עסקאות

כל העסקאות (פתוחות וסגורות) נשמרות כאן.

```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,           -- חשבון שהעסקה שייכת לו
    symbol TEXT NOT NULL,               -- סימבול המניה (AAPL, TSLA...)
    date_time TIMESTAMP NOT NULL,       -- תאריך ושעת הכניסה
    direction TEXT NOT NULL,            -- 'long' או 'short'
    entry_price DECIMAL(15,4) NOT NULL, -- מחיר כניסה
    quantity INTEGER NOT NULL,          -- כמות מניות נוכחית
    total_quantity INTEGER NOT NULL,    -- כמות מניות סה"כ (התחלתי)
    stop_price DECIMAL(15,4) NOT NULL,  -- מחיר סטופ
    target_price DECIMAL(15,4),         -- מחיר יעד (אופציונלי)
    risk_percentage DECIMAL(5,2),       -- אחוז סיכון
    risk_amount DECIMAL(15,2),          -- סכום סיכון בדולר
    position_size DECIMAL(15,2),        -- גודל פוזיציה נוכחי
    total_investment DECIMAL(15,2),     -- השקעה סה"כ
    strategy TEXT,                      -- אסטרטגיה
    confidence_level INTEGER,           -- רמת ביטחון (0-5)
    is_partially_closed BOOLEAN,        -- האם נסגר חלקית
    profit_loss DECIMAL(15,2),          -- רווח/הפסד מצטבר
    total_commission DECIMAL(10,2),     -- עמלות סה"כ
    status TEXT NOT NULL,               -- 'open' או 'closed'
    close_date TIMESTAMP,               -- תאריך סגירה
    close_price DECIMAL(15,4),          -- מחיר סגירה
    close_reason TEXT,                  -- סיבת סגירה
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**שדות חובה:**
- ✅ `account_id` - ID של החשבון
- ✅ `symbol` - סימבול (אותיות אנגליות בלבד)
- ✅ `date_time` - תאריך ושעה
- ✅ `direction` - 'long' או 'short'
- ✅ `entry_price` - מחיר כניסה
- ✅ `quantity` - כמות
- ✅ `stop_price` - סטופ לוס

**Constraints (אילוצים):**
- `entry_price` > 0
- `quantity` > 0
- `direction` IN ('long', 'short')
- `status` IN ('open', 'closed')
- `confidence_level` בין 0 ל-5
- אם `status = 'closed'` אז חייב `close_date` ו-`close_price`

**דוגמה:**
```javascript
const trade = await Trade.create({
  account_id: accountId,
  symbol: "AAPL",
  date_time: new Date().toISOString(),
  direction: "long",
  entry_price: 150.00,
  quantity: 100,
  total_quantity: 100,
  stop_price: 147.00,
  target_price: 156.00,
  risk_percentage: 2.0,
  risk_amount: 300.00,
  position_size: 15000.00,
  total_investment: 15000.00,
  strategy: "Breakout",
  confidence_level: 4,
  status: "open"
});
```

---

### 3. `trade_events` - אירועי עסקאות

כל אירוע בעסקה (קנייה, מכירה, הוספת כמות, שינוי סטופ) נרשם כאן.

```sql
CREATE TABLE trade_events (
    id UUID PRIMARY KEY,
    trade_id UUID NOT NULL,             -- העסקה שהאירוע שייך לה
    type TEXT NOT NULL,                 -- סוג האירוע
    date TIMESTAMP NOT NULL,            -- תאריך האירוע
    quantity INTEGER,                   -- כמות (אם רלוונטי)
    price DECIMAL(15,4),                -- מחיר (אם רלוונטי)
    stop_loss_at_event DECIMAL(15,4),   -- סטופ לוס בזמן האירוע
    notes TEXT,                         -- הערות
    screenshot_url TEXT,                -- לינק לצילום מסך
    profit_loss DECIMAL(15,2),          -- רווח/הפסד באירוע זה
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**סוגי אירועים (type):**
- `buy` - קנייה ראשונית
- `sell` - מכירה מלאה
- `add_quantity` - הוספת כמות (פירמוד)
- `partial_close` - סגירה חלקית
- `full_close` - סגירה מלאה
- `stop_adjustment` - שינוי סטופ לוס
- `note` - הערה כללית

**דוגמה:**
```javascript
const event = await TradeEvent.create({
  trade_id: tradeId,
  type: "buy",
  date: new Date().toISOString(),
  quantity: 100,
  price: 150.00,
  stop_loss_at_event: 147.00,
  notes: "Entry based on breakout pattern",
  screenshot_url: "https://..."
});
```

---

### 4. `journal_entries` - יומן מסחר

```sql
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,              -- מתווסף אוטומטית!
    date DATE NOT NULL,                 -- תאריך הרשומה
    title TEXT,                         -- כותרת
    content TEXT NOT NULL,              -- תוכן היומן
    mood TEXT,                          -- מצב רוח
    lessons_learned TEXT,               -- לקחים שנלמדו
    screenshot_urls TEXT[],             -- מערך של לינקים לתמונות
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**מצבי רוח (mood):**
- `excellent` - מצוין
- `good` - טוב
- `neutral` - ניטרלי
- `poor` - גרוע
- `terrible` - נורא

**דוגמה:**
```javascript
const entry = await JournalEntry.create({
  date: new Date().toISOString().split('T')[0],
  title: "Great Trading Day",
  content: "Today I followed my plan perfectly...",
  mood: "excellent",
  lessons_learned: "Patience is key"
});
// user_id יתווסף אוטומטית!
```

---

### 5. `watchlist_notes` - רשימת מעקב

```sql
CREATE TABLE watchlist_notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,              -- מתווסף אוטומטית!
    symbol TEXT NOT NULL,               -- סימבול המניה
    notes TEXT,                         -- הערות
    target_price DECIMAL(15,4),         -- מחיר יעד
    alert_price DECIMAL(15,4),          -- מחיר התראה
    status TEXT,                        -- סטטוס
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**סטטוסים (status):**
- `watching` - במעקב
- `entered` - נכנסתי לעסקה
- `passed` - החמצתי את ההזדמנות

**דוגמה:**
```javascript
const watchlist = await WatchlistNote.create({
  symbol: "TSLA",
  notes: "Watching for breakout above $250",
  target_price: 260.00,
  alert_price: 250.00,
  status: "watching"
});
// user_id יתווסף אוטומטית!
```

---

### 6. `learning_materials` - חומרי למידה

```sql
CREATE TABLE learning_materials (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,              -- מתווסף אוטומטית!
    title TEXT NOT NULL,                -- כותרת
    description TEXT,                   -- תיאור
    type TEXT,                          -- סוג החומר
    url TEXT,                           -- לינק
    status TEXT,                        -- סטטוס למידה
    rating INTEGER,                     -- דירוג (0-5)
    notes TEXT,                         -- הערות
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**סוגי חומרים (type):**
- `video` - וידאו
- `article` - מאמר
- `book` - ספר
- `course` - קורס
- `other` - אחר

**סטטוסים (status):**
- `to_learn` - לעתיד
- `in_progress` - בתהליך
- `completed` - הושלם

**דוגמה:**
```javascript
const material = await LearningMaterial.create({
  title: "Technical Analysis Masterclass",
  description: "Complete guide to chart patterns",
  type: "course",
  url: "https://example.com/course",
  status: "in_progress",
  rating: 5
});
// user_id יתווסף אוטומטית!
```

---

### 7. `user_preferences` - העדפות משתמש

```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,      -- משתמש אחד = העדפה אחת
    language TEXT,                      -- 'en', 'he', 'es'
    theme TEXT,                         -- 'light', 'dark'
    currency TEXT,                      -- 'USD', 'EUR', etc.
    timezone TEXT,                      -- 'UTC', 'America/New_York', etc.
    notifications_enabled BOOLEAN,
    email_notifications BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## ⚙️ פונקציות אוטומטיות

### 1. Auto User ID (הוספת user_id אוטומטית)

**מה זה עושה?**
כאשר אתה יוצר רשומה חדשה בטבלאות הבאות, ה-`user_id` מתווסף אוטומטית:
- `accounts`
- `journal_entries`
- `watchlist_notes`
- `learning_materials`

**איך זה עובד?**
```javascript
// לפני - היית צריך לעשות:
const entry = await JournalEntry.create({
  user_id: currentUser.id, // ❌ לא צריך יותר!
  title: "My Entry",
  content: "..."
});

// עכשיו - פשוט:
const entry = await JournalEntry.create({
  title: "My Entry",
  content: "..."
});
// user_id מתווסף אוטומטית מה-session! ✅
```

### 2. Auto Updated At (עדכון updated_at אוטומטי)

**מה זה עושה?**
בכל פעם שמעדכנים רשומה, השדה `updated_at` מתעדכן אוטומטית.

**איך זה עובד?**
```javascript
// עדכון רשומה
await Trade.update(tradeId, {
  status: "closed",
  close_price: 155.00
});
// updated_at יתעדכן אוטומטית ל-NOW() ✅
```

---

## 🔐 אבטחה (RLS)

### Row Level Security - מה זה?

RLS (Row Level Security) מבטיח שכל משתמש רואה **רק** את הנתונים שלו.

### איך זה עובד?

#### דוגמה 1: Journal Entries
```sql
-- משתמש A יוצר רשומת יומן
INSERT INTO journal_entries (title, content) 
VALUES ('My Entry', 'Secret content');
-- user_id = A מתווסף אוטומטית

-- משתמש B מנסה לקרוא את כל הרשומות
SELECT * FROM journal_entries;
-- יקבל רק את הרשומות שלו (user_id = B)
-- לא יראה את הרשומה של משתמש A! ✅
```

#### דוגמה 2: Trades
```sql
-- משתמש A יוצר חשבון
INSERT INTO accounts (name) VALUES ('My Account');
-- user_id = A

-- משתמש A יוצר עסקה
INSERT INTO trades (account_id, ...) 
VALUES (account_id_of_A, ...);

-- משתמש B מנסה לקרוא עסקאות
SELECT * FROM trades;
-- יקבל רק עסקאות משלו
-- לא יראה עסקאות של משתמש A! ✅
```

### מדיניות אבטחה לכל טבלה

| טבלה | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| `accounts` | ✅ שלי | ✅ שלי | ✅ שלי | ✅ שלי |
| `trades` | ✅ מהחשבונות שלי | ✅ לחשבונות שלי | ✅ מהחשבונות שלי | ✅ מהחשבונות שלי |
| `trade_events` | ✅ מהעסקאות שלי | ✅ לעסקאות שלי | ✅ מהעסקאות שלי | ✅ מהעסקאות שלי |
| `journal_entries` | ✅ שלי | ✅ שלי | ✅ שלי | ✅ שלי |
| `watchlist_notes` | ✅ שלי | ✅ שלי | ✅ שלי | ✅ שלי |
| `learning_materials` | ✅ שלי | ✅ שלי | ✅ שלי | ✅ שלי |
| `user_preferences` | ✅ שלי | ✅ שלי | ✅ שלי | ✅ שלי |

---

## 🔌 API - איך להשתמש

### 1. Create (יצירה)

```javascript
// יצירת חשבון
const account = await Account.create({
  name: "Main Account",
  account_size: 50000
});

// יצירת עסקה
const trade = await Trade.create({
  account_id: account.id,
  symbol: "AAPL",
  date_time: new Date().toISOString(),
  direction: "long",
  entry_price: 150.00,
  quantity: 100,
  stop_price: 147.00,
  status: "open"
  // ... שאר השדות
});

// יצירת יומן
const journal = await JournalEntry.create({
  date: "2025-10-02",
  title: "Great Day",
  content: "Followed my plan perfectly"
});
```

### 2. Get (קבלת רשומה בודדת)

```javascript
// קבלת חשבון לפי ID
const account = await Account.get(accountId);

// קבלת עסקה לפי ID
const trade = await Trade.get(tradeId);

// קבלת רשומת יומן
const entry = await JournalEntry.get(entryId);
```

### 3. Filter (סינון רשומות)

```javascript
// כל העסקאות של חשבון מסוים
const trades = await Trade.filter(
  { account_id: accountId },
  '-date_time' // מיון לפי תאריך (יורד)
);

// רק עסקאות פתוחות
const openTrades = await Trade.filter(
  { account_id: accountId, status: 'open' },
  '-date_time'
);

// רק עסקאות סגורות
const closedTrades = await Trade.filter(
  { account_id: accountId, status: 'closed' },
  '-close_date'
);

// אירועים של עסקה מסוימת
const events = await TradeEvent.filter(
  { trade_id: tradeId },
  'date' // מיון לפי תאריך (עולה)
);

// רשימת מעקב - רק במעקב
const watching = await WatchlistNote.filter(
  { status: 'watching' },
  '-created_at'
);
```

### 4. GetAll (קבלת כל הרשומות)

```javascript
// כל החשבונות שלי
const accounts = await Account.getAll('-created_at');

// כל רשומות היומן
const entries = await JournalEntry.getAll('-date');

// כל חומרי הלמידה
const materials = await LearningMaterial.getAll('-created_at');
```

### 5. Update (עדכון)

```javascript
// עדכון חשבון
await Account.update(accountId, {
  account_size: 60000,
  commission_fee: 5.00
});

// סגירת עסקה
await Trade.update(tradeId, {
  status: "closed",
  close_date: new Date().toISOString(),
  close_price: 155.00,
  profit_loss: 500.00
});

// עדכון סטטוס חומר למידה
await LearningMaterial.update(materialId, {
  status: "completed",
  rating: 5,
  notes: "Excellent course!"
});
```

### 6. Delete (מחיקה)

```javascript
// מחיקת חשבון (ימחק גם את כל העסקאות!)
await Account.delete(accountId);

// מחיקת עסקה (ימחק גם את כל האירועים!)
await Trade.delete(tradeId);

// מחיקת רשומת יומן
await JournalEntry.delete(entryId);
```

---

## 💡 דוגמאות קוד מלאות

### דוגמה 1: יצירת עסקה חדשה עם אירוע

```javascript
import { Trade, TradeEvent } from '@/api/entities';

async function createNewTrade(accountId, formData) {
  try {
    // חישוב ערכים
    const entryPrice = parseFloat(formData.entry_price);
    const stopPrice = parseFloat(formData.stop_price);
    const quantity = parseInt(formData.quantity);
    const riskAmount = Math.abs(entryPrice - stopPrice) * quantity;
    const positionSize = entryPrice * quantity;

    // יצירת העסקה
    const trade = await Trade.create({
      account_id: accountId,
      symbol: formData.symbol.toUpperCase(),
      date_time: formData.date_time,
      direction: formData.direction,
      entry_price: entryPrice,
      quantity: quantity,
      total_quantity: quantity,
      stop_price: stopPrice,
      target_price: formData.target_price ? parseFloat(formData.target_price) : null,
      risk_percentage: parseFloat(formData.risk_percentage),
      risk_amount: riskAmount,
      position_size: positionSize,
      total_investment: positionSize,
      strategy: formData.strategy,
      confidence_level: formData.confidence_level,
      status: 'open'
    });

    // יצירת אירוע הכניסה
    await TradeEvent.create({
      trade_id: trade.id,
      type: 'buy',
      date: formData.date_time,
      quantity: quantity,
      price: entryPrice,
      stop_loss_at_event: stopPrice,
      notes: formData.notes,
      screenshot_url: formData.screenshot_url
    });

    return trade;
  } catch (error) {
    console.error('Error creating trade:', error);
    throw error;
  }
}
```

### דוגמה 2: סגירה חלקית של עסקה

```javascript
async function partialCloseTrade(tradeId, sellQuantity, sellPrice) {
  try {
    // קבלת העסקה הנוכחית
    const trade = await Trade.get(tradeId);
    
    // חישוב רווח/הפסד
    const profitPerShare = trade.direction === 'long' 
      ? sellPrice - trade.entry_price 
      : trade.entry_price - sellPrice;
    const profitLoss = profitPerShare * sellQuantity;
    
    // עדכון העסקה
    const newQuantity = trade.quantity - sellQuantity;
    const isFullyClosed = newQuantity === 0;
    
    await Trade.update(tradeId, {
      quantity: newQuantity,
      is_partially_closed: !isFullyClosed,
      profit_loss: trade.profit_loss + profitLoss,
      status: isFullyClosed ? 'closed' : 'open',
      close_date: isFullyClosed ? new Date().toISOString() : null,
      close_price: isFullyClosed ? sellPrice : null
    });
    
    // יצירת אירוע
    await TradeEvent.create({
      trade_id: tradeId,
      type: isFullyClosed ? 'full_close' : 'partial_close',
      date: new Date().toISOString(),
      quantity: sellQuantity,
      price: sellPrice,
      profit_loss: profitLoss
    });
    
    return { success: true, profitLoss };
  } catch (error) {
    console.error('Error closing trade:', error);
    throw error;
  }
}
```

### דוגמה 3: סטטיסטיקות חשבון

```javascript
async function getAccountStatistics(accountId) {
  try {
    const trades = await Trade.filter({ account_id: accountId });
    
    const openTrades = trades.filter(t => t.status === 'open');
    const closedTrades = trades.filter(t => t.status === 'closed');
    
    const winningTrades = closedTrades.filter(t => t.profit_loss > 0);
    const losingTrades = closedTrades.filter(t => t.profit_loss < 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const totalRisk = openTrades.reduce((sum, t) => sum + (t.risk_amount || 0), 0);
    const totalPosition = openTrades.reduce((sum, t) => sum + (t.position_size || 0), 0);
    
    const winRate = closedTrades.length > 0 
      ? (winningTrades.length / closedTrades.length * 100).toFixed(2) 
      : 0;
    
    return {
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: parseFloat(winRate),
      totalPnL,
      totalRisk,
      totalPosition
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
}
```

---

## 🔍 שאילתות שימושיות

### 1. מציאת עסקאות הכי רווחיות

```javascript
const trades = await Trade.filter({ 
  account_id: accountId, 
  status: 'closed' 
});

const sortedByProfit = trades
  .filter(t => t.profit_loss > 0)
  .sort((a, b) => b.profit_loss - a.profit_loss)
  .slice(0, 10); // Top 10
```

### 2. מציאת האסטרטגיה הכי טובה

```javascript
const closedTrades = await Trade.filter({ 
  account_id: accountId, 
  status: 'closed' 
});

const byStrategy = closedTrades.reduce((acc, trade) => {
  const strategy = trade.strategy || 'Unknown';
  if (!acc[strategy]) {
    acc[strategy] = { wins: 0, losses: 0, totalPnL: 0, count: 0 };
  }
  
  acc[strategy].count++;
  acc[strategy].totalPnL += trade.profit_loss || 0;
  
  if (trade.profit_loss > 0) acc[strategy].wins++;
  if (trade.profit_loss < 0) acc[strategy].losses++;
  
  return acc;
}, {});

// חישוב win rate לכל אסטרטגיה
Object.keys(byStrategy).forEach(strategy => {
  const data = byStrategy[strategy];
  data.winRate = (data.wins / data.count * 100).toFixed(2);
});
```

### 3. רשומות יומן לפי תקופה

```javascript
const startDate = '2025-10-01';
const endDate = '2025-10-31';

const entries = await JournalEntry.getAll('-date');

const filtered = entries.filter(entry => {
  const date = new Date(entry.date);
  return date >= new Date(startDate) && date <= new Date(endDate);
});
```

---

## 📊 Views (תצוגות) שימושיות

### 1. active_trades_summary

מציג סיכום של כל העסקאות הפעילות לכל חשבון.

```sql
SELECT * FROM active_trades_summary 
WHERE user_id = auth.uid();
```

**עמודות:**
- `user_id`
- `account_id`
- `account_name`
- `open_trades_count` - מספר עסקאות פתוחות
- `total_position_value` - ערך כל הפוזיציות
- `total_risk_amount` - סכום סיכון כולל
- `avg_confidence_level` - רמת ביטחון ממוצעת

### 2. trading_performance_summary

מציג ביצועים כוללים לכל חשבון.

```sql
SELECT * FROM trading_performance_summary 
WHERE user_id = auth.uid();
```

**עמודות:**
- `user_id`
- `account_id`
- `account_name`
- `total_trades` - סה"כ עסקאות
- `winning_trades` - עסקאות רווחיות
- `losing_trades` - עסקאות הפסדיות
- `total_pnl` - רווח/הפסד כולל
- `win_rate_percentage` - אחוז הצלחה

---

## 🎯 Best Practices (שיטות עבודה מומלצות)

### 1. תמיד השתמש ב-try-catch

```javascript
try {
  const trade = await Trade.create(data);
  console.log('Trade created:', trade);
} catch (error) {
  console.error('Failed to create trade:', error);
  alert('Error creating trade. Please try again.');
}
```

### 2. אמת נתונים לפני שליחה

```javascript
if (!symbol || symbol.length === 0) {
  alert('Symbol is required');
  return;
}

if (entryPrice <= 0) {
  alert('Entry price must be positive');
  return;
}

// רק אז שלח לשרת
const trade = await Trade.create(data);
```

### 3. עדכן את ה-UI אחרי שינויים

```javascript
async function deleteTrade(tradeId) {
  await Trade.delete(tradeId);
  // רענן את הרשימה
  await loadTrades();
}
```

### 4. השתמש בסינון במקום לקבל הכל

```javascript
// ❌ לא טוב
const allTrades = await Trade.getAll();
const openTrades = allTrades.filter(t => t.status === 'open');

// ✅ טוב
const openTrades = await Trade.filter({ status: 'open' });
```

---

## 🐛 פתרון בעיות נפוצות

### בעיה: "row level security policy violation"

**סיבה:** מנסה לגשת לנתונים של משתמש אחר.

**פתרון:** 
1. ודא שאתה מחובר (session תקף)
2. בדוק שה-`account_id` שייך למשתמש הנוכחי
3. נקה cookies ו-localStorage והתחבר מחדש

### בעיה: "user_id cannot be null"

**סיבה:** Trigger לא עבד או session פג.

**פתרון:**
1. התנתק והתחבר מחדש
2. ודא שה-Triggers נוצרו (בדוק ב-SQL Editor)
3. אם עדיין לא עובד, הוסף `user_id` ידנית

### בעיה: "insert or update violates foreign key constraint"

**סיבה:** מנסה ליצור עסקה עם `account_id` שלא קיים.

**פתרון:**
```javascript
// ודא שהחשבון קיים
const account = await Account.get(accountId);
if (!account) {
  alert('Account not found. Please create an account first.');
  return;
}
```

---

## 📞 עזרה נוספת

- 📖 [Supabase Docs](https://supabase.com/docs)
- 📖 [PostgreSQL Docs](https://www.postgresql.org/docs/)
- 📖 FINAL_SETUP_GUIDE.md
- 📖 SUPABASE_SETUP.md

---

**נוצר ב:** אוקטובר 2025  
**גרסה:** 2.0.0  
**עדכון אחרון:** הקובץ מתעדכן אוטומטית עם השינויים במערכת

