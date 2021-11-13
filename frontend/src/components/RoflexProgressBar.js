import {clamp} from "lodash";
import './RoflexProgressBar.css';

function RoflexProgressBar(props) {
    const width = clamp((props.progress ?? 0) * 100, 0, 100);
    const text = props.text ?? '';
    return (
        <div className="progress progress-striped active" style={{width: `${props.width}px`}}>
            <div role="progressbar" style={{width: `${width}%`}} className="progress-bar progress-bar-danger">
                <span>{text}</span>
            </div>
        </div>
    )
}

export default RoflexProgressBar;