// src/feature/Team/store/teamMembershipSlice.ts

import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

// ======================================================
// TYPES
// ======================================================

export interface TeamMembershipState {
  id: string;

  joinedAt: string | null;

  role: string | null;

  status: string | null;

  userId: string;
}

// ======================================================
// SLICE STATE
// ======================================================

interface TeamMembershipSliceState {
  memberships: TeamMembershipState[];

  isLoading: boolean;

  isFetched: boolean;

  error: string | null;
}

// ======================================================
// INITIAL STATE
// ======================================================

const initialState: TeamMembershipSliceState =
{
  memberships: [],

  isLoading: false,

  isFetched: false,

  error: null,
};

// ======================================================
// SLICE
// ======================================================

const teamMembershipSlice = createSlice({
  name: "teamMembership",

  initialState,

  reducers: {
    // ======================================================
    // FETCH START
    // ======================================================

    membershipFetchStart: (
      state
    ) => {
      state.isLoading = true;

      state.error = null;
    },

    // ======================================================
    // SET MEMBERSHIPS
    // ======================================================

    setMemberships: (
      state,
      action: PayloadAction<
        TeamMembershipState[]
      >
    ) => {
      state.memberships =
        action.payload;

      state.isLoading = false;

      state.isFetched = true;

      state.error = null;
    },

    // ======================================================
    // ADD MEMBERSHIP
    // ======================================================

    addMembership: (
      state,
      action: PayloadAction<
        TeamMembershipState
      >
    ) => {
      state.memberships.push(
        action.payload
      );
    },

    // ======================================================
    // UPDATE MEMBERSHIP
    // ======================================================

    updateMembership: (
      state,
      action: PayloadAction<
        TeamMembershipState
      >
    ) => {

      const index =
        state.memberships.findIndex(
          (membership) =>
            membership.id ===
            action.payload.id
        );

      if (index !== -1) {

        state.memberships[index] =
          action.payload;
      }
    },

    // ======================================================
    // REMOVE MEMBERSHIP
    // ======================================================

    removeMembership: (
      state,
      action: PayloadAction<string>
    ) => {

      state.memberships =
        state.memberships.filter(
          (membership) =>
            membership.id !==
            action.payload
        );
    },

    // ======================================================
    // FETCH FAILURE
    // ======================================================

    membershipFetchFailure: (
      state,
      action: PayloadAction<string>
    ) => {

      state.isLoading = false;

      state.isFetched = true;

      state.error =
        action.payload;
    },

    // ======================================================
    // CLEAR MEMBERSHIPS
    // ======================================================

    clearMemberships: (
      state
    ) => {

      state.memberships = [];

      state.isLoading = false;

      state.isFetched = false;

      state.error = null;
    },
  },
});

// ======================================================
// EXPORTS
// ======================================================

export const {

  membershipFetchStart,

  setMemberships,

  addMembership,

  updateMembership,

  removeMembership,

  membershipFetchFailure,

  clearMemberships,

} = teamMembershipSlice.actions;

export default teamMembershipSlice.reducer;