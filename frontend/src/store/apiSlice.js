import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token');
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User', 'Users',
    'TodayAttendance', 'MyAttendance', 'TeamAttendance', 'AllAttendance', 'Attendance',
    'MyOT', 'PendingOT',
  ],

  endpoints: (builder) => ({


    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
    }),
    signup: builder.mutation({
      query: (userData) => ({ url: '/auth/signup', method: 'POST', body: userData }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

  
    getAllUsers: builder.query({
      query: () => '/auth/users',
      providesTags: ['Users'],
    }),
    createUser: builder.mutation({
      query: (userData) => ({ url: '/auth/create-user', method: 'POST', body: userData }),
      invalidatesTags: ['Users'],
    }),
    toggleUserStatus: builder.mutation({
      query: (userId) => ({ url: `/auth/users/${userId}/toggle-status`, method: 'PATCH' }),
      invalidatesTags: ['Users'],
    }),
    
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/auth/users/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Users'],
    }),


    punchIn: builder.mutation({
      query: (data) => ({ url: '/attendance/punch-in', method: 'POST', body: data }),
     
      invalidatesTags: ['TodayAttendance', 'MyAttendance', 'TeamAttendance', 'AllAttendance'],
    }),
    punchOut: builder.mutation({
      query: (data) => ({ url: '/attendance/punch-out', method: 'POST', body: data }),
      invalidatesTags: ['TodayAttendance', 'MyAttendance', 'TeamAttendance', 'AllAttendance'],
    }),
    getTodayAttendance: builder.query({
      query: () => '/attendance/today',
      providesTags: ['TodayAttendance'],
      keepUnusedDataFor: 30,
    }),
    getMyAttendance: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => `/attendance/my?page=${page}&limit=${limit}`,
      providesTags: ['MyAttendance'],
    }),
    getTeamAttendance: builder.query({
      query: ({ date, page = 1, limit = 20 } = {}) => {
        const p = new URLSearchParams({ page, limit });
        if (date) p.set('date', date);
        return `/attendance/team?${p.toString()}`;
      },
      providesTags: ['TeamAttendance'],
      keepUnusedDataFor: 30,
    }),
    getAllAttendance: builder.query({
      query: ({ date, userId, page = 1, limit = 20 } = {}) => {
        const p = new URLSearchParams({ page, limit });
        if (date)   p.set('date', date);
        if (userId) p.set('userId', userId);
        return `/attendance/all?${p.toString()}`;
      },
      providesTags: ['AllAttendance'],
      keepUnusedDataFor: 30,
    }),
    getAttendanceReport: builder.query({
      query: ({ startDate, endDate, userId } = {}) => {
        const p = new URLSearchParams({ startDate, endDate });
        if (userId) p.set('userId', userId);
        return `/attendance/report?${p.toString()}`;
      },
      providesTags: ['Attendance'],
    }),

   
    requestOvertime: builder.mutation({
      query: (data) => ({ url: '/overtime/request', method: 'POST', body: data }),
      invalidatesTags: ['MyOT', 'PendingOT', 'TodayAttendance'],
    }),
    getMyOvertimeRequests: builder.query({
      query: () => '/overtime/my',
      providesTags: ['MyOT'],
    }),
    getPendingOvertimeRequests: builder.query({
      query: () => '/overtime/pending',
      providesTags: ['PendingOT'],
      keepUnusedDataFor: 30,
    }),
    
    reviewOvertimeRequest: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/overtime/${id}/review`, method: 'PATCH', body: data }),
      invalidatesTags: ['PendingOT', 'MyOT', 'TodayAttendance', 'MyAttendance', 'TeamAttendance', 'AllAttendance'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useToggleUserStatusMutation,
  useUpdateUserMutation,
  usePunchInMutation,
  usePunchOutMutation,
  useGetTodayAttendanceQuery,
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  useGetAttendanceReportQuery,
  useRequestOvertimeMutation,
  useGetMyOvertimeRequestsQuery,
  useGetPendingOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation,
} = apiSlice;
