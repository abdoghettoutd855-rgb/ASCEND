const SETTINGS_KEY = 'ascend-notification-settings'
const SENT_KEY = 'ascend-sent-notifications'

const DEFAULT_SETTINGS = {
  enabled: false,
  minutesBefore: 10,
}

let reminderTimer = null

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

export function getNotificationSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...readJSON(SETTINGS_KEY, {}),
  }
}

export function saveNotificationSettings(settings) {
  const next = {
    ...getNotificationSettings(),
    ...settings,
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  startTaskReminders()
  return next
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('هذا المتصفح لا يدعم إشعارات النظام.')
  }

  if (Notification.permission === 'granted') return true

  if (Notification.permission === 'denied') {
    throw new Error('الإشعارات محظورة من المتصفح. اسمح بها من إعدادات الموقع.')
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error('لم تمنح إذن إرسال الإشعارات.')
  }

  return true
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function timeToDate(dateKey, time) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)

  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function getSentNotifications() {
  return readJSON(SENT_KEY, {})
}

function markAsSent(id) {
  const sent = getSentNotifications()
  sent[id] = Date.now()

  // احتفظ بآخر 300 سجل لتجنب نمو التخزين بلا حدود.
  const entries = Object.entries(sent)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300)

  localStorage.setItem(SENT_KEY, JSON.stringify(Object.fromEntries(entries)))
}

function notify(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false
  }

  try {
    new Notification(title, {
      body,
      tag,
      icon: '/favicon.svg',
    })
    return true
  } catch {
    return false
  }
}

export function sendTestNotification() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    throw new Error('اسمح بالإشعارات أولًا.')
  }

  const sent = notify(
    'ASCEND',
    'الإشعارات تعمل بنجاح. استمر في التقدم!',
    'ascend-test',
  )

  if (!sent) {
    throw new Error('تعذر عرض الإشعار في هذا المتصفح.')
  }
}

export function startTaskReminders() {
  if (reminderTimer) {
    clearInterval(reminderTimer)
    reminderTimer = null
  }

  const settings = getNotificationSettings()

  if (!settings.enabled) return

  function checkReminders() {
    const currentSettings = getNotificationSettings()

    if (!currentSettings.enabled) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const now = new Date()
    const today = localDateKey()

    let tasks = []

    try {
      const stored = JSON.parse(
        localStorage.getItem('ascend-daily-schedule') || '{}',
      )
      tasks = Array.isArray(stored[today]) ? stored[today] : []
    } catch {
      return
    }

    for (const task of tasks) {
      if (!task || task.completed || !task.id || !task.start) continue

      const start = timeToDate(today, task.start)
      const reminderTime = new Date(
        start.getTime() - Number(currentSettings.minutesBefore || 0) * 60000,
      )

      const id = `${today}:${task.id}:${currentSettings.minutesBefore}`
      const sent = getSentNotifications()

      if (sent[id]) continue

      // لا تعرض تنبيهًا قديمًا إذا فُتح التطبيق بعد موعده.
      const elapsed = now.getTime() - reminderTime.getTime()

      if (elapsed < 0 || elapsed > 60000) continue

      const delivered = notify(
        'موعد مهم قادم',
        `${task.title} — تبدأ الساعة ${task.start}`,
        id,
      )

      if (delivered) markAsSent(id)
    }
  }

  checkReminders()
  reminderTimer = setInterval(checkReminders, 15000)
}

export function stopTaskReminders() {
  if (reminderTimer) {
    clearInterval(reminderTimer)
    reminderTimer = null
  }
}
