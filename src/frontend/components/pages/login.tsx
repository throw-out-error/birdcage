import { h, Component } from "preact";
import { OnAuthProps } from "../utils";
import { Login } from "../login";
import { store } from "../utils";

export interface LoginPageProps extends OnAuthProps {
    onAuth(): void;
}

export class LoginPage extends Component<LoginPageProps> {
    render() {
        return (
            <div className={store.getState().authed ? "hidden" : "overlay"}>
                <Login onAuth={this.props.onAuth.bind(this)} />
            </div>
        );
    }
}
