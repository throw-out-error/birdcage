import { h, Component } from "preact";
import { Link } from "preact-router";
import { store } from "./utils";

export interface HeaderProps {
    onLogout: () => void;
}

export class Header extends Component<HeaderProps, { authed: boolean }> {
    constructor(props: HeaderProps) {
        super(props);
        this.state = { authed: false };
    }

    componentDidMount() {
        store.subscribe((state) => {
            console.log(`New state: ${JSON.stringify(state)}`);

            this.setState({ authed: state.authed });
            this.forceUpdate();
        });
    }

    render() {
        return (
            <div className="header">
                <span className="logo" />
                <span className="logo-text">
                    <Link href="/">Birdcage</Link>
                </span>
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
            </div>
        );
    }
}
