# 📦 מדריך הגדרת Storage ב-Supabase

## ⚠️ חשוב!

ה-Storage Bucket **לא יכול** להיות created דרך SQL Editor.  
צריך ליצור אותו דרך ה-UI של Supabase.

---

## 🎯 שלבים ליצירת Storage Bucket

### שלב 1: פתח את Storage
1. לך ל-Supabase Dashboard
2. בתפריט הצדדי, לחץ על **Storage**

### שלב 2: צור Bucket חדש
1. לחץ על **"Create a new bucket"** (כפתור ירוק)
2. מלא את הפרטים:
   - **Name:** `trade-files`
   - **Public bucket:** ✅ (סמן!)
   - **File size limit:** השאר ריק (ברירת מחדל)
   - **Allowed MIME types:** השאר ריק (הכל מותר)
3. לחץ **"Create bucket"**

### שלב 3: הגדר Policies (אופציונלי)

אם הבחרת ב-"Public bucket", הכל כבר עובד! ✅

אבל אם אתה רוצה שליטה יותר מדויקת, הוסף policies:

1. לחץ על ה-bucket `trade-files`
2. לך לטאב **Policies**
3. לחץ **"New Policy"**

#### Policy 1: Upload Files
```
Name: Users can upload files
Allowed operation: INSERT
Target roles: authenticated
Policy definition:
  bucket_id = 'trade-files' AND auth.uid() IS NOT NULL
```

#### Policy 2: View Files
```
Name: Anyone can view files
Allowed operation: SELECT
Target roles: authenticated, anon
Policy definition:
  bucket_id = 'trade-files'
```

#### Policy 3: Update Files
```
Name: Users can update their files
Allowed operation: UPDATE
Target roles: authenticated
Policy definition:
  bucket_id = 'trade-files' AND auth.uid() IS NOT NULL
```

#### Policy 4: Delete Files
```
Name: Users can delete their files
Allowed operation: DELETE
Target roles: authenticated
Policy definition:
  bucket_id = 'trade-files' AND auth.uid() IS NOT NULL
```

---

## ✅ אימות שהכל עובד

### בדיקה 1: Bucket קיים
1. Storage > Buckets
2. אתה אמור לראות: `trade-files` (Public)

### בדיקה 2: העלאת קובץ
1. לחץ על ה-bucket
2. לחץ "Upload file"
3. בחר תמונה
4. העלה
5. אמור להצליח! ✅

### בדיקה 3: URL פועל
1. לחץ על הקובץ שהעלית
2. לחץ "Get URL"
3. העתק את ה-URL
4. פתח בטאב חדש
5. אמור לראות את התמונה! ✅

---

## 🔧 פתרון בעיות

### ❌ "Policy violation" בעת העלאה

**סיבה:** ה-bucket לא Public או אין policies

**פתרון:**
1. Storage > trade-files > Configuration
2. ודא ש-"Public" מסומן
3. או הוסף policies (ראה למעלה)

### ❌ "Bucket not found"

**סיבה:** לא יצרת את ה-bucket

**פתרון:**
1. חזור לשלב 1
2. צור את ה-bucket

### ❌ קבצים לא נטענים באפליקציה

**סיבה:** URL לא נכון

**פתרון:**
```javascript
// בדוק ב-integrations.js:
const { data: { publicUrl } } = supabase.storage
  .from('trade-files')
  .getPublicUrl(filePath);

console.log('Public URL:', publicUrl); // בדוק שזה נראה נכון
```

---

## 📝 קוד לדוגמה

### העלאת קובץ
```javascript
import { UploadFile } from '@/api/integrations';

const handleFileUpload = async (file) => {
  try {
    const { file_url } = await UploadFile({ file });
    console.log('File uploaded:', file_url);
    // שמור את file_url ב-database
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### קבלת URL של קובץ
```javascript
import { supabase } from '@/api/supabaseClient';

const getFileUrl = (filePath) => {
  const { data } = supabase.storage
    .from('trade-files')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};
```

---

## 🎯 למה Public Bucket?

**יתרונות:**
- ✅ פשוט להגדיר
- ✅ לא צריך signed URLs
- ✅ תמונות נטענות מהר
- ✅ אפשר להציג ישירות ב-<img> tags

**חסרונות:**
- ❌ כל מי שיש לו URL יכול לראות
- ❌ לא מתאים לקבצים רגישים

**האם זה בסדר לפרויקט שלך?**

כן! ✅ כי:
- Screenshots של גרפים = לא רגיש
- מישהו שרוצה לראות את התמונות שלך צריך לדעת את ה-URL המדויק
- אפשר תמיד לעבור ל-Private bucket אחר כך

---

## 🔄 מעבר ל-Private Bucket (עתידי)

אם בעתיד תרצה bucket פרטי:

1. צור bucket חדש: `trade-files-private`
2. **אל תסמן** "Public"
3. השתמש ב-signed URLs:

```javascript
import { CreateFileSignedUrl } from '@/api/integrations';

const url = await CreateFileSignedUrl({ 
  path: 'uploads/image.jpg',
  expiresIn: 3600 // 1 hour
});
```

---

## ✅ Checklist

- [ ] יצרתי bucket בשם `trade-files`
- [ ] סימנתי "Public bucket"
- [ ] הבucket מופיע ב-Storage
- [ ] העליתי קובץ בדיקה
- [ ] ה-URL עובד בדפדפן
- [ ] הקוד באפליקציה עובד

---

**אחרי שתסיים את כל השלבים, חזור ל-START_HERE.md להמשך!** 🚀

