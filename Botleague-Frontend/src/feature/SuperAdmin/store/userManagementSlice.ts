import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../api/userManagement.api";
import type {
  UserSummary, PagedResponse, EventOption, SportOption, UpdateUserProfileRequest,
} from "../api/userManagement.api";
import {
  assignEventHead, unassignEventHead, assignSportHead, unassignSportHead,
} from "../../Admin/api/admin.api";
import type { RootState } from "../../../app/store";

interface UserManagementState {
  users: UserSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  selectedUser: UserSummary | null;
  availableEvents: EventOption[];
  availableSports: SportOption[];
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
}

const initialState: UserManagementState = {
  users: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  selectedUser: null,
  availableEvents: [],
  availableSports: [],
  loading: false,
  detailLoading: false,
  error: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
  "userManagement/fetchUsers",
  async ({ q, page, size }: { q?: string; page?: number; size?: number }) => {
    return api.listUsers(q, page, size);
  }
);

export const fetchUserDetail = createAsyncThunk(
  "userManagement/fetchUserDetail",
  async (userId: string) => api.getUserDetail(userId)
);

export const assignUserRole = createAsyncThunk(
  "userManagement/assignRole",
  async ({ userId, role }: { userId: string; role: string }, { dispatch }) => {
    await api.assignRole(userId, role);
    dispatch(fetchUserDetail(userId));
  }
);

export const removeUserRole = createAsyncThunk(
  "userManagement/removeRole",
  async ({ userId, role }: { userId: string; role: string }, { dispatch }) => {
    await api.removeRole(userId, role);
    dispatch(fetchUserDetail(userId));
  }
);

export const updateUserStatus = createAsyncThunk(
  "userManagement/updateStatus",
  async ({ userId, status }: { userId: string; status: string }, { dispatch }) => {
    await api.updateAccountStatus(userId, status);
    dispatch(fetchUserDetail(userId));
  }
);

// Assignment thunks call the OrganizerAssignmentController endpoints
// (admin.api.ts) directly — the equivalent userManagement.api.ts endpoints
// were removed from the backend ("moved to OrganizerAssignmentController")
// without the frontend being updated, so they 404'd.
export const assignUserEvent = createAsyncThunk(
  "userManagement/assignEvent",
  async ({ userId, eventId }: { userId: string; eventId: string }, { dispatch }) => {
    await assignEventHead(userId, eventId);
    dispatch(fetchUserDetail(userId));
  }
);

export const removeUserEventAssignment = createAsyncThunk(
  "userManagement/removeEventAssignment",
  async ({ userId, eventId }: { userId: string; eventId: string }, { dispatch }) => {
    await unassignEventHead(userId, eventId);
    dispatch(fetchUserDetail(userId));
  }
);

export const assignUserSport = createAsyncThunk(
  "userManagement/assignSport",
  async (
    { userId, eventSportId }: { userId: string; eventSportId: string; eventId: string },
    { dispatch }
  ) => {
    await assignSportHead(userId, eventSportId);
    dispatch(fetchUserDetail(userId));
  }
);

export const removeUserSportAssignment = createAsyncThunk(
  "userManagement/removeSportAssignment",
  async ({ userId, sportId }: { userId: string; sportId: string }, { dispatch }) => {
    await unassignSportHead(userId, sportId);
    dispatch(fetchUserDetail(userId));
  }
);

export const updateUserProfile = createAsyncThunk(
  "userManagement/updateProfile",
  async ({ userId, request }: { userId: string; request: UpdateUserProfileRequest }) => {
    return api.updateUserProfile(userId, request);
  }
);

export const fetchAvailableEvents = createAsyncThunk(
  "userManagement/fetchAvailableEvents",
  async () => api.getAllEventsForPicker()
);

export const fetchAvailableSports = createAsyncThunk(
  "userManagement/fetchAvailableSports",
  async (eventId: string) => api.getSportsByEventForPicker(eventId)
);

// ── Slice ─────────────────────────────────────────────────────────────────

const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
      state.availableSports = [];
    },
    clearAvailableSports: (state) => {
      state.availableSports = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        const res: PagedResponse<UserSummary> = action.payload;
        state.users = res.content;
        state.totalElements = res.totalElements;
        state.totalPages = res.totalPages;
        state.currentPage = res.page;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load users";
      })
      // fetchUserDetail
      .addCase(fetchUserDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.error.message ?? "Failed to load user";
      })
      // updateUserProfile
      .addCase(updateUserProfile.pending, (state) => { state.detailLoading = true; })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedUser = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.error.message ?? "Failed to update profile";
      })
      // fetchAvailableEvents
      .addCase(fetchAvailableEvents.fulfilled, (state, action) => {
        state.availableEvents = action.payload;
      })
      // fetchAvailableSports
      .addCase(fetchAvailableSports.fulfilled, (state, action) => {
        state.availableSports = action.payload;
      });
  },
});

export const { clearSelectedUser, clearAvailableSports } = userManagementSlice.actions;
export default userManagementSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────
export const selectUsers = (s: RootState) => s.userManagement.users;
export const selectSelectedUser = (s: RootState) => s.userManagement.selectedUser;
export const selectUserMgmtLoading = (s: RootState) => s.userManagement.loading;
export const selectUserMgmtDetailLoading = (s: RootState) => s.userManagement.detailLoading;
export const selectUserMgmtError = (s: RootState) => s.userManagement.error;
export const selectTotalElements = (s: RootState) => s.userManagement.totalElements;
export const selectTotalPages = (s: RootState) => s.userManagement.totalPages;
export const selectCurrentPage = (s: RootState) => s.userManagement.currentPage;
export const selectAvailableEvents = (s: RootState) => s.userManagement.availableEvents;
export const selectAvailableSports = (s: RootState) => s.userManagement.availableSports;
