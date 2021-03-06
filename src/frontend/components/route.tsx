import { h, Component } from "preact";
import { api, IResponse } from "../../shared/api";
import { Route } from "../../shared/api";
import { Checkbox } from "./checkbox";
import { Input } from "./input";

export interface RouteProps {
    route: Route;
    onDeleted(route: Route): void;
    onUpdated(route: Route): void;
}
interface RouteState {
    expanded: boolean;
    route: Route;
}
export class RouteEntry extends Component<RouteProps, RouteState> {
    constructor(props: RouteProps) {
        super(props);
        this.state = {
            route: props.route,
            expanded: false,
        };
    }

    async onDelete(): Promise<void> {
        const { source, target } = this.props.route;
        const res = await api.delete(
            `/routes/${encodeURIComponent(source)}/${encodeURIComponent(
                JSON.stringify({
                    proxyUri: target.proxyUri,
                    webroot: target.webroot,
                } as Route["target"])
            )}`
        );
        const data: IResponse = res.data as IResponse;
        if (data.success) {
            this.props.onDeleted(this.props.route);
        } else {
            alert(data.error);
        }
    }

    async onUpdate(): Promise<void> {
        const { source, target } = this.props.route;
        const res = await api.put(
            `/routes/${encodeURIComponent(source)}/${encodeURIComponent(
                JSON.stringify({
                    proxyUri: target.proxyUri,
                    webroot: target.webroot,
                } as Route["target"])
            )}`,
            this.state.route
        );
        const data: IResponse = res.data as IResponse;

        if (data.success) {
            this.props.onUpdated(this.state.route);
        } else {
            alert(data.error);
        }
    }

    setRoute<K extends keyof Route>(key: K, value: Route[K]): void {
        this.setState({ route: { ...this.props.route, [key]: value } });
    }

    toggleExpansion(): void {
        this.setState((state) => ({ ...state, expanded: !state.expanded }));
    }

    render(props: RouteProps, state: RouteState) {
        return (
            <div className={`route ${state.expanded ? "expanded" : ""}`}>
                <div className="source">{this.props.route.source}</div>
                <button
                    type="button"
                    onClick={this.toggleExpansion.bind(this)}
                    className="btn expand"
                >
                    {this.state.expanded ? (
                        <i className="fa fa-caret-up"></i>
                    ) : (
                        <i className="fa fa-caret-down"></i>
                    )}
                </button>
                <div className="target">
                    Proxy URI:
                    <div className="target-proxy">
                        {this.props.route.target.proxyUri}
                    </div>
                    Webroot:
                    <div className="target-webroot">
                        {this.props.route.target.webroot}
                    </div>
                </div>
                <div className="ssl">
                    <Checkbox
                        label="HTTPS"
                        checked={this.props.route.ssl}
                        onChanged={(checked) => this.setRoute("ssl", checked)}
                    />
                </div>
                <div className="email">
                    <Input
                        placeholder="Owner email"
                        value={this.state.route.email}
                        onChanged={(val) => this.setRoute("email", val)}
                        onSubmit={this.onUpdate.bind(this)}
                    />
                </div>
                <button
                    type="button"
                    onClick={this.onUpdate.bind(this)}
                    className="btn save"
                >
                    <i className="fa fa-save"></i>
                </button>
                <button
                    type="button"
                    onClick={this.onDelete.bind(this)}
                    className="btn delete"
                >
                    <i className="fa fa-trash"></i>
                </button>
            </div>
        );
    }
}
