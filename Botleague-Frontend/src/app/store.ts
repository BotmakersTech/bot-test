import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../feature/Auth/store/authSlice";
import teamReducer from "../feature/Team/store/TeamSlice";
import teamMembershipReducer from "../feature/Team/TeamMembership/store/TeamMembership.slice";
import dashboardReducer from "../feature/UserDashboard/store/dashboardSlice";
import robotsReducer from "../feature/Robots/store/robotsSlice";
import eventsReducer from "../feature/Event/store/eventsSlice";
import matchesReducer from "../feature/Matches/store/matchesSlice";
import userManagementReducer from "../feature/SuperAdmin/store/userManagementSlice";
import notificationReducer from "../feature/Notifications/store/notificationSlice";
import chatReducer from "../feature/Chat/store/chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    team: teamReducer,
    teamMembership: teamMembershipReducer,
    dashboard: dashboardReducer,
    robots: robotsReducer,
    events: eventsReducer,
    matches: matchesReducer,
    userManagement: userManagementReducer,
    notifications: notificationReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;