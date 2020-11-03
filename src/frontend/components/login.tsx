import { h, Component } from "preact";
import { api } from "../../shared/api";
import { Input } from "./input";
import { OnAuthProps } from "./utils";

interface LoginState {
    username: string;
    password: string;
}
export class Login extends Component<OnAuthProps, LoginState> {
    constructor(props: OnAuthProps) {
        super(props);
        this.state = {
            username: "",
            password: "",
        };
    }

    async componentDidMount() {
        const { data } = await api.get("/auth");
        if (data.authed) this.props.onAuth();
    }

    async onSignup() {
        const { data } = await api.post("/auth/signup", {
            ...this.state,
        });
        if (data.success) this.onLogin();
        else alert(data.error);
    }

    async onLogin() {
        const { data } = await api.post("/auth", {
            ...this.state,
        });
        if (data.success) this.props.onAuth();
        else alert(data.error);
    }

    render(props: OnAuthProps, state: LoginState) {
        return (
            <div className="login">
                <div className="username">
                    <Input
                        type="text"
                        placeholder="Username"
                        onChanged={(val) => this.setState({ username: val })}
                    />
                </div>
                <div className="password">
                    <Input
                        type="password"
                        placeholder="Password"
                        onChanged={(val) => this.setState({ password: val })}
                    />
                </div>
                <button
                    type="button"
                    onClick={this.onLogin.bind(this)}
                    className="btn"
                >
                    Login
                </button>
                <button
                    type="button"
                    onClick={this.onSignup.bind(this)}
                    className="btn"
                >
                    Sign Up
                </button>
            </div>
        );
    }
}
