import { h, Component } from "preact";
import { api } from "../../shared/api";
import { Route } from "../../shared/api";
import { Checkbox } from "./checkbox";
import { Input } from "./input";

export interface AddRouteProps {
    onRouteAdded(route: Route): void;
}
interface AddRouteState {
    route: Route;
}
export class AddRoute extends Component<AddRouteProps, AddRouteState> {
    constructor(props: AddRouteProps) {
        super(props);
        this.state = {
            route: {
                source: "",
                target: {},
                ssl: false,
                email: "",
            },
        };
    }

    async onAdd(): Promise<void> {
        if (!this.state.route.email)
            this.setState((state) => ({
                ...state,
                route: { ...state.route, email: "admin@example.com" },
            }));
        console.log(this.state.route);
        const { data } = await api.post("/routes", this.state.route);
        if (data.success) {
            this.props.onRouteAdded(this.state.route);
        } else {
            alert(data.error);
        }
    }

    setRoute<K extends keyof Route>(key: K, value: Route[K]): void {
        this.setState({ route: { ...this.state.route, [key]: value } });
        // console.log(this.state);
    }

    render(): h.JSX.Element {
        return (
            <div className="route add expanded">
                <div className="source">
                    <Input
                        placeholder="Source"
                        onChanged={(val) => this.setRoute("source", val)}
                        onSubmit={this.onAdd.bind(this)}
                    />
                </div>
                <div className="target" style={{ display: "inline" }}>
                    <div className="target-proxy">
                        <Input
                            placeholder="Proxied URI"
                            onChanged={(val) =>
                                this.setRoute("target", {
                                    ...this.state.route.target,
                                    proxyUri: val,
                                })
                            }
                            onSubmit={this.onAdd.bind(this)}
                        />
                    </div>
                    <div className="target-webroot">
                        <Input
                            placeholder="Webroot Path"
                            onChanged={(val) =>
                                this.setRoute("target", {
                                    ...this.state.route.target,
                                    webroot: val,
                                })
                            }
                            onSubmit={this.onAdd.bind(this)}
                        />
                    </div>
                </div>
                <div className="ssl-input" style={{ display: "inline" }}>
                    <div className="email">
                        <Input
                            placeholder="Owner email"
                            onChanged={(val) => this.setRoute("email", val)}
                            onSubmit={this.onAdd.bind(this)}
                        />
                    </div>
                    <div className="ssl">
                        <Checkbox
                            label="HTTPS"
                            checked={false}
                            onChanged={(checked) =>
                                this.setRoute("ssl", checked)
                            }
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={this.onAdd.bind(this)}
                    className="btn addbtn"
                >
                    <i className="fa fa-plus"></i>
                </button>
            </div>
        );
    }
}
