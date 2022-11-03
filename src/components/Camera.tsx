import { splitProps, JSX, Show, For, Component } from 'solid-js';

export type CameraProps = JSX.HTMLAttributes<HTMLAnchorElement> & {
    state?: boolean;
    did?: string;
    label?: string;
};

const Camera: Component<CameraProps> = (props: CameraProps) => {

    return (
        <option value={props.did}>{props.label}</option>
    );
}

export default Camera;