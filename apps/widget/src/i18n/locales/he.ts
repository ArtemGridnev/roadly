import type { Messages } from './en'

export const he: Messages = {
  status: {
    BACKLOG: 'בקלוג',
    PLANNED: 'מתוכנן',
    IN_PROGRESS: 'בתהליך',
    SHIPPED: 'שוחרר',
  },
  panel: {
    feedback: 'משוב',
    open: 'פתיחת המשוב של Roadly',
    close: 'סגירת Roadly',
    back: 'חזרה',
  },
  tabs: {
    label: 'אזורי הווידג׳ט',
    requests: { label: 'בקשות', title: 'בקשות לפיצ׳רים' },
    mine: { label: 'הבקשות שלי', title: 'הבקשות שלי' },
  },
  list: {
    loadErrorTitle: 'לא הצלחנו לטעון את הבקשות',
    loadErrorDescription: 'החיבור ל-Roadly נכשל.',
    tryAgain: 'ניסיון נוסף',
    sortLabel: 'מיון הבקשות',
    sort: { top: 'הכי הרבה קולות', newest: 'החדשות ביותר' },
    emptyTitle: 'אין עדיין בקשות לפיצ׳רים',
    emptyDescription: 'היו הראשונים לספר לצוות מה לבנות בהמשך.',
    emptyMineTitle: 'עדיין לא שלחתם בקשות',
    emptyMineDescription: 'הבקשות שתשלחו יופיעו כאן עם הסטטוס שלהן.',
    upvote: (count) => (count === 1 ? 'הצבעה בעד, קול אחד' : `הצבעה בעד, ${count} קולות`),
  },
  detail: {
    title: 'בקשה',
    missingTitle: 'הבקשה הזו כבר לא זמינה',
    missingDescription: 'ייתכן שהצוות הסיר אותה.',
  },
  newRequest: {
    title: 'בקשה חדשה',
    sent: 'הבקשה נשלחה',
    titleLabel: 'כותרת',
    titlePlaceholder: 'לדוגמה: ייצוא דוחות ל-CSV',
    titleError: 'הוסיפו כותרת קצרה.',
    descriptionLabel: 'תיאור',
    descriptionPlaceholder: 'מה אתם מנסים לעשות, ומה מפריע לכם היום?',
    descriptionError: 'תארו מה אתם צריכים ולמה.',
    identifyFailed: 'לא הצלחנו לזהות את החשבון שלכם, ולכן אי אפשר לשלוח בקשות כרגע.',
    sendFailed: 'הבקשה לא נשלחה. בדקו את החיבור ונסו שוב.',
    submit: 'שליחת הבקשה',
    submitting: 'שולחים…',
  },
}
