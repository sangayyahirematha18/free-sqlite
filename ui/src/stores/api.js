import { request } from './rpcRequest';

/**
 * 获取表格树
 * @returns 
 */
export const getAllTables = () => {
    return request({ method: 'GET_ALL_TABLES' });
}

/**
 * 执行SQL
 * @param {*} data 
 * @returns 
 */
export const executeSql = (data) => {
    return request({ method: 'EXECUTE_SQL', data });
}

/**
 * 获取用户收藏的SQL语句列表
 * @returns 
 */
export const getUserFavorites = () => {
    return request({ method: 'GET_USER_FAVORITES' });
}

/**
 * 添加用户收藏的SQL语句
 * @param {*} data { name, sql }
 * @returns 
 */
export const addUserFavorite = (data) => {
    return request({ method: 'ADD_USER_FAVORITE', data });
}

/**
 * 删除用户收藏的SQL语句
 * @param {*} data { id }
 * @returns 
 */
export const removeUserFavorite = (data) => {
    return request({ method: 'REMOVE_USER_FAVORITE', data });
}

/**
 * 重命名用户收藏的SQL语句
 * @param {*} data { id, name }
 * @returns 
 */
export const renameUserFavorite = (data) => {
    return request({ method: 'RENAME_USER_FAVORITE', data });
}

/**
 * 复制内容到剪贴板
 * @param {*} data 
 * @returns 
 */
export const writeToClipboard = (data) => {
    return request({ method: 'COPY_TO_CLIPBOARD', data });
}
/**
 * 查询结果导出为csv/excel
 * @param {*} data 
 * @returns 
 */
export const exportToSave = (data) => {
    return request({ method: 'EXPORT_SQL_RESULT', data });
}
/**
 * 排序用户收藏的SQL语句
 * @param {*} data fidList
 * @returns 
 */
export const sortUserFavorites = (data) => {
    return request({ method: 'SORT_USER_FAVORITES', data });
}
