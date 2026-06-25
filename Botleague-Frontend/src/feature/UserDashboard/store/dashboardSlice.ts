// features/Dashboard/store/dashboardSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getDashboard } from "../api/userDashboard.api";
import type {
  ProfileDTO,
  RobotResponseDTO,
  TeamsDTO,
  InvitesDTO,
  EventDTO,
} from "../api/userDashboard.api";
import type { RootState } from "../../../app/store";

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await getDashboard();
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to load dashboard"
      );
    }
  }
);

interface DashboardState {
  profile:  ProfileDTO | null;
  robots:   RobotResponseDTO[];
  teams:    TeamsDTO[];
  invites:  InvitesDTO[];
  events:   EventDTO[];
  loading:  boolean;
  error:    string | null;
}

const initialState: DashboardState = {
  profile: null,
  robots:  [],
  teams:   [],
  invites: [],
  events:  [],
  loading: false,
  error:   null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.profile = payload.profile;
        state.robots  = payload.robots;
        state.teams   = payload.teams;
        state.invites = payload.invite; // API returns "invite" (singular)
        state.events  = payload.events;
      })
      .addCase(fetchDashboard.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });
  },
});

export default dashboardSlice.reducer;

// Selectors
const s = (state: RootState) => state.dashboard;
export const selectDashboardProfile = (state: RootState) => s(state).profile;
export const selectDashboardRobots  = (state: RootState) => s(state).robots;
export const selectDashboardTeams   = (state: RootState) => s(state).teams;
export const selectDashboardInvites = (state: RootState) => s(state).invites;
export const selectDashboardEvents  = (state: RootState) => s(state).events;
export const selectDashboardLoading = (state: RootState) => s(state).loading;
export const selectDashboardError   = (state: RootState) => s(state).error;