import type { Component } from 'solid-js';

import { createSignal } from "solid-js";
import RecordViewList from '../components/RecordViewList';
import './Dashboard.scss';
import PlayButton from '../assets/play-button.svg';
import PauseButton from '../assets/pause-button.svg';
import NextButton from '../assets/next-button.svg';
import PreviousButton from '../assets/previous-button.svg';

const RecordDashboard: Component = () => {
	const [totalRecorded, setTotalRecorded] = createSignal(0)
    const [earned, setEarned] = createSignal(0)
    const [balance, setBalance] = createSignal(0)
    const [isRecording, setIsRecording] = createSignal(false)

    const onPlay = () => {
        setIsRecording(!isRecording())
    }

	return <div class='content'>
        <div class='left-content'>
            <input class='mturkID' placeholder='Enter your mturk ID to start'></input>
            <div class='record-pane'>
                <div class='record-control'>
                    <img src={isRecording() === false ? PlayButton : PauseButton} width="40" alt='PlayButton SVG' onclick={onPlay}></img>
                    <img src={NextButton} width="40" alt='NextButton SVG'></img>
                    <img src={PreviousButton} width="40" alt='PreviousButton SVG'></img>
                </div>
                <RecordViewList />
            </div>
        </div>
        <div class='right-content'>
            <p>Total Recorded: 1,503</p>
            <p>Earned: $75.15</p>
            <p>Balance: $75.15</p>
            <button class='btn-request-payout'>Request payout</button>
            <span>You need at least $50 balance to request a payout.</span>
        </div>
    </div>;
};

export default RecordDashboard;