import { h, Component } from "preact";
import { Link } from "preact-router";

export interface HeaderProps extends HeaderState {
    onLogout: () => void;
}

export interface HeaderState {
    authed: boolean;
}

export class Header extends Component<HeaderProps, HeaderState> {
    constructor(props: HeaderProps) {
        super(props);
        this.state = props;
    }

    getDerivedStateFromProps(
        props: HeaderProps,
        currentState: HeaderState
    ): HeaderState {
        if (currentState.authed !== props.authed)
            return {
                ...currentState,
                authed: props.authed,
            };

        return currentState;
    }

    render() {
        return (
            <div className="header">
                <span className="logo" />
                Birdcage
                {!this.state.authed ? (
                    ""
                ) : (
                    <div className="right">
                        <button
                            type="button"
                            onClick={this.props.onLogout.bind(this)}
                            className="btn logout"
                        >
                            <i className="fa fa-sign-out"></i>
                        </button>
                    </div>
                )}
                <nav className="header-navbar">
                    {!this.state.authed ? (
                        <ul
                            style={{
                                listStyleType: "none",
                                display: "inline",
                            }}
                        >
                            <Link href="/login">Login</Link>
                        </ul>
                    ) : (
                        <ul
                            style={{
                                listStyleType: "none",
                                display: "inline",
                            }}
                        >
                            <Link href="/routes">Routes</Link>
                        </ul>
                    )}
                </nav>
            </div>
        );
    }
}
