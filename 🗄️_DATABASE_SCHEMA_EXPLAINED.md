# 🗄️ מבנה מסד הנתונים - TradeSmart

## 📊 ERD (Entity Relationship Diagram)

```
┌─────────────────────┐
│   auth.users        │  ← Supabase Auth (משתמש)
│  ─────────────────  │
│  • id (UUID) [PK]   │  ← מפתח ראשי
│  • email            │
│  • password (hash)  │
│  • created_at       │
└──────┬──────────────┘
       │
       │ user_id (FK)
       │
       ├────────────────────────────┬─────────────────────┐
       │                            │                     │
       │                            │                     │
┌──────▼──────────────┐  ┌──────────▼──────────┐  ┌──────▼─────────────┐
│  public.profiles    │  │  public.accounts    │  │  public.journal    │
│  ─────────────────  │  │  ─────────────────  │  │  ─────────────────  │
│  • user_id [PK,FK]  │  │  • id [PK]          │  │  • id [PK]          │
│  • full_name        │  │  • user_id [FK] ────┼──┤  • account_id [FK]  │
│  • avatar_url       │  │  • name             │  │  • date             │
│  • role             │  │  • account_size     │  │  • mood             │
│  • phone            │  │  • currency         │  │  • notes            │
└─────────────────────┘  │  • risk_%           │  └─────────────────────┘
                         │  • strategies[]     │
                         │  • sentiments[]     │
                         └──────┬──────────────┘
                                │
                    ┌───────────┴───────────────┐
                    │                           │
             ┌──────▼──────────┐      ┌─────────▼────────────┐
             │  public.trades  │      │  public.watchlist    │
             │  ─────────────  │      │  ─────────────────   │
             │  • id [PK]      │      │  • id [PK]           │
             │  • account_id   │      │  • account_id [FK]   │
             │  • user_id [FK] │      │  • symbol            │
             │  • symbol       │      │  • target_price      │
             │  • direction    │      │  • notes             │
             │  • entry_price  │      └──────────────────────┘
             │  • quantity     │
             │  • stop_price   │
             │  • status       │
             └──────┬──────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
┌───────▼────────────┐  ┌──────▼─────────────┐
│  trade_events      │  │  learning_materials│
│  ────────────────  │  │  ─────────────────│
│  • id [PK]         │  │  • id [PK]         │
│  • trade_id [FK]   │  │  • account_id [FK] │
│  • event_type      │  │  • title           │
│  • quantity        │  │  • topic           │
│  • price           │  │  • url             │
└────────────────────┘  │  • status          │
                        └────────────────────┘
```

---

## 🔑 יחסים (Relationships)

### 1️⃣ **User → Profile** (1:1)
```
auth.users.id ──1:1──> public.profiles.user_id
```
- **כל משתמש** יכול להיות רק **פרופיל אחד**
- נוצר אוטומטי ב-trigger `handle_new_user()`

### 2️⃣ **User → Accounts** (1:Many) ⭐
```
auth.users.id ──1:Many──> public.accounts.user_id
```
- **משתמש אחד** יכול לנהל **כמה חשבונות מסחר**!
- דוגמה:
  - Account 1: "Demo Account" (USD 10,000)
  - Account 2: "Live Trading" (ILS 50,000)
  - Account 3: "Crypto Portfolio" (USDT 5,000)

### 3️⃣ **Account → Trades** (1:Many)
```
public.accounts.id ──1:Many──> public.trades.account_id
```
- **חשבון אחד** יכול להכיל **כמה עסקאות**
- כל עסקה שייכת רק לחשבון אחד

### 4️⃣ **Trade → Trade Events** (1:Many)
```
public.trades.id ──1:Many──> public.trade_events.trade_id
```
- **עסקה אחת** יכולה להכיל **כמה אירועים**:
  - פתיחה ראשונית
  - הוספת כמות (average up/down)
  - סגירה חלקית
  - סגירה מלאה

### 5️⃣ **Account → Journal** (1:Many)
```
public.accounts.id ──1:Many──> public.journal_entries.account_id
```
- **חשבון אחד** → **כמה ערכי יומן**

### 6️⃣ **Account → Watchlist** (1:Many)
```
public.accounts.id ──1:Many──> public.watchlist_notes.account_id
```
- **חשבון אחד** → **כמה סימנים ב-watchlist**

### 7️⃣ **Account → Learning Materials** (1:Many)
```
public.accounts.id ──1:Many──> public.learning_materials.account_id
```
- **חשבון אחד** → **כמה חומרי למידה**

---

## 📋 טבלאות - הסבר מפורט

### 1. **`auth.users`** (Supabase Auth)
**תפקיד:** ניהול משתמשים ואימות

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | מזהה ייחודי (PK) |
| `email` | TEXT | כתובת מייל |
| `encrypted_password` | TEXT | סיסמה מוצפנת |
| `email_confirmed_at` | TIMESTAMP | תאריך אימות מייל |
| `created_at` | TIMESTAMP | תאריך יצירה |

**הערות:**
- מנוהלת על ידי Supabase
- לא ניתן לגשת ישירות (רק דרך API)
- RLS מוגדר אוטומטית

---

### 2. **`public.profiles`** (פרופיל משתמש)
**תפקיד:** מידע נוסף על המשתמש

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `user_id` | UUID | NO | מזהה משתמש (PK, FK → auth.users) |
| `full_name` | TEXT | YES | שם מלא |
| `avatar_url` | TEXT | YES | URL לתמונת פרופיל |
| `role` | TEXT | YES | תפקיד (admin/user/trader) |
| `phone` | TEXT | YES | טלפון |
| `timezone` | TEXT | YES | אזור זמן |
| `preferred_language` | TEXT | YES | שפה מועדפת (en/he) |
| `created_at` | TIMESTAMP | NO | תאריך יצירה |
| `updated_at` | TIMESTAMP | NO | תאריך עדכון אחרון |

**Trigger:**
```sql
-- יוצר פרופיל אוטומטית כשמשתמש נרשם
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**RLS Policies:**
- כל משתמש יכול לקרוא/לערוך רק את הפרופיל שלו

---

### 3. **`public.accounts`** (חשבונות מסחר) ⭐
**תפקיד:** ניהול חשבונות מסחר נפרדים

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | מזהה חשבון (PK) |
| `user_id` | UUID | auth.uid() | בעל החשבון (FK → auth.users) |
| `name` | VARCHAR(255) | - | שם החשבון |
| `currency` | VARCHAR(255) | 'USD' | מטבע |
| `account_size` | INTEGER | 100000 | גודל חשבון |
| `default_risk_percentage` | DECIMAL(15,2) | 2.0 | סיכון לעסקה (%) |
| `max_account_risk_percentage` | DECIMAL(15,2) | 10.0 | סיכון מקסימלי לחשבון (%) |
| `max_position_size_percentage` | DECIMAL(15,2) | 25.0 | גודל פוזיציה מקסימלי (%) |
| `commission_fee` | DECIMAL(15,2) | 8.0 | עמלת קניה/מכירה |
| `strategies` | TEXT | - | אסטרטגיות (JSON/Array) |
| `sentiments` | TEXT | - | סנטימנטים (JSON/Array) |
| `is_sample` | BOOLEAN | FALSE | האם חשבון דמו |
| `created_date` | TIMESTAMPTZ | now() | תאריך יצירה |
| `updated_date` | TIMESTAMPTZ | now() | תאריך עדכון |
| `created_by_id` | UUID | auth.uid() | מי יצר |
| `created_by` | VARCHAR(255) | auth.email() | מייל היוצר |

**דוגמה:**
```sql
-- משתמש עם 3 חשבונות:
INSERT INTO accounts (user_id, name, currency, account_size) VALUES
  ('user-123', 'Demo Account', 'USD', 10000),
  ('user-123', 'Live ILS', 'ILS', 50000),
  ('user-123', 'Crypto', 'USDT', 5000);
```

**RLS Policies:**
- `SELECT`: כל משתמש רואה רק את החשבונות שלו
- `INSERT`: יכול ליצור חשבונות חדשים
- `UPDATE`: יכול לערוך רק את שלו
- `DELETE`: יכול למחוק רק את שלו

---

### 4. **`public.trades`** (עסקאות)
**תפקיד:** רישום עסקאות מסחר

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | מזהה עסקה (PK) |
| `account_id` | UUID | חשבון משויך (FK → accounts) |
| `user_id` | UUID | בעל העסקה (FK → auth.users) |
| `symbol` | VARCHAR(255) | סימבול (AAPL, GOOGL...) |
| `date_time` | TIMESTAMPTZ | תאריך פתיחה |
| `direction` | VARCHAR(255) | Long / Short |
| `entry_price` | DECIMAL(15,2) | מחיר כניסה |
| `quantity` | DECIMAL(15,2) | כמות |
| `total_quantity` | DECIMAL(15,2) | כמות כוללת (אחרי averages) |
| `stop_price` | DECIMAL(15,2) | מחיר סטופ |
| `target_price` | TEXT | מחיר יעד |
| `risk_percentage` | DECIMAL(15,2) | אחוז סיכון |
| `risk_amount` | DECIMAL(15,2) | סכום סיכון |
| `position_size` | INTEGER | גודל פוזיציה |
| `total_investment` | INTEGER | השקעה כוללת |
| `current_price` | DECIMAL(15,2) | מחיר נוכחי |
| `exit_price` | TEXT | מחיר יציאה |
| `exit_date` | TEXT | תאריך יציאה |
| `status` | VARCHAR(255) | Open / Closed / PartialClose |
| `strategy` | VARCHAR(255) | אסטרטגיה |
| `notes` | VARCHAR(255) | הערות |
| `screenshot_url` | VARCHAR(255) | צילום מסך |
| `profit_loss` | TEXT | רווח/הפסד |
| `profit_loss_percentage` | TEXT | רווח/הפסד (%) |
| `confidence_level` | TEXT | רמת ביטחון |
| `is_partially_closed` | BOOLEAN | האם נסגרה חלקית |
| `total_commission` | DECIMAL(15,2) | עמלות כוללות |
| `is_sample` | BOOLEAN | האם עסקת דמו |

**Constraints:**
```sql
CHECK (direction IN ('Long', 'Short'))
CHECK (status IN ('Open', 'Closed', 'PartialClose'))
```

**RLS Policies:**
- `SELECT`: רק עסקאות שבבעלות המשתמש
- `INSERT/UPDATE/DELETE`: רק המשתמש שיצר

---

### 5. **`public.trade_events`** (אירועי עסקה)
**תפקיד:** רישום אירועים בעסקה (average, סגירה חלקית)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | מזהה אירוע (PK) |
| `trade_id` | UUID | עסקה משויכת (FK → trades) |
| `account_id` | UUID | חשבון (FK → accounts) |
| `event_type` | VARCHAR(255) | 'add_quantity' / 'partial_close' |
| `date_time` | TIMESTAMPTZ | תאריך האירוע |
| `quantity` | DECIMAL(15,2) | כמות שנוספה/נסגרה |
| `price` | DECIMAL(15,2) | מחיר |
| `notes` | TEXT | הערות |

**דוגמה:**
```sql
-- עסקה #1: קנייה של 100 מניות ב-$50
INSERT INTO trades (symbol, quantity, entry_price) VALUES ('AAPL', 100, 50);

-- אירוע #1: הוספת 50 מניות ב-$48 (average down)
INSERT INTO trade_events (trade_id, event_type, quantity, price) 
VALUES ('trade-1', 'add_quantity', 50, 48);

-- אירוע #2: סגירה חלקית של 75 מניות ב-$55
INSERT INTO trade_events (trade_id, event_type, quantity, price) 
VALUES ('trade-1', 'partial_close', 75, 55);
```

---

### 6. **`public.journal_entries`** (יומן מסחר)
**תפקיד:** רישום מחשבות ותובנות יומיות

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | מזהה ערך (PK) |
| `account_id` | UUID | חשבון (FK → accounts) |
| `date` | DATE | תאריך |
| `mood` | VARCHAR(50) | מצב רוח (excellent/good/okay/bad) |
| `tags` | TEXT[] | תגיות |
| `notes` | TEXT | תוכן היומן |

---

### 7. **`public.watchlist_notes`** (רשימת מעקב)
**תפקיד:** מעקב אחרי סימנים מעניינים

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | מזהה (PK) |
| `account_id` | UUID | חשבון (FK → accounts) |
| `symbol` | VARCHAR(255) | סימבול |
| `date` | DATE | תאריך הוספה |
| `target_price` | DECIMAL(15,2) | מחיר יעד |
| `current_price` | DECIMAL(15,2) | מחיר נוכחי |
| `notes` | TEXT | הערות |

---

### 8. **`public.learning_materials`** (חומרי למידה)
**תפקיד:** שמירת חומרי למידה

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | מזהה (PK) |
| `account_id` | UUID | חשבון (FK → accounts) |
| `title` | VARCHAR(255) | כותרת |
| `topic` | VARCHAR(255) | נושא |
| `url` | TEXT | קישור |
| `status` | VARCHAR(50) | pending/completed |
| `notes` | TEXT | הערות |

---

### 9. **`public.user_preferences`** (העדפות משתמש)
**תפקיד:** שמירת העדפות UI

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | מזהה (PK) |
| `user_id` | UUID | משתמש (FK → auth.users) |
| `language` | VARCHAR(10) | 'en' / 'he' |
| `theme` | VARCHAR(20) | 'light' / 'dark' |
| `timezone` | VARCHAR(50) | אזור זמן |

---

## 📊 Views (תצוגות)

### 1. **`active_trades_summary`**
```sql
SELECT * FROM trades WHERE status = 'Open'
```
- עסקאות פתוחות
- חישוב P&L נוכחי

### 2. **`closed_trades_summary`**
```sql
SELECT * FROM trades WHERE status = 'Closed'
```
- עסקאות סגורות
- רווח/הפסד סופי

### 3. **`account_summary`**
```sql
SELECT 
  account_id,
  COUNT(*) as total_trades,
  SUM(profit_loss) as total_pnl,
  AVG(profit_loss) as avg_pnl
FROM trades
GROUP BY account_id
```
- סיכום לכל חשבון

### 4. **`trade_performance_summary`**
```sql
SELECT 
  strategy,
  COUNT(*) as count,
  AVG(profit_loss) as avg_pnl,
  SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) / COUNT(*) as win_rate
FROM trades
GROUP BY strategy
```
- ביצועי אסטרטגיות

### 5. **`user_trade_stats`**
```sql
SELECT 
  user_id,
  COUNT(*) as total_trades,
  SUM(profit_loss) as total_pnl,
  AVG(profit_loss) as avg_pnl,
  SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) / COUNT(*) * 100 as win_rate
FROM trades
GROUP BY user_id
```
- סטטיסטיקות משתמש

---

## 🔐 Row Level Security (RLS)

### כללי אבטחה:

#### **profiles:**
```sql
-- משתמש רואה רק את הפרופיל שלו
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- משתמש מעדכן רק את הפרופיל שלו
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

#### **accounts:**
```sql
-- משתמש רואה רק את החשבונות שלו
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

-- משתמש יכול ליצור חשבונות
CREATE POLICY "Users can create accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### **trades:**
```sql
-- משתמש רואה רק עסקאות שלו
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

-- משתמש יכול ליצור עסקאות
CREATE POLICY "Users can create trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🎯 דוגמאות שימוש

### 1. **יצירת משתמש חדש:**
```sql
-- 1. Signup (דרך Supabase Auth)
-- → יוצר user ב-auth.users

-- 2. Trigger אוטומטי יוצר פרופיל
INSERT INTO profiles (user_id, full_name)
VALUES (new.id, 'John Doe');

-- 3. יצירת חשבון ראשון
INSERT INTO accounts (user_id, name, account_size)
VALUES (auth.uid(), 'My First Account', 10000);
```

### 2. **פתיחת עסקה:**
```sql
-- 1. פתיחת עסקה
INSERT INTO trades (
  account_id, 
  symbol, 
  direction, 
  entry_price, 
  quantity, 
  stop_price
) VALUES (
  'account-123',
  'AAPL',
  'Long',
  150.00,
  100,
  145.00
);
```

### 3. **הוספת כמות (Average):**
```sql
-- 1. יצירת אירוע
INSERT INTO trade_events (
  trade_id,
  event_type,
  quantity,
  price
) VALUES (
  'trade-456',
  'add_quantity',
  50,
  148.00
);

-- 2. עדכון העסקה
UPDATE trades
SET 
  total_quantity = quantity + 50,
  total_investment = (quantity * entry_price) + (50 * 148.00)
WHERE id = 'trade-456';
```

### 4. **סגירה חלקית:**
```sql
-- 1. יצירת אירוע
INSERT INTO trade_events (
  trade_id,
  event_type,
  quantity,
  price
) VALUES (
  'trade-456',
  'partial_close',
  75,
  155.00
);

-- 2. עדכון העסקה
UPDATE trades
SET 
  total_quantity = total_quantity - 75,
  is_partially_closed = TRUE,
  status = 'PartialClose'
WHERE id = 'trade-456';
```

### 5. **סגירה מלאה:**
```sql
UPDATE trades
SET 
  status = 'Closed',
  exit_price = 160.00,
  exit_date = NOW(),
  profit_loss = (exit_price - entry_price) * total_quantity - total_commission
WHERE id = 'trade-456';
```

---

## 🚀 Best Practices

### 1. **תמיד השתמש ב-account_id:**
```javascript
// ❌ לא טוב
const trades = await Trade.filter({ user_id: userId })

// ✅ טוב
const trades = await Trade.filter({ account_id: currentAccountId })
```

### 2. **בדוק אם account קיים:**
```javascript
const account = await Account.get(accountId)
if (!account) {
  console.warn('Account not found')
  localStorage.removeItem('currentAccountId')
  return
}
```

### 3. **תמיד עדכן updated_date:**
```sql
CREATE TRIGGER update_trades_updated_date
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 4. **השתמש ב-Views לקריאה:**
```javascript
// במקום:
const trades = await Trade.filter({ status: 'Open' })

// השתמש ב-View:
const activeTrades = await supabase.from('active_trades_summary').select('*')
```

---

## ✅ סיכום

### **המבנה במילים:**
1. **משתמש** (`auth.users`) נרשם → נוצר **פרופיל** (`profiles`)
2. **משתמש** יוצר **חשבונות מסחר** (`accounts`) - יכול כמה!
3. **חשבון** מכיל **עסקאות** (`trades`)
4. **עסקה** מכילה **אירועים** (`trade_events`)
5. **חשבון** מכיל **יומן**, **watchlist**, **חומרי למידה**

### **יתרונות המבנה:**
✅ הפרדה בין משתמש לחשבונות (multi-account support)
✅ RLS מגן על נתוני כל משתמש
✅ Triggers אוטומטיים (profile creation, updated_at)
✅ Views למהירות קריאה
✅ Foreign Keys שומרים על תקינות

---

**עכשיו יש לך הבנה מלאה של המבנה! 🎯**

