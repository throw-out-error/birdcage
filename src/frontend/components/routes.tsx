import { h, Component } from "preact";
import { api } from "../../shared/api";
import { Route } from "../../shared/api";
import { RouteEntry } from "./route";
import { AddRoute } from "./addroute";

export type RoutesProps = Record<string, unknown>;
interface RoutesState {
    routes: Route[];
    input_source: string;
    input_target: string;
}
export class Routes extends Component<RoutesProps, RoutesState> {
    constructor(props: RoutesProps) {
        super(props);
        this.state = {
            routes: [],
            input_source: "",
            input_target: "",
        };
    }

    componentDidMount(): void {
        this.loadRoutes();
    }

    async loadRoutes(): Promise<void> {
        const { data } = await api.get("/routes");
        this.setState({ routes: data });
    }

    async onAdd(route: Route): Promise<void> {
        console.log(route);
        this.setState((state) => ({
            ...state,
            routes: [route, ...state.routes],
        }));
    }

    async onDelete(route: Route): Promise<void> {
        const idx = this.state.routes.findIndex(
            (r) => r.source === route.source && r.target === route.target
        );
        if (idx >= 0)
            this.setState((state) => ({
                ...state,
                routes: state.routes.splice(idx, 1),
            }));
    }

    async onUpdated(route: Route): Promise<void> {
        const idx = this.state.routes.findIndex(
            (r) => r.source === route.source && r.target === route.target
        );
        if (idx >= 0) {
            this.setState((state) => ({
                ...state,
                routes: { ...state.routes, [idx]: route },
            }));
        }
    }

    render(props: RoutesProps, state: RoutesState) {
        return (
            <div className="routes">
                <div className="routelist">
                    <AddRoute onRouteAdded={this.onAdd.bind(this)} />
                    {this.state.routes &&
                        this.state.routes.map((route) => (
                            <RouteEntry
                                route={route}
                                onDeleted={this.onDelete.bind(this)}
                                onUpdated={this.onUpdated.bind(this)}
                                key={route.source + ";" + route.target}
                            />
                        ))}
                </div>
            </div>
        );
    }
}
