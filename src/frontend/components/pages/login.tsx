import { h, Component } from "preact";
import { OnAuthProps } from "../utils";
import { Login } from "../login";

export interface LoginPageProps extends OnAuthProps {
    authed: boolean;
    onAuth(): void;
}

export class LoginPage extends Component<LoginPageProps> {
    render() {
        return (
            <div className={this.props.authed ? "hidden" : "overlay"}>
                <Login onAuth={this.props.onAuth.bind(this)} />
            </div>
        );
    }
}
