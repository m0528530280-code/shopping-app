// כלי חד-פעמי: קובע סיסמה חדשה למשתמש ישירות דרך Supabase, בלי מייל ובלי הגבלת קצב.
// הרצה: node scripts/reset-password.mjs <SERVICE_ROLE_KEY> <EMAIL> <NEW_PASSWORD>
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hfafwqfrqibhnkvkpgnj.supabase.co'

const [serviceKey, email, newPassword] = process.argv.slice(2)

if (!serviceKey || !email || !newPassword) {
  console.error('שימוש: node scripts/reset-password.mjs <SERVICE_ROLE_KEY> <EMAIL> <NEW_PASSWORD>')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, serviceKey)

const { data, error: listError } = await admin.auth.admin.listUsers()
if (listError) {
  console.error('שגיאה בטעינת משתמשים:', listError.message)
  process.exit(1)
}

const user = data.users.find((u) => u.email === email)
if (!user) {
  console.error('לא נמצא משתמש עם המייל הזה')
  process.exit(1)
}

const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password: newPassword })
if (updateError) {
  console.error('שגיאה בעדכון הסיסמה:', updateError.message)
  process.exit(1)
}

console.log('הסיסמה עודכנה בהצלחה עבור', email)
