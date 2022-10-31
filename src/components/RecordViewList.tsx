import { Component, Suspense, For, onMount, createSignal, createEffect, Show, $DEVCOMP } from "solid-js";

import Pagination from '../components/Pagination';
import type { RecordType } from "../pages/Dashboard";

import Microphone from '../assets/microphone.svg';
import MicrophoneWhite from '../assets/microphone-white.svg';
import PlayButton from '../assets/play-button.svg';
import StopButton from '../assets/stop-button.svg';
import AudioAnimation from '../assets/audio-animation.gif';

import { toMMSS } from "../utils";

export type RecordViewListProps = {
  maxRow: number;
  maxColumn: number;
  setCurrentIndex: (index: number) => void;
  currentIndex: number;
  elapsedTime: number;
  records: RecordType[];
  recordScripts: string[];
  recordStatus: number;
  isDarkMode: boolean;
  setRecordStatus: (status: number) => void;
}

const RecordViewList: Component<RecordViewListProps> = (props: RecordViewListProps) => {
  
  const [getCurrentPage, setCurrentPage] = createSignal(1)
  const [getSubListWidth, setSubListWidth] = createSignal('col-12')
  const [getMaxLength, setMaxLength] = createSignal(0)
  const [getLastPage, setLastPage] = createSignal(0)
  const [getIsPlaying, setIsPlaying] = createSignal(false)
  const [getCurrentRecord, setCurrentRecord] = createSignal<RecordType>()
  const [getPlayingTime, setPlayingTime] = createSignal(0)

  let playingTimerId: number;
  let audio:HTMLAudioElement;

  const setActive = (index: number) => {
    props.setCurrentIndex(index)
  }

  const setWidth = (count: number) => {
    setSubListWidth('w-full w-1/' + count)
  }

  const onPlay = (index: number) => {
    setIsPlaying(true)
    props.setRecordStatus(3)

    playingTimerId = setInterval(() => {
      setPlayingTime(getPlayingTime() + 1);
    }, 1000);

    const audioBlob = props.records.filter(record => record.index === index)[0].data
    const audioUrl = URL.createObjectURL(audioBlob);
    audio = new Audio(audioUrl) as HTMLAudioElement;
    audio.play();
  }

  const onStop = () => {
    setIsPlaying(false)
    props.setRecordStatus(0)
    clearInterval(playingTimerId)
    setPlayingTime(0)
    audio && audio.pause();
  }

  const getFirstRow = (column: number):number => {
    return column * props.maxRow + (getCurrentPage() - 1) * getMaxLength()
  }

  createEffect(() => {
    onStop()
    setCurrentRecord(props.records.filter(record => record.index === props.currentIndex)[0])
  })

  createEffect(() => {
    getPlayingTime() - 1 == getCurrentRecord()?.time && onStop()
  })

  createEffect(() => {
    setWidth(props.maxColumn)
    setMaxLength(props.maxRow * props.maxColumn)
    setCurrentPage(1 + props.currentIndex / getMaxLength() | 0)
    setLastPage(1 + (props.recordScripts.length - 1) / getMaxLength() | 0)
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
                    <div class='record-view dark:text-white dark:bg-slate-800 dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.2)] dark:shadow-[0_6px_20px_0_rgba(255,255,255,0.2)]' classList={{ selected: props.currentIndex === i() + getFirstRow(column) }} onClick={[setActive, i() + getFirstRow(column)]}>
                      <Show when={props.currentIndex === i() + getFirstRow(column) || props.isDarkMode} fallback={<img src={Microphone} width="18" alt='Mircophone SVG'/>}>
                        <img src={MicrophoneWhite} width="18" alt='MicrophoneWhite SVG'/>
                      </Show>
                      <p> {record} </p>
                      <div class="ml-auto flex">
                        <Show when={props.currentIndex === i() + getFirstRow(column)}>
                          <Show when={props.recordStatus === 1 || props.recordStatus === 2}>
                            <h5>{toMMSS(props.elapsedTime)}</h5>
                          </Show>
                          <Show when={getCurrentRecord()}>
                            <Show when={getIsPlaying()}>
                              {toMMSS(getPlayingTime())}/
                            </Show>
                            {(props.recordStatus === 0 || props.recordStatus === 3) && <h5>{toMMSS(getCurrentRecord()!.time)}</h5>}
                            <Show when={!getIsPlaying() && props.recordStatus !== 1}>
                              <img src={PlayButton} width="30" height="30" alt="Playbutton SVG" class="ml-2" onClick={[onPlay, props.currentIndex]}></img>
                            </Show>
                            <Show when={getIsPlaying()}>
                              {/* <img src={AudioAnimation} width="60" height="50" class="max-h-12" alt="AudioAnimation GIF" /> */}
                              <img src={StopButton} width="30" height="30" class="ml-2" alt="StopButton SVG" onClick={onStop}></img>
                            </Show>
                          </Show>
                        </Show>
                      </div>
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