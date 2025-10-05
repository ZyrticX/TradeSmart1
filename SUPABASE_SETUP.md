# מדריך התקנה והגדרת TradeSmart עם Supabase

## שלב 1: יצירת פרויקט Supabase

1. גש ל-[Supabase](https://supabase.com) והתחבר/הירשם
2. לחץ על "New Project"
3. בחר ארגון (או צור חדש)
4. הזן את פרטי הפרויקט:
   - **שם הפרויקט**: TradeSmart
   - **סיסמת מסד נתונים**: שמור סיסמה חזקה (תזדקק לה לאחר מכן)
   - **אזור**: בחר את האזור הקרוב ביותר אליך
5. לחץ על "Create new project"

## שלב 2: הגדרת מסד הנתונים

1. לאחר שהפרויקט נוצר, לך לטאב **SQL Editor** בתפריט הצדדי
2. לחץ על "+ New query"
3. העתק את כל התוכן של הקובץ `supabase-complete-setup.sql`
4. הדבק אותו בעורך SQL
5. לחץ על "Run" או לחץ `Ctrl + Enter`
6. ודא שהשאילתה הצליחה (אתה אמור לראות "Success" עם הודעות NOTICE)

⚠️ **הערה:** אם קיבלת שגיאה על Storage (ERROR: 42501: must be owner of table buckets) - **זה תקין!** 
התעלם מזה והמשך לשלב 3. כל הטבלאות נוצרו בהצלחה.

## שלב 3: הגדרת Storage (ידני - חובה!)

⚠️ **חשוב:** Storage Bucket **חייב** להיווצר ידנית דרך ה-UI!

1. לך לטאב **Storage** בתפריט הצדדי
2. לחץ על **"Create a new bucket"**
3. מלא את הפרטים:
   - **Name:** `trade-files`
   - **Public bucket:** ✓ (סמן!)
   - השאר את שאר השדות ריקים
4. לחץ **"Create bucket"**
5. ודא שה-bucket `trade-files` מופיע ברשימה

📖 **למדריך מפורט:** `STORAGE_SETUP_GUIDE.md`

## שלב 4: קבלת API Keys

1. לך לטאב **Settings** > **API**
2. העתק את הערכים הבאים:
   - **Project URL** - זה ה-`VITE_SUPABASE_URL` שלך
   - **anon public** key - זה ה-`VITE_SUPABASE_ANON_KEY` שלך

## שלב 5: הגדרת משתני הסביבה

1. צור קובץ `.env` בשורש הפרויקט (אותה תיקייה של `package.json`)
2. הוסף את השורות הבאות:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. החלף את `your_supabase_project_url_here` ו-`your_supabase_anon_key_here` בערכים שהעתקת בשלב 4
4. **חשוב**: ודא שהקובץ `.env` נמצא ב-`.gitignore` כדי לא לשתף מפתחות API

## שלב 6: התקנת התלויות והרצת הפרויקט

```bash
# התקן את כל התלויות
npm install

# הרץ את הפרויקט במצב פיתוח
npm run dev
```

## שלב 7: יצירת משתמש ראשון

1. פתח את האפליקציה בדפדפן (בדרך כלל `http://localhost:5173`)
2. אם יש דף הרשמה, השתמש בו
3. אם אין, אתה יכול ליצור משתמש ישירות ב-Supabase:
   - לך לטאב **Authentication** > **Users**
   - לחץ על "Add user" > "Create new user"
   - הזן email וסיסמה
   - לחץ "Create user"

## שלב 8: יצירת חשבון ראשון (Account)

לאחר ההתחברות, תצטרך ליצור חשבון מסחר:

1. לך להגדרות (Settings)
2. צור חשבון חדש עם הפרטים שלך
3. הגדר:
   - שם החשבון
   - גודל החשבון
   - אחוז סיכון ברירת מחדל
   - אסטרטגיות מסחר
   - עמלות

## מבנה הטבלאות שנוצרו

הסכמה יצרה את הטבלאות הבאות:

- **accounts** - חשבונות המסחר שלך
- **trades** - כל העסקאות
- **trade_events** - אירועים בעסקאות (קניה, מכירה, הוספת כמות וכו')
- **journal_entries** - רשומות יומן
- **watchlist_notes** - רשימת מעקב
- **learning_materials** - חומרי למידה
- **user_preferences** - העדפות משתמש

## Row Level Security (RLS)

הסכמה כוללת מדיניות RLS שמבטיחה שכל משתמש יכול לראות רק את הנתונים שלו.

## פתרון בעיות נפוצות

### שגיאת "Invalid API key"
- ודא שהעתקת את המפתחות הנכונים מ-Settings > API
- ודא שהקובץ `.env` נמצא בשורש הפרויקט
- הפעל מחדש את שרת הפיתוח (`npm run dev`)

### שגיאת "relation does not exist"
- ודא שהרצת את ה-SQL schema המלא
- בדוק ב-Table Editor שכל הטבלאות נוצרו

### לא יכול להעלות קבצים
- ודא שה-bucket `trade-files` קיים ומוגדר כ-public
- בדוק שמדיניות ה-Storage נוצרה נכון

### שגיאת "JWT expired" או "Invalid JWT"
- זה קורה אם ה-session פג תוקף
- פשוט התחבר מחדש

## שדרוג לעתיד

### הוספת Authentication UI
אם אתה רוצה להוסיף דפי התחברות/הרשמה:

```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

### הוספת Realtime Updates
Supabase תומך ב-realtime - אפשר להאזין לשינויים בטבלאות בזמן אמת:

```javascript
const channel = supabase
  .channel('trades-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'trades' },
    (payload) => console.log('Trade changed:', payload)
  )
  .subscribe()
```

## תמיכה

לשאלות נוספות, עיין ב[תיעוד Supabase](https://supabase.com/docs)

