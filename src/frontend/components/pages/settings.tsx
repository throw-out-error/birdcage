import { h, Component } from "preact";
import { Settings } from "../settings";
import { store } from "../utils";

export interface SettingsPageProps {
    color: string;
    bgtag: string;
    toggleSettings(): void;
    onChangeColor(newColor: string): void;
    onChangeBg(bgtag: string): void;
}

export class SettingsPage extends Component<SettingsPageProps> {
    render() {
        return (
            <div className={store.getState().authed ? "overlay" : "hidden"}>
                <Settings
                    onClose={
                        this.props.toggleSettings
                            ? this.props.toggleSettings.bind(this)
                            : () => null
                    }
                    color={this.props.color}
                    onChangeColor={
                        this.props.onChangeColor
                            ? this.props.onChangeColor.bind(this)
                            : () => null
                    }
                    bgtag={this.props.bgtag}
                    onChangeBg={
                        this.props.onChangeBg
                            ? this.props.onChangeBg.bind(this)
                            : () => null
                    }
                />
            </div>
        );
    }
}
