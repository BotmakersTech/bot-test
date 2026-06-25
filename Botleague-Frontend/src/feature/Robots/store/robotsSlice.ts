import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  getRobotsOfCurrentTeam,
  createRobot,
  updateRobot,
  deleteRobot,
} from "../api/robot.api";
import type { CreateRobotPayload, UpdateRobotPayload } from "../api/robot.api";
import type { Robot } from "../types/types";
import type { RootState } from "../../../app/store";

// ======================================================
// ASYNC THUNKS
// ======================================================

export const fetchRobots = createAsyncThunk(
  "robots/fetchByTeam",
  async (teamCode: string, { rejectWithValue }) => {
    try {
      return await getRobotsOfCurrentTeam(teamCode);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to load robots");
    }
  }
);

export const addRobot = createAsyncThunk(
  "robots/create",
  async (payload: CreateRobotPayload, { rejectWithValue }) => {
    try {
      return await createRobot(payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to create robot");
    }
  }
);

export const editRobot = createAsyncThunk(
  "robots/update",
  async (
    { robotId, payload }: { robotId: string; payload: UpdateRobotPayload },
    { rejectWithValue }
  ) => {
    try {
      return await updateRobot(robotId, payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to update robot");
    }
  }
);

export const removeRobot = createAsyncThunk(
  "robots/delete",
  async (robotId: string, { rejectWithValue }) => {
    try {
      await deleteRobot(robotId);
      return robotId;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to delete robot");
    }
  }
);

// ======================================================
// STATE
// ======================================================

interface RobotsState {
  robots: Robot[];
  loading: boolean;
  error: string | null;
}

const initialState: RobotsState = {
  robots: [],
  loading: false,
  error: null,
};

// ======================================================
// SLICE
// ======================================================

const robotsSlice = createSlice({
  name: "robots",
  initialState,
  reducers: {
    clearRobots: (state) => {
      state.robots = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRobots
      .addCase(fetchRobots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRobots.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.robots = payload;
      })
      .addCase(fetchRobots.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      // addRobot — the create endpoint returns CreateRobotResponseDTO (id, robotCode, robotName, status)
      // so we just mark loading done; the caller should re-fetch or optimistically add
      .addCase(addRobot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRobot.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addRobot.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      // editRobot
      .addCase(editRobot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editRobot.fulfilled, (state, { payload }: PayloadAction<Robot>) => {
        state.loading = false;
        const idx = state.robots.findIndex((r) => r.id === payload.id);
        if (idx !== -1) state.robots[idx] = payload;
      })
      .addCase(editRobot.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      // removeRobot
      .addCase(removeRobot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeRobot.fulfilled, (state, { payload }: PayloadAction<string>) => {
        state.loading = false;
        state.robots = state.robots.filter((r) => r.id !== payload);
      })
      .addCase(removeRobot.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      });
  },
});

export const { clearRobots } = robotsSlice.actions;
export default robotsSlice.reducer;

// ======================================================
// SELECTORS
// ======================================================

export const selectRobots = (state: RootState) => state.robots.robots;
export const selectRobotsLoading = (state: RootState) => state.robots.loading;
export const selectRobotsError = (state: RootState) => state.robots.error;
