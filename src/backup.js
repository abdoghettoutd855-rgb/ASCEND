
const STORAGE_KEYS = [
  'ascend-daily-tasks',
  'ascend-daily-schedule',
  'ascend-stages',
  'ascend-rewards',
]

const DB_NAME = 'ascend-evidence-db'
const STORE_NAME = 'files'

function openEvidenceDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function dataURLToBlob(dataURL) {
  const comma = dataURL.indexOf(',')
  if (comma === -1) throw new Error('بيانات الملف غير صالحة.')

  const header = dataURL.slice(0, comma)
  const base64 = dataURL.slice(comma + 1)

  if (!header.includes(';base64')) {
    throw new Error('صيغة الملف غير مدعومة.')
  }

  const mime = header.match(/^data:(.*?);base64$/)?.[1] || ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new Blob([bytes], { type: mime })
}

export async function exportBackup() {
  const localStorageData = {}

  for (const key of STORAGE_KEYS) {
    localStorageData[key] = localStorage.getItem(key)
  }

  const database = await openEvidenceDB()

  try {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const records = await requestResult(
      transaction.objectStore(STORE_NAME).getAll(),
    )

    const evidence = await Promise.all(
      records.map(async (record) => {
        if (!(record.blob instanceof Blob)) {
          throw new Error(`ملف الدليل غير صالح: ${record.name || record.id}`)
        }

        return {
          id: record.id,
          name: record.name,
          type: record.type,
          size: record.size,
          savedAt: record.savedAt,
          blobData: await blobToDataURL(record.blob),
        }
      }),
    )

    const backup = {
      format: 'ASCEND_BACKUP',
      version: 1,
      createdAt: new Date().toISOString(),
      localStorage: localStorageData,
      evidence,
    }

    const file = new Blob(
      [JSON.stringify(backup)],
      { type: 'application/json' },
    )

    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `ASCEND-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`

    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    return {
      evidenceCount: evidence.length,
      createdAt: backup.createdAt,
    }
  } finally {
    database.close()
  }
}

export async function importBackup(file) {
  if (!file) throw new Error('اختر ملف النسخة الاحتياطية أولًا.')

  const backup = JSON.parse(await file.text())

  if (
    backup?.format !== 'ASCEND_BACKUP' ||
    backup?.version !== 1 ||
    !backup.localStorage ||
    !Array.isArray(backup.evidence)
  ) {
    throw new Error('ملف النسخة الاحتياطية غير صالح أو غير مدعوم.')
  }

  const data = backup. localStorage

  if (data['ascend-rewards'] === undefined) {
  data['ascend-rewards'] = '[]'
}

if (typeof data['ascend-rewards'] !== 'string') {
  throw new Error('بيانات المكافآت في النسخة الاحتياطية غير صالحة.')
}

const parsedRewards = JSON.parse(data['ascend-rewards'])

if (!Array.isArray(parsedRewards)) {
  throw new Error('يجب أن تكون بيانات المكافآت قائمة صالحة.')
}
  

  if (
    typeof data['ascend-daily-tasks'] !== 'string' ||
    typeof data['ascend-daily-schedule'] !== 'string' ||
    typeof data['ascend-stages'] !== 'string'
  ) {
    throw new Error('النسخة لا تحتوي على جميع بيانات ASCEND المطلوبة.')
  }

  const parsedTasks = JSON.parse(data['ascend-daily-tasks'])
  const parsedSchedule = JSON.parse(data['ascend-daily-schedule'])
  const parsedStages = JSON.parse(data['ascend-stages'])



  if (
    !Array.isArray(parsedTasks) ||
    !Array.isArray(parsedStages) ||
    !parsedSchedule ||
    typeof parsedSchedule !== 'object' ||
    Array.isArray(parsedSchedule)
  ) {
    throw new Error('بنية بيانات النسخة الاحتياطية غير صالحة.')
  }

  const records = backup.evidence.map((item) => {
    if (
      !item ||
      typeof item.id !== 'string' ||
      typeof item.blobData !== 'string'
    ) {
      throw new Error('تحتوي النسخة على ملف دليل غير صالح.')
    }

    const blob = dataURLToBlob(item.blobData)

    return {
      id: item.id,
      name: item.name || 'evidence',
      type: item.type || blob.type,
      size: item.size ?? blob.size,
      savedAt: item.savedAt || backup.createdAt,
      blob,
    }
  })

  if (new Set(records.map((item) => item.id)).size !== records.length) {
    throw new Error('النسخة تحتوي على معرّفات مكررة لملفات الأدلة.')
  }

  const database = await openEvidenceDB()

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      store.clear()
      records.forEach((record) => store.put(record))

      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(
        transaction.error || new Error('تعذّرت استعادة ملفات الأدلة.'),
      )
    })


    for (const key of STORAGE_KEYS) {
      const value = data[key]

      if (typeof value === 'string') {
        localStorage.setItem(key, value)
      } else {
        localStorage.removeItem(key)
      }
    }
  } finally {
    database.close()
  }

  return {
    taskCount: parsedTasks.length,
    stageCount: parsedStages.length,
    evidenceCount: records.length,
  }
}
