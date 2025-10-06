# 🔧 תיקון מהיר - הוספת עמודת currency

## ⚠️ הבעיה שזוהתה:

השגיאה: `Could not find the 'currency' column of 'accounts' in the schema cache`

זה אומר שטבלת `accounts` ב-Supabase חסרה את עמודת `currency`.

---

## ✅ פתרון (2 דקות):

### שלב 1️⃣: כנס ל-Supabase SQL Editor

1. פתח: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לחץ על **SQL Editor** בתפריט הצדדי
4. לחץ על **+ New query**

---

### שלב 2️⃣: הרץ את הסקריפט הבא:

העתק והדבק את הקוד הזה:

```sql
-- Add missing 'currency' column to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add comment
COMMENT ON COLUMN accounts.currency IS 'Account currency (USD, EUR, ILS, etc.)';
```

לחץ **Run** (או Ctrl+Enter)

---

### שלב 3️⃣: בדוק שזה עבד

הרץ את הקוד הזה:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'accounts'
ORDER BY ordinal_position;
```

אתה אמור לראות את `currency` ברשימת העמודות.

---

## 🚀 שלב 4️⃣: Vercel יעשה Redeploy אוטומטי

הקוד כבר הועלה ל-GitHub עם התיקונים הבאים:

✅ הוספת פונקציית `list()` ל-supabaseClient  
✅ עדכון ה-schema SQL עם עמודת `currency`  
✅ תיקון הקוד כדי שיתמוך ב-Supabase

Vercel אמור לעשות deploy אוטומטי תוך כ-2 דקות.

---

## 🔍 בדיקה:

1. המתן ל-deploy להסתיים ב-Vercel
2. רענן את https://tradesmart.co.il
3. נסה להתחבר ולהוסיף account חדש
4. זה אמור לעבוד! 🎉

---

## ❓ אם עדיין יש בעיות:

1. **נקה cache של הדפדפן:**
   - Chrome/Edge: Ctrl + Shift + Delete
   - בחר "Cached images and files"
   - לחץ "Clear data"

2. **בדוק ש-Environment Variables מוגדרים ב-Vercel:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **בדוק לוגים ב-Vercel:**
   - Vercel Dashboard → Project → Deployments
   - לחץ על ה-deployment האחרון
   - בדוק את הלוגים אם יש שגיאות

---

**הצלחה! 🚀**

