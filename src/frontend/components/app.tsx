import { h, Component, RefObject } from "preact";
import { LoginPage, RouteManagementPage, HomePage } from "./pages";
import { api } from "../api";
import Router, { Route, route } from "preact-router";
import background from "../img/background.jpg";
import { Header } from "./header";

interface AppState {
    backgroundImage: string;
    authed: boolean;
    settings: boolean;
    color: string;
    pages: Record<string, RefObject<{ onAuth?: () => void }>>;
    bgtag: string;
}

export type AppProps = Record<string, unknown>;

export class App extends Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            pages: {},
            backgroundImage: "",
            authed: false,
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
        this.setState({ authed: true });
        route("/");
        Object.values(this.state.pages ?? {}).forEach((r) => {
            const p = r.current;
            if (p && p.onAuth) p.onAuth();
        });
    }

    toggleSettings(): void {
        this.setState({ settings: !this.state.settings });
    }

    async onLogout() {
        const { data } = await api.delete("/auth");
        if (data.success) route("/login");
        else alert(data.error);
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
                        authed={this.state.authed}
                        onLogout={this.onLogout.bind(this)}
                    />
                    <div className="body">
                        <Router>
                            <Route
                                path="/login"
                                component={LoginPage}
                                authed={this.state.authed}
                                onAuth={this.onAuth}
                            />
                            <RouteManagementPage
                                path="/routes"
                                authed={this.state.authed}
                                ref={this.state.pages.routeManagement}
                            />
                            <Route path="/" default component={HomePage} />
                        </Router>
                    </div>
                </div>
            </div>
        );
    }
}
