import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  publicGetAllMatches,
  publicGetEventsSportMatches,
} from "../api/matches.api";
import type { PublicMatchView } from "../api/matches.api";
import type { RootState } from "../../../app/store";

// ======================================================
// ASYNC THUNKS
// ======================================================

export const fetchAllMatches = createAsyncThunk(
  "matches/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await publicGetAllMatches();
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to load matches");
    }
  }
);

export const fetchMatchesByEventSport = createAsyncThunk(
  "matches/fetchByEventSport",
  async (eventSportId: string, { rejectWithValue }) => {
    try {
      const matches = await publicGetEventsSportMatches(eventSportId);
      return { eventSportId, matches };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to load matches");
    }
  }
);

// ======================================================
// STATE
// ======================================================

interface MatchesState {
  allMatches: PublicMatchView[];
  matchesByEventSport: Record<string, PublicMatchView[]>;
  loading: boolean;
  error: string | null;
  /** Bumped whenever the backend signals RANKINGS_UPDATED — consumers watch this to re-fetch. */
  rankingsRefreshTrigger: string;
  /** Bumped on every realtime match mutation — MyMatchesPage watches this to refetch. */
  matchLastUpdated: number;
}

const initialState: MatchesState = {
  allMatches: [],
  matchesByEventSport: {},
  loading: false,
  error: null,
  rankingsRefreshTrigger: "",
  matchLastUpdated: 0,
};

// ======================================================
// SLICE
// ======================================================

const matchesSlice = createSlice({
  name: "matches",
  initialState,
  reducers: {
    clearMatches: (state) => {
      state.allMatches = [];
      state.matchesByEventSport = {};
      state.error = null;
    },
    /** Merge or insert a match update received over WebSocket into both caches. */
    updateMatchRealtime: (state, action: PayloadAction<Partial<PublicMatchView>>) => {
      const updated = action.payload;
      if (!updated.matchId) return;
      // allMatches: update or insert
      const idx = state.allMatches.findIndex((m) => m.matchId === updated.matchId);
      if (idx !== -1) {
        state.allMatches[idx] = { ...state.allMatches[idx], ...updated };
      } else {
        state.allMatches.push(updated as PublicMatchView);
      }
      if (updated.eventSportId) {
        if (!state.matchesByEventSport[updated.eventSportId]) {
          state.matchesByEventSport[updated.eventSportId] = [];
        }
        const matches = state.matchesByEventSport[updated.eventSportId];
        const idx2 = matches.findIndex((m) => m.matchId === updated.matchId);
        if (idx2 !== -1) {
          matches[idx2] = { ...matches[idx2], ...updated };
        } else {
          matches.push(updated as PublicMatchView);
        }
      }
      state.matchLastUpdated = Date.now();
    },
    /** Bump the trigger string so leaderboard consumers know to re-fetch rankings. */
    triggerRankingsRefresh: (state, action: PayloadAction<string>) => {
      state.rankingsRefreshTrigger = action.payload + ":" + Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllMatches
      .addCase(fetchAllMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMatches.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.allMatches = payload;
      })
      .addCase(fetchAllMatches.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      // fetchMatchesByEventSport
      .addCase(fetchMatchesByEventSport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchesByEventSport.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.matchesByEventSport[payload.eventSportId] = payload.matches;
      })
      .addCase(fetchMatchesByEventSport.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      });
  },
});

export const { clearMatches, updateMatchRealtime, triggerRankingsRefresh } = matchesSlice.actions;
export default matchesSlice.reducer;

// ======================================================
// SELECTORS
// ======================================================

export const selectAllMatches = (state: RootState) => state.matches.allMatches;
export const selectMatchesForEventSport = (eventSportId: string) => (state: RootState) =>
  state.matches.matchesByEventSport[eventSportId] ?? [];
export const selectMatchesLoading = (state: RootState) => state.matches.loading;
export const selectMatchesError = (state: RootState) => state.matches.error;
export const selectRankingsRefreshTrigger = (state: RootState) => state.matches.rankingsRefreshTrigger;
export const selectMatchLastUpdated = (state: RootState) => state.matches.matchLastUpdated;
