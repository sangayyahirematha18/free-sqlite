import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { find, uniq } from "lodash";
import { language as sqlLanguage } from 'monaco-editor/esm/vs/basic-languages/sql/sql.js';
import { format } from 'sql-formatter'

const { keywords } = sqlLanguage

console.log('sqlAutoComplete keywords', keywords)
// sql自动补全关键字
export const sqlAutoComplete = () => {
  const suggestions = keywords.map((item) => ({
    label: item,
    kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: `${item} `,
    detail: 'DB Keyword',
  }))
  return suggestions;
}

// 数据库名
export const getDBSuggest = (dataBase) => {
  const suggestions = Object.keys(dataBase).map((key) => ({
    label: key,
    kind: monaco.languages.CompletionItemKind.Constant,
    insertText: key,
    detail: '数据库',
  }))
  return suggestions;
}

export const getClomnSuggest = (hintData=[], tableName) => {
  if (!tableName) {
    return []
  }
  const table = find(hintData, tableInfo => tableInfo.tableName === tableName)
  if (table && Array.isArray(table.columns)) {
    // 有精确找到表
    // 返回表字段
    return table.columns.map((col) => ({
      label: col.name,
      kind: monaco.languages.CompletionItemKind.Field,
      insertText: col.name,
      detail: 'Column',
    }))
  } else {
    // 没有精确找到表
    // 返回所有表的字段
    let allColumns = []
    hintData.forEach(tableInfo => {
      if (Array.isArray(tableInfo.columns)) {
        allColumns = allColumns.concat(tableInfo.columns)
      }
    })
    let columnNames = allColumns.map(col => col.name)
    columnNames = uniq(columnNames) // 去重
    return columnNames.map((name) => ({
      label: name,
      kind: monaco.languages.CompletionItemKind.Field,
      insertText: name,
      detail: 'Column',
    }))
  }
}

// 获取表名
export const getTableSuggest = (hintData, dbName) => {
  const tableNames = hintData.map(table => table.tableName)
  return tableNames.map((name) => ({
    label: name,
    kind: monaco.languages.CompletionItemKind.Constant,
    insertText: name,
    detail: 'Table',
  }))
}
// 格式化 SQL
export const formatSQL = (sql) => {
  return format(sql)
}

// 初始化 函数
export function noop() {}

export function processSize(size) {
  return /^\d+$/.test(size) ? `${size}px` : size;
}
