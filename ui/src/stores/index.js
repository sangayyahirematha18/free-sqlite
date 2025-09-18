import { configureStore } from '@reduxjs/toolkit';

import homeSlice from './homeSlice';
import sqlSlice from './sqlSlice';

export const store = configureStore({
  reducer: {
    home: homeSlice,
    sql: sqlSlice,
  },
});
