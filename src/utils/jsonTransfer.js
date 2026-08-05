// 负责浏览器端 JSON 文件下载与上传解析，不处理具体业务字段校验。
const EXPORT_FILE_LABELS = { cards: '信用卡档案', transactions: '交易流水' }

export function buildExportFilename(type, date = new Intl.DateTimeFormat('en-CA').format(new Date())) {
  return `${EXPORT_FILE_LABELS[type] || '账本数据'}-${date}.json`
}

export function downloadJson(type, data) {
  const date = new Intl.DateTimeFormat('en-CA').format(new Date())
  const payload = { schemaVersion: 1, type, exportedAt: new Date().toISOString(), data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = buildExportFilename(type, date)
  link.click()
  URL.revokeObjectURL(url)
}

export async function readJsonUpload(uploadFile, expectedType) {
  const raw = uploadFile?.raw
  if (!raw) throw new Error('未读取到导入文件')
  let parsed
  try { parsed = JSON.parse(await raw.text()) } catch { throw new Error('JSON 文件格式不正确') }
  if (Array.isArray(parsed)) return parsed
  if (!parsed || !Array.isArray(parsed.data)) throw new Error('导入文件缺少 data 数组')
  if (parsed.type && parsed.type !== expectedType) throw new Error(`请选择 ${expectedType} 类型的导出文件`)
  return parsed.data
}
