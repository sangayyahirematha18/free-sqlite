/* eslint-disable */
import * as path from 'path';

export const methods = {
    PAGE_STATUS: 'PAGE_STATUS',
    ROUTER: 'ROUTER',
    CHANGE_THEME: 'CHANGE_THEME',
    GET_ALL_TABLES: 'GET_ALL_TABLES',
    EXECUTE_SQL: 'EXECUTE_SQL',
    GET_USER_FAVORITES: 'GET_USER_FAVORITES',
    ADD_USER_FAVORITE: 'ADD_USER_FAVORITE',
    RENAME_USER_FAVORITE: 'RENAME_USER_FAVORITE',
    REMOVE_USER_FAVORITE: 'REMOVE_USER_FAVORITE',
    COPY_TO_CLIPBOARD: 'COPY_TO_CLIPBOARD',
    EXPORT_SQL_RESULT: 'EXPORT_SQL_RESULT',
    SORT_USER_FAVORITES: 'SORT_USER_FAVORITES'
}
export const events = {
    CHANGE_THEME: 'CHANGE_THEME'
}

export const uiDir = () => path.resolve(__dirname, `../ui_dist/ui/build`);
