
const SCHEDULE_STORAGE_KEY = 'ascend-daily-schedule'

function makeId() {
  return crypto.randomUUID()
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getScheduleData() {
  try {
    const data = JSON.parse(
      localStorage.getItem(SCHEDULE_STORAGE_KEY) || '{}',
    )

    return data && typeof data === 'object' && !Array.isArray(data)
      ? data
      : {}
  } catch {
    return {}
  }
}

function saveScheduleData(data) {
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(data))
}

function timeToMinutes(time) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error('استخدم الوقت بصيغة 24 ساعة، مثل 08:30.')
  }

  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function getDailyTasks(date = getLocalDateKey()) {
  const data = getScheduleData()
  const tasks = Array.isArray(data[date]) ? data[date] : []

  return [...tasks].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
  )
}

export function addDailyTask({
  date = getLocalDateKey(),
  title,
  start,
  end,
}) {
  const cleanTitle = typeof title === 'string' ? title.trim() : ''

  if (!cleanTitle) {
    throw new Error('أدخل عنوان المهمة.')
  }

  if (cleanTitle.length > 120) {
    throw new Error('يجب ألا يتجاوز عنوان المهمة 120 حرفًا.')
  }

  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('التاريخ غير صالح.')
  }

  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)

  if (endMinutes <= startMinutes) {
    throw new Error('يجب أن يكون وقت النهاية بعد وقت البداية في اليوم نفسه.')
  }

  const data = getScheduleData()
  const tasks = Array.isArray(data[date]) ? data[date] : []

  const hasOverlap = tasks.some((task) => {
    if (task.completed) return false

    const existingStart = timeToMinutes(task.start)
    const existingEnd = timeToMinutes(task.end)

    return startMinutes < existingEnd && endMinutes > existingStart
  })

  if (hasOverlap) {
    throw new Error('هذا الوقت يتداخل مع مهمة أخرى غير مكتملة.')
  }

  const task = {
    id: makeId(),
    title: cleanTitle,
    start,
    end,
    completed: false,
    createdAt: new Date().toISOString(),
  }

  data[date] = [...tasks, task].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
  )

  saveScheduleData(data)

  return task
}

export function setDailyTaskCompleted(id, completed, date = getLocalDateKey()) {
  const data = getScheduleData()
  const tasks = Array.isArray(data[date]) ? data[date] : []
  const index = tasks.findIndex((task) => task.id === id)

  if (index === -1) {
    throw new Error('لم يتم العثور على المهمة.')
  }

  tasks[index] = {
    ...tasks[index],
    completed: Boolean(completed),
  }

  data[date] = tasks
  saveScheduleData(data)

  return tasks[index]
}

export function deleteDailyTask(id, date = getLocalDateKey()) {
  const data = getScheduleData()
  const tasks = Array.isArray(data[date]) ? data[date] : []
  const updatedTasks = tasks.filter((task) => task.id !== id)

  if (updatedTasks.length === tasks.length) {
    throw new Error('لم يتم العثور على المهمة.')
  }

  data[date] = updatedTasks
  saveScheduleData(data)
}
  
export function getDailyScheduleStats(date = getLocalDateKey()) {
  const tasks = getDailyTasks(date)

  const plannedMinutes = tasks.reduce(
    (total, task) =>
      total + timeToMinutes(task.end) - timeToMinutes(task.start),
    0,
  )

  const completedTasks = tasks.filter((task) => task.completed)

  const completedMinutes = completedTasks.reduce(
    (total, task) =>
      total + timeToMinutes(task.end) - timeToMinutes(task.start),
    0,
  )

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    plannedMinutes,
    completedMinutes,
    completionRate:
      tasks.length === 0
        ? 0
        : Math.round((completedTasks.length / tasks.length) * 100),
  }
}
export function getDailyCommitmentStats() {
  const data = getScheduleData()
  const today = getLocalDateKey()
  let completedDays = 0

  for (const [date, tasks] of Object.entries(data)) {
    if (date > today || !Array.isArray(tasks) || tasks.length === 0) {
      continue
    }

    if (tasks.every((task) => task.completed === true)) {
      completedDays++
    }
  }

  return completedDays
}
