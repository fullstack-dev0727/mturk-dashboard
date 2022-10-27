import { createEffect, createSignal, onMount, Show } from 'solid-js';
import Microphone from '../assets/microphone.svg';
import MicrophoneWhite from '../assets/microphone-white.svg';
import './RecordView.scss';

const RecordView = (props: {index: number, textcontent: string}) => {

    const [selectedIndex, setSelectedIndex] = createSignal(0)
    const handleOnClick = () => {
        setSelectedIndex(props.index)
        console.log(selectedIndex())
    }

	return (
        <div class='record-view' classList={{selected: selectedIndex() === props.index}} onclick={handleOnClick}>
            <img src={selectedIndex() === props.index ? MicrophoneWhite : Microphone} width="18" alt='Mircophone SVG'></img>
            <p> {props.textcontent} </p>
        </div>
    );
};

export default RecordView;