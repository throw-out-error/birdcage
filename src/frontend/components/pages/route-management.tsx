import { h, Component, RenderableProps, RefObject } from "preact";
import { Routes } from "../routes";
import { Denied } from "../denied";
import { store } from "../utils";

export class RouteManagementPage extends Component {
    routes?: RefObject<Routes>;

    onAuth(): void {
        this.routes?.current?.loadRoutes();
    }

    render() {
        if (!store.getState().authed) return <Denied />;
        return (
            <div>
                <Routes path="/routes" ref={this.routes} />
            </div>
        );
    }
}
