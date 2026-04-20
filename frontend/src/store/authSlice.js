import { createSlice } from '@reduxjs/toolkit';


const token = localStorage.getItem('token');
const user  = (() => {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
})();

const initialState = {
  user:            user  || null,
  token:           token || null,
  isAuthenticated: !!token,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user            = user;
      state.token           = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user',  JSON.stringify(user));
    },
  
    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
   
    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;


export const selectCurrentUser  = (state) => state.auth.user;
export const selectIsAuth       = (state) => state.auth.isAuthenticated;
export const selectUserRole     = (state) => state.auth.user?.role;

export default authSlice.reducer;
