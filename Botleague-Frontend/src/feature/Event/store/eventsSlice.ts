import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getLiveEvents,
  getEventSports,
  getTeamRegistrations,
} from "../api/event.api";
import type {
  EventResponse,
  EventSportResponse,
  EventRegistrationResponse,
} from "../api/event.api";
import type { RootState } from "../../../app/store";

// ======================================================
// ASYNC THUNKS
// ======================================================

export const fetchLiveEvents = createAsyncThunk(
  "events/fetchLive",
  async (_, { rejectWithValue }) => {
    try {
      return await getLiveEvents();
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to load events");
    }
  }
);

export const fetchEventSports = createAsyncThunk(
  "events/fetchSports",
  async (eventId: string, { rejectWithValue }) => {
    try {
      const sports = await getEventSports(eventId);
      return { eventId, sports };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to load sports");
    }
  }
);

export const fetchTeamRegistrations = createAsyncThunk(
  "events/fetchTeamRegistrations",
  async (teamId: string, { rejectWithValue }) => {
    try {
      return await getTeamRegistrations(teamId);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to load registrations");
    }
  }
);

// ======================================================
// STATE
// ======================================================

interface EventsState {
  liveEvents: EventResponse[];
  sportsByEventId: Record<string, EventSportResponse[]>;
  teamRegistrations: EventRegistrationResponse[];
  loading: boolean;
  error: string | null;
  /** Bumped on any realtime event/sport mutation — pages watch this to re-render */
  eventLastUpdated: number;
}

const initialState: EventsState = {
  liveEvents: [],
  sportsByEventId: {},
  teamRegistrations: [],
  loading: false,
  error: null,
  eventLastUpdated: 0,
};

// ======================================================
// SLICE
// ======================================================

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearEvents: (state) => {
      state.liveEvents = [];
      state.sportsByEventId = {};
      state.teamRegistrations = [];
      state.error = null;
      state.eventLastUpdated = 0;
    },
    removeRegistration: (state, { payload: registrationId }: { payload: string }) => {
      state.teamRegistrations = state.teamRegistrations.filter(
        (r) => r.registrationId !== registrationId && r.id !== registrationId
      );
    },

    /** Merge a realtime EVENT_UPDATED payload into the liveEvents list. */
    updateEventRealtime: (state, { payload }: { payload: Partial<EventResponse> }) => {
      if (!payload.id) return;
      const idx = state.liveEvents.findIndex((e) => e.id === payload.id);
      if (idx !== -1) {
        state.liveEvents[idx] = { ...state.liveEvents[idx], ...payload };
      } else {
        // Status might have just changed to LIVE — add it
        state.liveEvents.push(payload as EventResponse);
      }
      state.eventLastUpdated = Date.now();
    },

    /** Handle EVENT_STATUS_CHANGED — also removes from liveEvents if no longer LIVE. */
    updateEventStatusRealtime: (state, { payload }: { payload: Partial<EventResponse> }) => {
      if (!payload.id) return;
      const idx = state.liveEvents.findIndex((e) => e.id === payload.id);
      if (idx !== -1) {
        const merged = { ...state.liveEvents[idx], ...payload };
        if (merged.status === "LIVE") {
          state.liveEvents[idx] = merged;
        } else {
          // No longer live — remove from live list
          state.liveEvents.splice(idx, 1);
        }
      }
      state.eventLastUpdated = Date.now();
    },

    /** Merge a SPORT_UPDATED payload into the sportsByEventId cache. */
    updateEventSportRealtime: (state, { payload }: { payload: Partial<EventSportResponse> }) => {
      if (!payload.id || !payload.eventId) return;
      const list = state.sportsByEventId[payload.eventId];
      if (!list) return;
      const idx = list.findIndex((s) => s.id === payload.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      }
      state.eventLastUpdated = Date.now();
    },

    /** Increment the registeredTeamsCount on a sport after REGISTRATION_NEW. */
    incrementSportRegistrationCount: (
      state,
      { payload }: { payload: { eventId: string; sportId: string } }
    ) => {
      const list = state.sportsByEventId[payload.eventId];
      if (!list) return;
      const sport = list.find((s) => s.id === payload.sportId);
      if (sport && sport.registeredTeamsCount !== undefined) {
        sport.registeredTeamsCount += 1;
      }
      state.eventLastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchLiveEvents
      .addCase(fetchLiveEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLiveEvents.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.liveEvents = payload;
      })
      .addCase(fetchLiveEvents.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      // fetchEventSports
      .addCase(fetchEventSports.fulfilled, (state, { payload }) => {
        state.sportsByEventId[payload.eventId] = payload.sports;
      })

      // fetchTeamRegistrations
      .addCase(fetchTeamRegistrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamRegistrations.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.teamRegistrations = payload;
      })
      .addCase(fetchTeamRegistrations.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      });
  },
});

export const {
  clearEvents,
  removeRegistration,
  updateEventRealtime,
  updateEventStatusRealtime,
  updateEventSportRealtime,
  incrementSportRegistrationCount,
} = eventsSlice.actions;
export default eventsSlice.reducer;

// ======================================================
// SELECTORS
// ======================================================

export const selectLiveEvents = (state: RootState) => state.events.liveEvents;
export const selectSportsForEvent = (eventId: string) => (state: RootState) =>
  state.events.sportsByEventId[eventId] ?? [];
export const selectTeamRegistrations = (state: RootState) => state.events.teamRegistrations;
export const selectEventsLoading = (state: RootState) => state.events.loading;
export const selectEventsError = (state: RootState) => state.events.error;
export const selectEventLastUpdated = (state: RootState) => state.events.eventLastUpdated;
