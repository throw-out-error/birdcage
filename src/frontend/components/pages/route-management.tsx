import { h, Component, RenderableProps, RefObject } from "preact";
import { Routes } from "../routes";
import { Denied } from "../denied";

export interface RouteManagementProps extends RenderableProps<unknown> {
    authed: boolean;
}

export class RouteManagementPage extends Component<RouteManagementProps> {
    routes?: RefObject<Routes>;

    onAuth(): void {
        this.routes?.current?.loadRoutes();
    }

    render() {
        if (!this.props.authed) return <Denied />;
        return (
            <div>
                <Routes path="/routes" ref={this.routes} />
            </div>
        );
    }
}
