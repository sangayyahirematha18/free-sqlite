import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { writeToClipboard } from './api';

const initialState = {
  vsTheme: 'dark',
};


export const writeToClipboardAsync = createAsyncThunk(
  "home/writeToClipboard",
  async (data) => {
    const response = await writeToClipboard(data);
    return response.data;
  }
);

export const slice = createSlice({
  name: "home",
  initialState,
  reducers: {
    setVsTheme: (state, action) => {
      state.vsTheme = action.payload;
    },
  },
  extraReducers: (builder) => {

  }
});

export const vsTheme = (state) => state.home.vsTheme;

export const { setVsTheme } = slice.actions;

export default slice.reducer;