// camelCase ↔ snake_case 转换纯函数，供 Repository 层在读写 Supabase 时统一转换字段命名。

// 将 camelCase 字符串转为 snake_case，例如 limitFen → limit_fen。
function camelToSnake(key) {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase()
}

// 将 snake_case 字符串转为 camelCase，例如 limit_fen → limitFen。
function snakeToCamel(key) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
}

// 递归转换对象键为 snake_case，用于写入 Supabase 前的 payload 转换。
// 数组中的每个对象也会被递归转换。
export function toSnakeCase(obj) {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [camelToSnake(key), toSnakeCase(value)])
    )
  }
  return obj
}

// 递归转换对象键为 camelCase，用于从 Supabase 读取后的数据转换。
// 数组中的每个对象也会被递归转换。
export function toCamelCase(obj) {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [snakeToCamel(key), toCamelCase(value)])
    )
  }
  return obj
}
