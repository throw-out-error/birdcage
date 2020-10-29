import createStore from "unistore";

export const store = createStore({
    authed: false,
});

export interface OnAuthProps {
    onAuth(): void;
}
