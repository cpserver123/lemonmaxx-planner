import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: any = {
    access_token: null,
    user: null,
    platforms: [],
    integrationPlatform: null,
    accountPlatform: "facebook",
    manageAccount: [],
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.access_token = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setUserPlatforms: (state, action) => {
            state.platforms = Array.isArray(action.payload) ? action.payload : [];
        },
        setIntegrationPlatform: (state, action) => {
            state.integrationPlatform = action.payload;
        },
        setAccountPlatform: (state, action) => {
            state.accountPlatform = action.payload;
        },
        setManageAccount: (state, action) => {
            state.manageAccount = action.payload;
        },
        logout: (state) => {
            state.access_token = null;
            state.user = null;
            state.platforms = [];
            state.integrationPlatform = null;
            state.accountPlatform = null;
            state.manageAccount = [];
        },
    },
});

export const { setCredentials, setUser, setUserPlatforms, setIntegrationPlatform, setManageAccount, setAccountPlatform, logout } = userSlice.actions;
export default userSlice.reducer;
