import { h, Component } from "preact";
import { Settings } from "../settings";

export interface SettingsPageProps {
    settings: boolean;
    color: string;
    bgtag: string;
    toggleSettings(): void;
    onChangeColor(newColor: string): void;
    onChangeBg(bgtag: string): void;
}

export class SettingsPage extends Component<SettingsPageProps> {
    render() {
        return (
            <div className={this.props.settings ? "overlay" : "hidden"}>
                <Settings
                    onClose={this.props.toggleSettings.bind(this)}
                    color={this.props.color}
                    onChangeColor={this.props.onChangeColor.bind(this)}
                    bgtag={this.props.bgtag}
                    onChangeBg={this.props.onChangeBg.bind(this)}
                />
            </div>
        );
    }
}
