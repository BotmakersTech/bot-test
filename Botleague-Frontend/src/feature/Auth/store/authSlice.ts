// src/feature/Auth/store/authSlice.ts

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// =========================
// User Type
// =========================
export interface User {
  id?: string;

  botleagueId?: string;

  userName?: string;

  email?: string;
  phone?: string;

  firstName?: string;
  lastName?: string;

  gender?: string | null;

  dateOfBirth?: string;

  profilePhotoUrl?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;

  createdAt?: string;

  // =========================
  // RBAC
  // =========================
  role?: string;          // primary (highest-privilege) role
  allRoles?: string[];
  assignedEventIds?: string[];
  assignedSportIds?: string[];

  // =========================
  // Future Expansion
  // =========================
  activeRole?: string;

  teamRole?: string;

  eventsCount?: number;
  matchesCount?: number;
  wins?: number;
  winRate?: string;
  ranking?: string;
  teamsCount?: number;
  robotsBuilt?: number;
}

// =========================
// Auth State
// =========================
interface AuthState {
  user: User | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  isAuthChecked: boolean;
}

// =========================
// Initial State
// =========================
const initialState: AuthState = {
  user: null,

  isAuthenticated: false,

  isLoading: false,

  isAuthChecked: false,
};

// =========================
// Slice
// =========================
const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    // =========================
    // LOGIN START
    // =========================
    loginStart: (state) => {
      state.isLoading = true;
    },

    // =========================
    // LOGIN SUCCESS
    // =========================
    loginSuccess: (
      state,
      action: PayloadAction<User>
    ) => {
      state.user = action.payload;

      state.isAuthenticated = true;

      state.isLoading = false;

      state.isAuthChecked = true;
    },

    // =========================
    // LOGIN FAILURE
    // =========================
    loginFailure: (state) => {
      state.user = null;

      state.isAuthenticated = false;

      state.isLoading = false;

      state.isAuthChecked = true;
    },

    // =========================
    // LOGOUT
    // =========================
    logout: (state) => {
      state.user = null;

      state.isAuthenticated = false;

      state.isLoading = false;

      state.isAuthChecked = true;
    },

    // =========================
    // RESTORE SESSION
    // =========================
    setUser: (
      state,
      action: PayloadAction<User>
    ) => {
      state.user = action.payload;

      state.isAuthenticated = true;

      state.isAuthChecked = true;
    },

    // =========================
    // CLEAR SESSION
    // =========================
    clearUser: (state) => {
      state.user = null;

      state.isAuthenticated = false;

      state.isLoading = false;

      state.isAuthChecked = true;
    },

    // =========================
    // UPDATE USER PARTIAL
    // =========================
    updateUser: (
      state,
      action: PayloadAction<Partial<User>>
    ) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
      }
    },
  },
});

// =========================
// Exports
// =========================
export const {
  loginStart,
  loginSuccess,
  loginFailure,

  logout,

  setUser,
  clearUser,

  updateUser,
} = authSlice.actions;

export default authSlice.reducer;