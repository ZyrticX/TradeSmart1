# 🌐 הגדרת דומיין מותאם אישית - tradesmart.co.il

## תהליך חיבור הדומיין ל-Vercel

### שלב 1️⃣: Deploy האתר ל-Vercel תחילה

לפני שמגדירים את הדומיין, צריך להעלות את האתר ל-Vercel:

1. כנס ל-[Vercel.com](https://vercel.com)
2. התחבר עם חשבון GitHub
3. ייבא את **TradeSmart1** repository
4. הוסף משתני סביבה (VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY)
5. לחץ Deploy

תקבל URL זמני כמו: `https://tradesmart1-xyz.vercel.app`

---

### שלב 2️⃣: הוסף את הדומיין ב-Vercel

1. **היכנס לפרויקט ב-Vercel**
   - לחץ על הפרויקט **TradeSmart1**

2. **לך להגדרות הדומיין**
   - לחץ על **Settings** (למעלה בתפריט)
   - בחר **Domains** מהתפריט הצדדי

3. **הוסף דומיין**
   - הקלד: `tradesmart.co.il`
   - לחץ **Add**

4. **הוסף גם את www (אופציונלי אבל מומלץ)**
   - הקלד: `www.tradesmart.co.il`
   - לחץ **Add**

---

### שלב 3️⃣: הגדר DNS Records

לאחר הוספת הדומיין, Vercel יראה לך את ה-DNS records שצריך להגדיר.

#### אופציה A: שימוש ב-Nameservers (מומלץ - הכי פשוט)

אם Vercel מציע nameservers:

1. העתק את שני ה-nameservers שמוצגים (משהו כמו `ns1.vercel-dns.com` ו-`ns2.vercel-dns.com`)
2. היכנס לספק הדומיין שלך (למשל: GoDaddy, Namecheap, וכו')
3. שנה את ה-nameservers של הדומיין ל-nameservers של Vercel
4. **חשוב:** השינוי יכול לקחת עד 48 שעות (בדרך כלל 1-4 שעות)

#### אופציה B: שימוש ב-DNS Records ידני

אם אתה מעדיף לשמור על ה-nameservers הקיימים:

1. **ב-Vercel**, תראה את ההוראות להוספת:
   - `A Record` או `CNAME Record` עבור `tradesmart.co.il`
   - `CNAME Record` עבור `www.tradesmart.co.il`

2. **בספק הדומיין שלך**, הוסף את ה-records הבאים:

##### עבור Domain הראשי (tradesmart.co.il):
```
Type: A
Name: @ (או השאר ריק)
Value: 76.76.21.21
TTL: 3600
```

##### עבור WWW (www.tradesmart.co.il):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**⚠️ הערה:** הערכים המדויקים יוצגו לך ב-Vercel - השתמש בהם!

---

### שלב 4️⃣: המתן לאימות

1. **זמן המתנה:** 
   - DNS Records ידני: 5-30 דקות
   - Nameservers: 1-48 שעות (בדרך כלל 2-4 שעות)

2. **בדיקת סטטוס:**
   - ב-Vercel, בעמוד Domains, תראה את הסטטוס
   - כשהדומיין מוכן, תראה ✅ ליד השם

3. **SSL Certificate:**
   - Vercel יפיק אוטומטית SSL certificate (HTTPS) חינם
   - זה קורה אוטומטית אחרי שה-DNS מתעדכן

---

### שלב 5️⃣: הגדרות נוספות (אופציונלי)

#### הפניית www → domain ראשי
ב-Vercel, תחת Domains, אפשר להגדיר:
- `tradesmart.co.il` כדומיין ראשי
- `www.tradesmart.co.il` → redirect ל-`tradesmart.co.il`

או להיפך, תלוי מה שאתה מעדיף.

#### Redirect HTTP → HTTPS
Vercel עושה את זה אוטומטית ✅

---

## 📋 סיכום מהיר

```
1. Deploy ל-Vercel
2. ב-Vercel: Settings → Domains → Add "tradesmart.co.il"
3. בספק הדומיין: הוסף DNS records או שנה nameservers
4. המתן 5 דקות - 48 שעות
5. האתר יהיה זמין ב-tradesmart.co.il! 🎉
```

---

## 🔍 בדיקת DNS

כדי לבדוק אם ה-DNS התעדכן:

### בטרמינל (PowerShell):
```powershell
nslookup tradesmart.co.il
```

או:
```powershell
Resolve-DnsName tradesmart.co.il
```

### באתרים אונליין:
- https://dnschecker.org
- https://www.whatsmydns.net

---

## ❓ בעיות נפוצות

### הדומיין לא עובד אחרי שעות
**פתרון:** 
1. בדוק ש-DNS records נכנסו נכון בספק הדומיין
2. המתן עוד - לפעמים זה לוקח זמן
3. נקה cache של הדפדפן (Ctrl + Shift + Delete)

### שגיאת SSL/Certificate
**פתרון:**
1. המתן - Vercel מפיק certificate אוטומטית
2. ודא שה-DNS מצביע נכון
3. לפעמים צריך להסיר ולהוסיף מחדש את הדומיין

### "Invalid Configuration" ב-Vercel
**פתרון:**
1. ודא שה-DNS records נכונים
2. נסה להסיר ולהוסיף מחדש את הדומיין
3. בדוק שאין conflicts עם דומיינים אחרים

---

## 📞 ספקי דומיין נפוצים - הוראות ספציפיות

### GoDaddy
1. DNS Management → Add Record
2. Type: A, Name: @, Value: [Vercel IP]

### Namecheap
1. Advanced DNS → Add New Record
2. Type: A Record, Host: @, Value: [Vercel IP]

### Cloudflare
1. DNS → Add record
2. Type: A, Name: @, Content: [Vercel IP]
3. ⚠️ הפוך את הענן לאפור (Proxy status: DNS only)

---

## 🎉 סיימת!

אחרי ההגדרה, האתר שלך יהיה זמין ב:
- ✅ https://tradesmart.co.il
- ✅ https://www.tradesmart.co.il
- 🔒 עם SSL (HTTPS) אוטומטי

**בהצלחה! 🚀**

