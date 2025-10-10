# 📊 TradeSmart - Trading Journal & Analytics Platform

TradeSmart היא פלטפורמה מקיפה לניהול עסקאות מסחר, מעקב אחר ביצועים, וניתוח נתונים. הפרויקט עבר ל-**Supabase** כמסד נתונים עצמאי.

## ✨ תכונות עיקריות

- 🔐 **מערכת התחברות מאובטחת** - אימות משתמשים עם Supabase Auth
- 🎨 **עמוד נחיתה מקצועי** - Landing page מרשים עם תמחור
- 📈 **ניהול עסקאות** - מעקב מלא אחר עסקאות פתוחות וסגורות
- 📊 **ניתוח ביצועים** - דשבורד עם גרפים ומדדי ביצועים
- 📝 **יומן מסחר** - תיעוד מחשבות, לקחים ומצב רוח
- 👁️ **רשימת מעקב** - מעקב אחר סימבולים מעניינים
- 📚 **חומרי למידה** - ארגון משאבי למידה
- 🌍 **תמיכה רב-לשונית** - עברית ואנגלית
- 🔐 **אבטחה מלאה** - Row Level Security (RLS) ב-Supabase
- 👥 **מרובה משתמשים** - כל משתמש רואה רק את הנתונים שלו
- 💳 **מוכן לתשלומים** - תשתית מוכנה לאינטגרציה עם Stripe/PayPal

## 🚀 Deploy מהיר ל-Production

**רוצה להעלות את האתר ל-GitHub ו-Vercel?**  
📖 עקוב אחרי המדריך המפורט: **[GITHUB_VERCEL_DEPLOYMENT.md](./GITHUB_VERCEL_DEPLOYMENT.md)**

**סיכום מהיר:**
1. צור repository ב-GitHub
2. הרץ: `git remote add origin <your-github-url>`
3. הרץ: `git push -u origin main`
4. ייבא את הפרויקט ל-Vercel
5. הוסף משתני סביבה של Supabase
6. Deploy! 🎉

---

## 🏃 התחלה מהירה (פיתוח מקומי)

### דרישות מקדימות

- Node.js 16+ 
- חשבון Supabase (חינמי)

### 1. שיבוט הפרויקט

```bash
git clone <repository-url>
cd TradeSmart
```

### 2. התקנת תלויות

```bash
npm install
```

### 3. הגדרת Supabase

עקוב אחרי ההוראות המפורטות בקובץ **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

בקצרה:
1. צור פרויקט ב-[Supabase](https://supabase.com)
2. הרץ את ה-SQL מהקובץ `supabase-complete-setup.sql`
3. יצור Storage Bucket בשם `trade-files` (ראה `STORAGE_SETUP_GUIDE.md`)
4. צור קובץ `.env` עם המפתחות:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. הרצת הפרויקט

```bash
npm run dev
```

הפרויקט יהיה זמין ב-`http://localhost:5173`

### 5. יצירת משתמש ראשון

1. גש ל-`http://localhost:5173`
2. תראה את עמוד הנחיתה (Landing Page)
3. לחץ על "Get Started" או "Sign Up"
4. הירשם עם אימייל וסיסמה
5. תועבר אוטומטית ל-Dashboard

**חשוב**: משתמש ראשון צריך ליצור חשבון (Account) בהגדרות לפני התחלת מסחר!

## 📁 מבנה הפרויקט

```
TradeSmart/
├── src/
│   ├── api/
│   │   ├── supabaseClient.js    # חיבור ל-Supabase + פונקציות CRUD
│   │   ├── entities.js          # ישויות (Tables)
│   │   └── integrations.js      # העלאת קבצים ואינטגרציות
│   ├── components/
│   │   ├── dashboard/           # קומפוננטות דשבורד
│   │   ├── trades/              # ניהול עסקאות
│   │   ├── journal/             # יומן מסחר
│   │   ├── watchlist/           # רשימת מעקב
│   │   ├── learning/            # חומרי למידה
│   │   ├── ProtectedRoute.jsx   # הגנה על routes
│   │   └── ui/                  # קומפוננטות UI (shadcn/ui)
│   ├── contexts/
│   │   └── AuthContext.jsx      # ניהול authentication
│   ├── pages/
│   │   ├── LandingPage.jsx      # עמוד נחיתה
│   │   ├── Login.jsx            # התחברות
│   │   ├── Signup.jsx           # הרשמה
│   │   ├── Dashboard.jsx        # דשבורד ראשי
│   │   ├── Trades.jsx           # עסקאות
│   │   ├── Journal.jsx          # יומן
│   │   ├── Settings.jsx         # הגדרות
│   │   └── ...                  # דפים נוספים
│   └── utils/                   # פונקציות עזר
├── supabase-complete-setup.sql  # סכמת מסד הנתונים המלאה
├── STORAGE_SETUP_GUIDE.md      # הדרכה ליצירת Storage
├── START_HERE.md               # התחלה מהירה (המלץ!)
├── SUPABASE_SETUP.md           # מדריך הגדרה מפורט
└── package.json
```

## 🗄️ מבנה מסד הנתונים

### טבלאות עיקריות:

- **accounts** - חשבונות מסחר
- **trades** - עסקאות
- **trade_events** - אירועי עסקאות (קנייה, מכירה, וכו')
- **journal_entries** - רשומות יומן
- **watchlist_notes** - רשימת מעקב
- **learning_materials** - חומרי למידה
- **user_preferences** - העדפות משתמש

כל הטבלאות מוגנות ב-**Row Level Security (RLS)** - כל משתמש רואה רק את הנתונים שלו.

## 🔧 טכנולוגיות

- **React** - ממשק המשתמש
- **Vite** - כלי בנייה
- **Supabase** - מסד נתונים, אימות ואחסון
- **Tailwind CSS** - עיצוב
- **shadcn/ui** - קומפוננטות UI
- **Recharts** - גרפים וויזואליזציות
- **React Router** - ניווט

## 📜 סקריפטים זמינים

```bash
npm run dev      # הרצת שרת פיתוח
npm run build    # בנייה לפרודקשן
npm run preview  # תצוגה מקדימה של הבנייה
npm run lint     # בדיקת קוד
```

## 🔐 אבטחה

- **Row Level Security (RLS)** - כל משתמש ניגש רק לנתונים שלו
- **JWT Authentication** - אימות מאובטח דרך Supabase
- **Secure File Storage** - קבצים מאוחסנים ב-Supabase Storage
- **Environment Variables** - מפתחות API מאוחסנים ב-`.env` (לא ב-git)

## 🌐 תמיכה רב-לשונית

האפליקציה תומכת ב:
- 🇺🇸 English
- 🇮🇱 עברית (RTL)
- 🇪🇸 Español

ניתן להחליף שפה דרך ההגדרות.

## 📱 Responsive Design

האפליקציה מותאמת לכל הגדלים:
- 💻 Desktop
- 📱 Mobile
- 📱 Tablet

## 🔄 Backend & Database

הפרויקט משתמש ב-Supabase כ-backend מלא:

1. **API Client**: `supabaseClient.js` - חיבור ישיר לSupabase
2. **Entities**: שימוש ב-`createEntity()` לניהול טבלאות
3. **Authentication**: Supabase Auth עם AuthContext מלא
4. **File Upload**: Supabase Storage לקבצים ותמונות
5. **Multi-User**: Row Level Security מבטיח הפרדת נתונים

### מה חדש?
- ✅ עמוד נחיתה (Landing Page) מקצועי
- ✅ מערכת התחברות והרשמה
- ✅ Protected Routes - הגנה על דפים
- ✅ Auth Context - ניהול session
- ✅ Logout - התנתקות מאובטחת
- ✅ מוכן למרובה משתמשים

כל ה-API נשאר תואם לאחור - קומפוננטות קיימות עובדות ללא שינוי!

## 🤝 תרומה

תרומות מתקבלות בברכה! פתח issue או שלח pull request.

## 📄 רישיון

MIT License

## 💬 תמיכה

לשאלות או בעיות:
- פתח issue ב-GitHub
- עיין במדריך [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- בדוק את [תיעוד Supabase](https://supabase.com/docs)

---

**Built with ❤️ by traders, for traders**
