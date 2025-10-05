# ✅ רשימת אימות - TradeSmart

## 📋 Checklist לפני שמעלים לפרודקשן

### שלב 1: קבצי התצורה (Configuration Files)

- [ ] **`.env` קיים** - ויש בו את המפתחות הנכונים
  ```env
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
  ```

- [ ] **`.gitignore` כולל `.env`** - כדי לא לשתף מפתחות
  ```
  .env
  .env.local
  ```

- [ ] **`package.json` עדכני** - כל התלויות מותקנות
  ```bash
  npm install
  ```

---

### שלב 2: Supabase Setup

- [ ] **פרויקט Supabase נוצר** - ב-supabase.com

- [ ] **SQL Schema הורץ** - קובץ `supabase-complete-setup.sql`
  - לך ל-SQL Editor ב-Supabase
  - העתק את כל התוכן
  - Run
  - בדוק שאין שגיאות

- [ ] **כל הטבלאות נוצרו** - בדוק ב-Table Editor:
  - ✅ accounts
  - ✅ trades
  - ✅ trade_events
  - ✅ journal_entries
  - ✅ watchlist_notes
  - ✅ learning_materials
  - ✅ user_preferences

- [ ] **כל ה-Functions נוצרו** - בדוק ב-Database > Functions:
  - ✅ update_updated_at_column
  - ✅ set_user_id_journal_entries
  - ✅ set_user_id_watchlist_notes
  - ✅ set_user_id_learning_materials
  - ✅ set_user_id_accounts
  - ✅ get_user_default_account

- [ ] **כל ה-Triggers נוצרו** - בדוק ב-Database > Triggers:
  - Updated_at triggers (7 טבלאות)
  - User_id triggers (4 טבלאות)

- [ ] **Storage Bucket קיים** - בדוק ב-Storage:
  - ✅ `trade-files` - Public bucket
  - ✅ Policies מוגדרות (4 policies)

- [ ] **RLS מופעל** - בדוק ב-Table Editor:
  - כל הטבלאות צריכות להראות "RLS enabled"
  - כל טבלה צריכה 4 policies (SELECT, INSERT, UPDATE, DELETE)

---

### שלב 3: בדיקת הקוד

- [ ] **אין שגיאות לינטר**
  ```bash
  npm run lint
  ```

- [ ] **הפרויקט מתקמפל**
  ```bash
  npm run build
  ```

- [ ] **הפרויקט רץ**
  ```bash
  npm run dev
  ```
  - פתח `http://localhost:5173`
  - אמור לראות את ה-Landing Page

---

### שלב 4: בדיקת Authentication

- [ ] **Landing Page נטען** - `http://localhost:5173`

- [ ] **דף הרשמה עובד** - `/signup`
  - מלא שם, אימייל, סיסמה
  - לחץ "Create Account"
  - אמור להיות redirect ל-Dashboard

- [ ] **דף התחברות עובד** - `/login`
  - הזן אימייל וסיסמה
  - לחץ "Sign In"
  - אמור להיות redirect ל-Dashboard

- [ ] **Logout עובד**
  - לחץ על "Logout" בפינה
  - אמור לחזור ל-Landing Page

- [ ] **Protected Routes עובדים**
  - התנתק
  - נסה להיכנס ל-`/dashboard` ישירות
  - אמור להיות redirect ל-`/login`

---

### שלב 5: בדיקת Accounts

- [ ] **יכול ליצור חשבון** - Settings > Create Account
  - מלא שם חשבון
  - הגדר גודל חשבון
  - לחץ "Create"
  - החשבון אמור להופיע בבאנר הירוק למעלה

- [ ] **user_id מתווסף אוטומטית**
  - לך ל-Supabase > Table Editor > accounts
  - בדוק את הרשומה
  - `user_id` אמור להיות מלא (UUID)

- [ ] **יכול לערוך חשבון**
  - Settings > בחר חשבון > Edit
  - שנה ערך
  - לחץ Save
  - הערך אמור להתעדכן

- [ ] **updated_at מתעדכן אוטומטית**
  - לאחר עריכה, בדוק ב-Supabase
  - `updated_at` אמור להיות עדכני

---

### שלב 6: בדיקת Trades

- [ ] **יכול ליצור עסקה** - Trades > New Trade
  - מלא את כל השדות
  - לחץ "Create Trade"
  - העסקה אמורה להופיע ב-Open Trades

- [ ] **חישובים אוטומטיים עובדים**
  - כניסה = 150, סטופ = 147, סיכון = 2%
  - הכמות אמורה להתחשב אוטומטית
  - גודל פוזיציה אמור להתחשב

- [ ] **אירוע נוצר אוטומטית**
  - View Trade > Events
  - אמור להיות אירוע "buy" ראשוני

- [ ] **העלאת צילום מסך**
  - בעת יצירת עסקה, העלה קובץ
  - אמור להיות URL ב-screenshot_url
  - בדוק ש-Storage > trade-files יש את הקובץ

- [ ] **סגירת עסקה**
  - Open Trade > Close
  - הזן מחיר סגירה
  - רווח/הפסד אמור להתחשב
  - העסקה עוברת ל-Closed Trades

- [ ] **סגירה חלקית**
  - Open Trade > Add/Reduce
  - מכור חלק מהכמות
  - `is_partially_closed` אמור להיות true

---

### שלב 7: בדיקת Journal

- [ ] **יכול ליצור רשומה** - Journal > New Entry
  - מלא כותרת ותוכן
  - בחר מצב רוח
  - לחץ Create
  - הרשומה אמורה להופיע

- [ ] **user_id מתווסף אוטומטית**
  - בדוק ב-Supabase > journal_entries
  - `user_id` אמור להיות מלא

- [ ] **העלאת תמונות**
  - הוסף צילום מסך
  - אמור להיות ב-`screenshot_urls` array

---

### שלב 8: בדיקת Watchlist

- [ ] **יכול להוסיף סימבול** - Watchlist > Add
  - הזן סימבול (AAPL)
  - הוסף הערות
  - הגדר מחיר יעד
  - לחץ Add
  - אמור להופיע ברשימה

- [ ] **יכול לעדכן סטטוס**
  - שנה מ-"watching" ל-"entered"
  - הסטטוס אמור להתעדכן

---

### שלב 9: בדיקת Learning Materials

- [ ] **יכול להוסיף חומר** - Learning > Add
  - הזן כותרת
  - בחר סוג (video/article/book)
  - הוסף URL
  - לחץ Add

- [ ] **יכול לעדכן סטטוס**
  - שנה מ-"to_learn" ל-"in_progress" ל-"completed"

- [ ] **יכול לדרג**
  - הוסף rating (0-5 כוכבים)

---

### שלב 10: בדיקת Multi-User (אבטחה)

- [ ] **יצירת משתמש שני**
  - Logout
  - Sign Up עם אימייל אחר
  - התחבר

- [ ] **משתמש 2 לא רואה נתונים של משתמש 1**
  - Dashboard צריך להיות ריק
  - אין חשבונות
  - אין עסקאות
  - אין יומן

- [ ] **משתמש 2 יוצר נתונים משלו**
  - צור חשבון
  - צור עסקה
  - בדוק שהכל עובד

- [ ] **חזרה למשתמש 1**
  - Logout
  - התחבר כמשתמש 1
  - כל הנתונים של משתמש 1 אמורים להיות שם
  - אין נתונים של משתמש 2

---

### שלב 11: בדיקת Reports

- [ ] **Reports נטען** - Reports page
  - אמור להראות סטטיסטיקות
  - Win rate
  - Total P&L
  - גרפים

- [ ] **סינון לפי תאריך**
  - בחר טווח תאריכים
  - רק עסקאות בטווח אמורות להופיע

- [ ] **ייצוא CSV** (אם יש)
  - לחץ Export
  - אמור להוריד קובץ CSV

---

### שלב 12: בדיקת Performance

- [ ] **דף נטען מהר** - כל דף צריך להיטען תוך שנייה

- [ ] **אין lag בהקלדה** - כשמקלידים בטפסים

- [ ] **תמונות נטענות** - Screenshots מ-Storage

- [ ] **Indexes עובדים**
  - בדוק ב-Supabase > Database > Indexes
  - כל ה-Indexes אמורים להיות שם

---

### שלב 13: בדיקת Responsive Design

- [ ] **Desktop (1920px)** - כל הדפים נראים טוב

- [ ] **Tablet (768px)** 
  - פתח DevTools
  - Toggle device toolbar
  - בחר iPad
  - בדוק שהכל נראה טוב

- [ ] **Mobile (375px)**
  - בחר iPhone
  - Menu המבורגר עובד
  - כל הטפסים עובדים
  - Modals עובדים

---

### שלב 14: בדיקת Languages

- [ ] **אנגלית (EN)** - לחץ ENG > כל הטקסטים באנגלית

- [ ] **עברית (HE)** - לחץ ע > כל הטקסטים בעברית + RTL

- [ ] **ספרדית (ES)** - לחץ ES > כל הטקסטים בספרדית

---

### שלב 15: בדיקות סופיות

- [ ] **אין Errors ב-Console**
  - פתח DevTools > Console
  - אמורים להיות 0 errors אדומים

- [ ] **אין Warnings חמורים**
  - Warnings צהובים זה OK
  - אבל לא אמורים להיות הרבה

- [ ] **Network Requests מצליחים**
  - DevTools > Network
  - כל הבקשות ל-Supabase אמורות 200 OK

- [ ] **Storage מתנקה**
  - אין קבצים זמניים
  - רק קבצים שהמשתמש העלה

---

## 🚀 אם עברת את כל הבדיקות - מוכן לפרודקשן!

### צעדים נוספים לפני Deploy:

1. **Environment Variables בפרודקשן**
   ```
   VITE_SUPABASE_URL=xxx
   VITE_SUPABASE_ANON_KEY=xxx
   ```

2. **Build לפרודקשן**
   ```bash
   npm run build
   ```

3. **Deploy ל-Vercel/Netlify**
   - Import repository
   - Set environment variables
   - Deploy!

4. **בדוק את ה-Live Site**
   - עבור על כל הבדיקות שוב באתר החי

---

## 📊 סיכום בדיקות

| קטגוריה | סה"כ בדיקות | ✅ הצלחה | ❌ נכשל |
|----------|-------------|----------|---------|
| Configuration | 3 | | |
| Supabase Setup | 6 | | |
| Code Quality | 3 | | |
| Authentication | 6 | | |
| Accounts | 4 | | |
| Trades | 7 | | |
| Journal | 3 | | |
| Watchlist | 2 | | |
| Learning | 3 | | |
| Multi-User | 4 | | |
| Reports | 3 | | |
| Performance | 4 | | |
| Responsive | 3 | | |
| Languages | 3 | | |
| Final | 3 | | |
| **סה"כ** | **57** | | |

---

## 🐛 בעיות נפוצות ופתרונות

### ✖ "Invalid API key"
**פתרון:** בדוק `.env`, הפעל מחדש `npm run dev`

### ✖ "User not authenticated"
**פתרון:** התנתק, התחבר מחדש, נקה LocalStorage

### ✖ "relation does not exist"
**פתרון:** הרץ את `supabase-complete-setup.sql` שוב

### ✖ "Cannot upload files"
**פתרון:** בדוק Storage bucket `trade-files` קיים ו-public

### ✖ "No account selected"
**פתרון:** צור חשבון ב-Settings

---

**עדכון אחרון:** אוקטובר 2025  
**גרסה:** 2.0.0  
**מבוצע על ידי:** _________________  
**תאריך:** ____ / ____ / ______

