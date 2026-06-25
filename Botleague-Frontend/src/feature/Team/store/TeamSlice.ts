// src/feature/Team/store/teamSlice.ts

import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

// ======================================================
// TYPES
// ======================================================

export interface TeamState {
  id: string | null;

  teamCode: string | null;

  teamName: string | null;

  description: string | null;

  logoUrl: string | null;

  institutionName: string | null;

  city: string | null;

  state: string | null;

  country: string | null;

  memberRole: string | null;

  status: string | null;

  createdAt: string | null;

  // =========================
  // System State
  // =========================
  isLoading: boolean;

  isFetched: boolean;

  error: string | null;
}

// ======================================================
// INITIAL STATE
// ======================================================

const initialState: TeamState = {
  id: null,

  teamCode: null,

  teamName: null,

  description: null,

  logoUrl: null,

  institutionName: null,

  city: null,

  state: null,

  country: null,

  memberRole: null,

  status: null,

  createdAt: null,

  // =========================
  // System
  // =========================
  isLoading: false,

  isFetched: false,

  error: null,
};

// ======================================================
// SLICE
// ======================================================

const teamSlice = createSlice({
  name: "team",

  initialState,

  reducers: {
    // =========================
    // FETCH START
    // =========================
    teamFetchStart: (state) => {
      state.isLoading = true;

      state.error = null;
    },

    // =========================
    // SET TEAM
    // =========================
    setTeam: (
      state,
      action: PayloadAction<
        Partial<TeamState>
      >
    ) => {
      Object.assign(state, {
        ...action.payload,

        isLoading: false,

        isFetched: true,

        error: null,
      });
    },

    // =========================
    // FETCH FAILURE
    // =========================
    teamFetchFailure: (
      state,
      action: PayloadAction<string>
    ) => {
      state.isLoading = false;

      state.error = action.payload;

      state.isFetched = true;
    },

    // =========================
    // CLEAR TEAM
    // =========================
    clearTeam: () => initialState,
  },
});

// ======================================================
// EXPORTS
// ======================================================

export const {
  teamFetchStart,

  setTeam,

  teamFetchFailure,

  clearTeam,
} = teamSlice.actions;

export default teamSlice.reducer;