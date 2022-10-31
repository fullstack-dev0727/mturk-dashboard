import { Component, Suspense, For, onMount, createSignal, createEffect, Show, $DEVCOMP } from "solid-js";

import Pagination from '../components/Pagination';
import type { RecordType } from "../pages/Dashboard";

import Microphone from '../assets/microphone.svg';
import MicrophoneWhite from '../assets/microphone-white.svg';
import PlayButton from '../assets/play-button.svg';
import PauseButton from '../assets/pause-button.svg';
import AudioAnimation from '../assets/audio-animation.gif';

import { toHHMMSS } from "../utils";

export type RecordViewListProps = {
  maxRow: number;
  maxColumn: number;
  setCurrentIndex: (index: number) => void;
  currentIndex: number;
  elapsedTime: number;
  records: RecordType[];
  recordScripts: string[];
  recordStatus: number;
  setRecordStatus: (status: number) => void;
}

const RecordViewList: Component<RecordViewListProps> = (props: RecordViewListProps) => {
  
  const [getCurrentPage, setCurrentPage] = createSignal(1)
  const [getSubListWidth, setSubListWidth] = createSignal('col-12')
  const [getMaxLength, setMaxLength] = createSignal(0)
  const [getLastPage, setLastPage] = createSignal(0)
  const [getIsPlaying, setIsPlaying] = createSignal(false)

  var audio:HTMLAudioElement;

  const setActive = (index: number) => {
    props.setCurrentIndex(index)
  }

  const setWidth = (count: number) => {
    setSubListWidth('w-full w-1/' + count)
  }

  const onPlay = (index: number) => {
    setIsPlaying(true)
    props.setRecordStatus(3)
    const audioBlob = props.records.filter(record => record.index === index)[0].data
    console.log(audioBlob)
    const audioUrl = URL.createObjectURL(audioBlob);
    audio = new Audio(audioUrl) as HTMLAudioElement;
    audio.play();
  }

  const onPause = () => {
    setIsPlaying(false)
    props.setRecordStatus(0)
    audio && audio.pause();
  }

  const getFirstRow = (column: number):number => {
    return column * props.maxRow + (getCurrentPage() - 1) * getMaxLength()
  }

  createEffect(() => {
    console.log(props.currentIndex)
    onPause()
  })

  createEffect(() => {
    setWidth(props.maxColumn)
    setMaxLength(props.maxRow * props.maxColumn)
    setCurrentPage(1 + props.currentIndex / getMaxLength() | 0)
    setLastPage(1 + props.recordScripts.length / getMaxLength() | 0)
  })

  return (
    <div class="record-content">
      <Suspense fallback={<div class="record-preview">Loading records...</div>}>
        <div class="record-view-list">
          <For
            each={Array(props.maxColumn).fill(0).map((e, i) => i)}
            fallback={<div class="record-preview">No records are here... yet.</div>}
          >
            {(column) => (
              <div class={"record-view-sublist " + getSubListWidth()}>
                <For
                  each={[...Array(props.maxRow).keys()].map(i => props.recordScripts[i + getFirstRow(column)])}
                >
                  {(record, i) => ( record &&
                    <div class='record-view dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.2)] dark:shadow-[0_6px_20px_0_rgba(255,255,255,0.2)]' classList={{ selected: props.currentIndex === i() + getFirstRow(column) }} onClick={[setActive, i() + getFirstRow(column)]}>
                      <Show when={props.currentIndex === i() + getFirstRow(column)} fallback={<img src={Microphone} width="18" alt='Mircophone SVG'/>}>
                        <img src={MicrophoneWhite} width="18" alt='MicrophoneWhite SVG'/>
                      </Show>
                      <p> {record} </p>
                      <Show when={props.currentIndex === i() + getFirstRow(column)}>
                        <Show when={props.recordStatus === 1 || props.recordStatus === 2}>
                          <h5>{toHHMMSS(props.elapsedTime)}</h5>
                        </Show>
                        <Show when={props.records.filter(record => record.index === props.currentIndex).length !== 0}>
                          <Show when={!getIsPlaying() && props.recordStatus !== 1}>
                            <img src={PlayButton} width="30" height="30" alt="Playbutton SVG" class="ml-2" onClick={[onPlay, props.currentIndex]}></img>
                          </Show>
                          <Show when={getIsPlaying()}>
                            <img src={AudioAnimation} width="100" height="50" class="max-h-12" alt="AudioAnimation GIF" />
                            <img src={PauseButton} width="30" height="30" class="ml-2" alt="Pausebutton SVG" onClick={onPause}></img>
                          </Show>
                        </Show>
                      </Show>
                      
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
        <Pagination
          currentPage={getCurrentPage()}
          lastPage={getLastPage()}
          setCurrentPage={setCurrentPage}
        />
      </Suspense>
    </div>
  );
};

export default RecordViewList;