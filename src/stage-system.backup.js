
const STAGES_KEY = 'ascend-stages'
const TASKS_KEY = 'ascend-daily-tasks'
const EVIDENCE_DB = 'ascend-evidence-db'
const EVIDENCE_STORE = 'files'

function createId() {
  return crypto.randomUUID()
}

function createInitialStages() {
  let existingTasks = []

  try {
    const saved = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]')
    if (Array.isArray(saved)) existingTasks = saved
  } catch {
    existingTasks = []
  }

  const firstStage = {
    id: createId(),
    title: 'مرحلة التأسيس',
    description: 'أنجز المهام المطلوبة وأثبت تقدمك.',
    unlocked: true,
    completed: false,
    tasks: existingTasks
      .filter(
        (task) =>
          task &&
          typeof task.title === 'string' &&
          typeof task.completed === 'boolean',
      )
      .map((task) => ({
        id: typeof task.id === 'string' ? task.id : createId(),
        title: task.title,
        completed: task.completed,
      })),
    evidence: null,
  }

  return [
    firstStage,
    {
      id: createId(),
      title: 'المرحلة التالية',
      description: 'تُفتح بعد إكمال المرحلة السابقة والموافقة على دليلها.',
      unlocked: false,
      completed: false,
      tasks: [],
      evidence: null,
    },
  ]
}

export function getStages() {
  try {
    const saved = localStorage.getItem(STAGES_KEY)

    if (saved) {
      const stages = JSON.parse(saved)
      if (Array.isArray(stages) && stages.length > 0) return stages
    }
  } catch {
    // استعادة بيانات أولية إذا تعذّرت قراءة البيانات المحفوظة.
  }

  const stages = createInitialStages()
  saveStages(stages)
  return stages
}

export function saveStages(stages) {
  localStorage.setItem(STAGES_KEY, JSON.stringify(stages))
}

function openEvidenceDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(EVIDENCE_DB, 1)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(EVIDENCE_STORE)) {
        database.createObjectStore(EVIDENCE_STORE, {
          keyPath: 'id',
        })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveEvidenceFile(file) {
  const database = await openEvidenceDatabase()
  const id = createId()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(EVIDENCE_STORE, 'readwrite')
    const store = transaction.objectStore(EVIDENCE_STORE)

    store.add({
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file,
      savedAt: new Date().toISOString(),
    })

    transaction.oncomplete = () => {
      database.close()
      resolve({
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        savedAt: new Date().toISOString(),
        approved: false,
      })
    }

    transaction.onerror = () => {
      database.close()
      reject(transaction.error)
    }

    transaction.onabort = () => {
      database.close()
      reject(transaction.error || new Error('تعذّر حفظ الملف'))
    }
  })
}

export async function getEvidenceFile(id) {
  const database = await openEvidenceDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(EVIDENCE_STORE, 'readonly')
    const request = transaction.objectStore(EVIDENCE_STORE).get(id)

    request.onsuccess = () => {
      database.close()
      resolve(request.result || null)
    }

    request.onerror = () => {
      database.close()
      reject(request.error)
    }
  })
}

export function canCompleteStage(stage) {
  const allTasksCompleted =
    stage.tasks.length > 0 &&
    stage.tasks.every((task) => task.completed)

  return allTasksCompleted && stage.evidence?.approved === true
}

export function approveStageEvidence(stageId) {
  const stages = getStages()
  const index = stages.findIndex((stage) => stage.id === stageId)

  if (index === -1) {
    throw new Error('المرحلة غير موجودة.')
  }

  const stage = stages[index]

  if (!stage.unlocked) {
    throw new Error('هذه المرحلة لم تُفتح بعد.')
  }

  if (!stage.evidence) {
    throw new Error('أرفق دليل الإنجاز أولًا.')
  }

  if (!stage.tasks.length || !stage.tasks.every((task) => task.completed)) {
    throw new Error('أكمل جميع مهام المرحلة أولًا.')
  }

  stage.evidence.approved = true
  stage.completed = true

  if (index + 1 < stages.length) {
    stages[index + 1].unlocked = true
  }

  saveStages(stages)
  return stages
}
