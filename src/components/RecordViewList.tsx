import { Component, Suspense, For, onMount, createSignal, createEffect, Show, $DEVCOMP, Switch, Match } from "solid-js";

import Pagination from '../components/Pagination';
import type { RecordType } from "../pages/Dashboard";
import CustomModal from './Modal';

import Microphone from '../assets/microphone.svg';
import MicrophonePending from '../assets/microphone-pending.svg';
import MicrophoneSuccess from '../assets/microphone-success.svg';
import MicrophoneError from '../assets/microphone-error.svg';
import MicrophoneWhite from '../assets/microphone-white.svg';
import PlayButton from '../assets/play-button.svg';
import StopButton from '../assets/stop-button.svg';
import AudioAnimation from '../assets/audio-animation.gif';
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Button,
  createDisclosure,
} from "@hope-ui/solid"
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
  changeData: number;
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
  const [openModal, setOpenModal] = createSignal(false);
  const [modalShow, setModalShow] = createSignal(false);

  const { isOpen, onOpen } = createDisclosure()
  let playingTimerId: number;
  let video: HTMLMediaElement;

  const setActive = (index: number) => {
    props.setCurrentIndex(index)
    props.setRecordStatus(0)
  }

  const setWidth = (count: number) => {
    setSubListWidth('w-full w-1/' + count)
  }

  const onPlay = (index: number) => {
    setIsPlaying(true);
    setModalShow(true);
    props.setRecordStatus(3)

    playingTimerId = setInterval(() => {
      setPlayingTime(getPlayingTime() + 1);
    }, 1000);

    const videoBlob = props.records.filter(record => record.index === index)[0].data

    const videoUrl = URL.createObjectURL(videoBlob);
    video = document.getElementById('modal-video');

    video.src = videoUrl;
    video.play();
  }

  const onClose = () => {

  }
  const onStop = () => {
    setModalShow(false);
    setIsPlaying(false);
    props.setRecordStatus(0)
    clearInterval(playingTimerId)
    setPlayingTime(0)
    video && video.pause();
  }

  const getFirstRow = (column: number): number => {
    return column * props.maxRow + (getCurrentPage() - 1) * getMaxLength()
  }

  createEffect(() => {
    onStop()
    setCurrentRecord(props.records.filter(record => record.index === props.currentIndex)[0])
  })


  createEffect(() => {
    // getPlayingTime() - 1 == getCurrentRecord()?.time && onStop()
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
                  {(record, i) => (record &&
                    <div class='record-view dark:text-white dark:bg-slate-800 dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.2)] dark:shadow-[0_6px_20px_0_rgba(255,255,255,0.2)] animate-[wiggle_1s_ease-in-out_infinite]' classList={{ selected: props.currentIndex === i() + getFirstRow(column) }} onClick={[setActive, i() + getFirstRow(column)]}>
                      <Switch fallback={<img src={Microphone} width="18" alt='MicrophoneWhite SVG' />}>
                        <Match when={props.records.filter(record => record.index === i() + getFirstRow(column))[0]?.status === 4}>
                          <img src={MicrophonePending} width="18" alt='MicrophoneWhite SVG' />
                        </Match>
                        <Match when={props.records.filter(record => record.index === i() + getFirstRow(column))[0]?.status === 5}>
                          <img src={MicrophoneError} width="18" alt='MicrophoneWhite SVG' />
                        </Match>
                        <Match when={props.records.filter(record => record.index === i() + getFirstRow(column))[0]?.status === 2}>
                          <img src={MicrophoneSuccess} width="18" alt='MicrophoneWhite SVG' />
                        </Match>
                        <Match when={props.currentIndex === i() + getFirstRow(column) || props.isDarkMode}>
                          <img src={MicrophoneWhite} width="18" alt='MicrophoneWhite SVG' />
                        </Match>
                      </Switch>
                      <p> {record} </p>
                      <div class="ml-auto flex">
                        <Show when={(props.records.filter(record => record.index === i() + getFirstRow(column))[0]?.status === 2 || props.records.filter(record => record.index === i() + getFirstRow(column))[0]?.status === 4 || props.records.filter(record => record.index === i() + getFirstRow(column))[0]?.status === 5) && (props.currentIndex !== i() + getFirstRow(column))}>
                          <h5>{toMMSS(props.records.filter(record => record.index === i() + getFirstRow(column))[0]?.time)}</h5>
                        </Show>
                        <Show when={props.currentIndex === i() + getFirstRow(column)}>
                          <Show when={props.recordStatus === 1 || props.recordStatus === 2}>
                            <h5>{toMMSS(props.elapsedTime)}</h5>
                          </Show>
                          <Show when={getCurrentRecord()}>
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
        <Modal centered size="2xl" opened={modalShow()} onClose={onStop}>
          <ModalOverlay />
          <ModalContent>
            <ModalBody>
              <video controls class='border-2 border-black-400 dark:text-black-400 hover:bg-black-100 dark:hover:bg-black-700 focus:outline-none  dark:focus:ring-black-700 dark:bg-slate-800 rounded-lg' id='modal-video' poster="./poster.png"></video>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Suspense>
    </div>
  );
};

export default RecordViewList;