# רשימת קניות משותפת 🛒

אפליקציית PWA לניהול קניות סופר משותף, בנויה עם React + Vite + Supabase.

## מה כלול ב-MVP

- מסך רשימה ראשי עם מערכת שני העיגולים (צריך לקנות / נקנה)
- מצב קנייה ייעודי לשימוש בסופר, עם סינון והזנת מחירים
- ניהול מוצרים (מאגר קבוע, קטגוריות, חיפוש)
- היסטוריית קניות עם פירוט מלא
- סנכרון בזמן אמת בין שני הטלפונים דרך Supabase Realtime
- PWA — ניתן להתקנה על מסך הבית

**לא כלול עדיין (מתוכנן להרחבה עתידית):** תמיכה מלאה ב-Offline, ניתוח הוצאות וגרפים.

---

## שלב 1: הקמת Supabase

1. היכנס ל-[supabase.com](https://supabase.com) וצור פרויקט חדש (חינמי).
2. בתפריט השמאלי: **SQL Editor** → **New query**.
3. העתק את כל תוכן הקובץ `supabase/schema.sql` והרץ (Run).
4. בתפריט: **Authentication → Users → Add user** — צור שני משתמשים (אחד לך, אחד לאשתך), עם מייל וסיסמה. שמור את ה-UUID של כל אחד (מופיע בטבלה).
5. חזור ל-**SQL Editor** והרץ (בהתאמה אישית לפי ההוראות בתחתית קובץ ה-schema):

```sql
insert into households (name) values ('משק הבית שלנו') returning id;
-- העתק את ה-id שהתקבל, ואז:
insert into users (id, household_id, name) values ('<uuid-משתמש-1>', '<household-id>', 'משה');
insert into users (id, household_id, name) values ('<uuid-משתמש-2>', '<household-id>', 'אשתי');
```

6. בתפריט **Project Settings → API**, העתק את **Project URL** ואת **anon public key** — תצטרך אותם בשלב הבא.

---

## שלב 2: הרצה מקומית

```bash
npm install
cp .env.example .env
# ערוך את .env והדבק את ה-URL וה-anon key מ-Supabase
npm run dev
```

האפליקציה תיפתח בכתובת שמוצגת בטרמינל (בדרך כלל `http://localhost:5173`).

---

## שלב 3: פריסה לאינטרנט (כדי שתוכלו להשתמש בזה משני הטלפונים)

**Vercel (מומלץ, חינמי):**

```bash
npm i -g vercel
vercel
```

בעת הפריסה, הוסף את משתני הסביבה `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` בהגדרות הפרויקט ב-Vercel (Project Settings → Environment Variables), ואז הרץ שוב `vercel --prod`.

לחלופין: חבר את הריפו ל-GitHub והעלה ל-[vercel.com](https://vercel.com) דרך הממשק הגרפי.

---

## שלב 4: התקנה על הטלפונים

1. פתחו את הכתובת שקיבלתם מ-Vercel בדפדפן בטלפון (Safari ב-iPhone, Chrome באנדרואיד).
2. תפריט השיתוף → **הוסף למסך הבית**.
3. התחברו עם המייל והסיסמה שיצרתם לכל אחד מכם.

כל שינוי שאחד מכם עושה יופיע אצל השני תוך שניות, בלי צורך לרענן.

---

## מבנה הפרויקט

```
src/
  App.jsx                 # ניהול auth, פרופיל, וניווט בין טאבים
  supabaseClient.js        # חיבור ל-Supabase
  hooks/useShoppingData.js # כל הלוגיקה: state, mutations, realtime
  components/
    Auth.jsx               # מסך התחברות
    Nav.jsx                # סרגל ניווט תחתון
    ShoppingList.jsx        # מסך "רשימה" הראשי
    ShoppingMode.jsx        # מסך "מצב קנייה"
    ProductManager.jsx      # מסך "מוצרים"
    History.jsx             # מסך "היסטוריה"
supabase/schema.sql         # כל סכמת מסד הנתונים + RLS + Realtime
```

## הערה על התנהגות "סיום קנייה"

כרגע: מוצרים שסומנו "נקנה" מוסרים מהרשימה הפעילה בסיום הקנייה. מוצרים שנשארו לא מסומנים **נשארים ברשימה** לקנייה הבאה (כדי שלא תצטרכו לחפש ולהוסיף אותם שוב אם לא הספקתם לקנות אותם השבוע). אם אתם מעדיפים איפוס מלא של הרשימה בכל סיום קנייה — זה שינוי קטן בפונקציה `completeSession` בקובץ `useShoppingData.js`.

## מה הלאה

לפי התכנון, בהמשך אפשר להוסיף: מסך ניתוח הוצאות (גרפים לפי קטגוריה/חודש), תמיכה מלאה ב-Offline עם IndexedDB queue, והוספת חברי משק בית נוספים.
