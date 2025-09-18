import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllTables, executeSql, getUserFavorites, addUserFavorite, renameUserFavorite, removeUserFavorite, exportToSave, sortUserFavorites } from './api';

const initialState = {
  tableTree: [],
  tableTreeStatus: 'idle',

  executeSqlStatus: 'idle',
  sqlResult: null,

  favoriteList: [],
  favoriteListStatus: 'idle',
};

export const getAllTablesAsync = createAsyncThunk(
  "sql/getAllTables",
  async () => {
    const response = await getAllTables();
    return response.data;
  }
);

export const executeSqlAsync = createAsyncThunk(
  "sql/executeSql",
  async (data) => {
    const response = await executeSql(data);
    return response.data;
  }
);

export const getUserFavoritesAsync = createAsyncThunk(
  "sql/getUserFavorites",
  async () => {
    const response = await getUserFavorites();
    return response.data;
  }
);

export const addUserFavoriteAsync = createAsyncThunk(
  "sql/addUserFavorite",
  async (data) => {
    const response = await addUserFavorite(data);
    return response.data;
  }
);

export const renameUserFavoriteAsync = createAsyncThunk(
  "sql/renameUserFavorite",
  async (data) => {
    const response = await renameUserFavorite(data);
    return response.data;
  }
);

export const removeUserFavoriteAsync = createAsyncThunk(
  "sql/removeUserFavorite",
  async (data) => {
    const response = await removeUserFavorite(data);
    return response.data;
  }
);

export const exportToSaveAsync = createAsyncThunk(
  "sql/exportToSave",
  async (data) => {
    const response = await exportToSave(data);
    return response.data;
  }
);

export const sortUserFavoritesAsync = createAsyncThunk(
  "sql/sortUserFavorites",
  async (data) => {
    const response = await sortUserFavorites(data);
    return response.data;
  }
);

export const slice = createSlice({
  name: "sql",
  initialState,
  reducers: {
    setFavoriteList: (state, action) => {
      state.favoriteList = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllTablesAsync.pending, (state) => {
        state.tableTreeStatus = 'loading';
      })
      .addCase(getAllTablesAsync.fulfilled, (state, action) => {
        console.log('Fetched all tables:', action);
        state.tableTreeStatus = 'idle';
        state.tableTree = action.payload.data || [];
      })
      .addCase(executeSqlAsync.pending, (state) => {
        state.executeSqlStatus = 'loading';
      })
      .addCase(executeSqlAsync.fulfilled, (state, action) => {
        // console.log('Executed SQL:', action.payload);
        state.executeSqlStatus = 'idle';
        if (action.payload.errorCode === 200) {
          state.sqlResult = action.payload.data || null;
        }
      })
      .addCase(getUserFavoritesAsync.pending, (state) => {
        state.favoriteListStatus = 'loading';
      })
      .addCase(getUserFavoritesAsync.fulfilled, (state, action) => {
        console.log('Fetched user favorites:', action.payload);
        state.favoriteListStatus = 'idle';
        state.favoriteList = action.payload.data || [];
      })
  }
});

export const tableTree = (state) => state.sql.tableTree;
export const tableTreeStatus = (state) => state.sql.tableTreeStatus;
export const executeSqlStatus = (state) => state.sql.executeSqlStatus;
export const sqlResult = (state) => state.sql.sqlResult;
export const favoriteList = (state) => state.sql.favoriteList;
export const favoriteListStatus = (state) => state.sql.favoriteListStatus;

export const { setFavoriteList } = slice.actions;

export default slice.reducer;