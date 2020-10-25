import { h, Component, RefObject } from "preact";
import { LoginPage, RouteManagementPage, HomePage } from "./pages";
import { api } from "../api";
import Router, { Route, route } from "preact-router";
import background from "../img/background.jpg";
import { Header } from "./header";
import { store } from "./utils";
import { Provider } from "unistore/preact";

interface AppState {
    backgroundImage: string;
    settings: boolean;
    color: string;
    pages: Record<
        string,
        RefObject<{
            onAuth?: () => void;
            update: (newState: unknown) => unknown;
            forceUpdate?: () => void;
        }>
    >;
    bgtag: string;
}

export type AppProps = Record<string, unknown>;

export class App extends Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            pages: {},
            backgroundImage: "",
            settings: false,
            color: localStorage.getItem("color") || "#7D7DDD",
            bgtag: localStorage.getItem("bgtag") || "colorful",
        };
    }

    loadBackground(bgtag: string): void {
        const bg = new Image();
        bg.src = background;
        bg.onload = () => {
            this.setState({ backgroundImage: bg.src });
        };
    }

    async componentDidMount(): Promise<void> {
        this.loadBackground(this.state.bgtag);
        const app = document.getElementById("app-container");
        if (app) app.style.setProperty("--bg-color", this.state.color);
    }

    onAuth(): void {
        store.setState({ authed: true });
        route("/");
        Object.values(this.state.pages ?? {}).forEach((r) => {
            const p = r.current;
            if (p) {
                if (p.onAuth) p.onAuth();
            }
        });
    }

    toggleSettings(): void {
        this.setState({ settings: !this.state.settings });
    }

    async onLogout() {
        const { data } = await api.delete("/auth");
        if (data.success) {
            route("/login");
            store.setState({ authed: false });
        } else alert(data.error);
    }

    onChangeColor(newColor: string) {
        localStorage.setItem("color", newColor);
        const app = document.getElementById("app-container");
        if (app) app.style.setProperty("--bg-color", newColor);
        this.setState({ color: newColor });
    }

    onChangeBg(bgtag: string) {
        localStorage.setItem("bgtag", bgtag);
        this.loadBackground(bgtag);
        this.setState({ bgtag: bgtag });
    }

    render(props: AppProps, state: AppState) {
        return (
            <Provider store={store}>
                <div id="app-container">
                    <div
                        className={`app-background ${
                            this.state.backgroundImage === "" ? "" : "visible"
                        }`}
                        style={{
                            backgroundImage: `url(${this.state.backgroundImage})`,
                        }}
                    />
                    <div className="app">
                        <Header
                            onLogout={this.onLogout.bind(this)}
                            ref={this.state.pages.header}
                        />
                        <div className="body">
                            <Router>
                                <LoginPage path="/login" onAuth={this.onAuth} />
                                <RouteManagementPage
                                    path="/routes"
                                    ref={this.state.pages.routeManagement}
                                />
                                <Route path="/" default component={HomePage} />
                            </Router>
                        </div>
                    </div>
                </div>
            </Provider>
        );
    }
}
