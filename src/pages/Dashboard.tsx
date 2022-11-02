import { onMount, Show, createSignal, Switch, Match, createEffect } from 'solid-js';

import RecordViewList from '../components/RecordViewList';
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import NextButton from '../assets/next-button.svg';
import PreviousButton from '../assets/previous-button.svg';

import { makeid, getUrlSearchParam } from '../utils';

export type RecordType = {
    index: number,
    data: Blob
    time: number,
    status: number,
}

const RecordDashboard = () => {
    // scripts list
    const scripts = [];
    const scriptIds = [];
    const CSV_FILE_PATH = './src/assets/name.csv';
    const recordingStack: number[] = [];
    // Statistics
    const [getMturkID, setMturkID] = createSignal('a23AD2e')
    const [getTotalRecorded, setTotalRecorded] = createSignal(1503)
    const [getEarned, setEarned] = createSignal(75.15)
    const [getBalance, setBalance] = createSignal(75.15)
    const [getIsDarkMode, setIsDarkMode] = createSignal(false)

    // Record Views
    const [getRecordScripts, setRecordScripts] = createSignal<string[]>([])
    const [getCurrentIndex, setCurrentIndex] = createSignal(0)
    const [getMaxRow, setMaxRow] = createSignal(7)
    const [getMaxColumn, setMaxColumn] = createSignal(4)
    let totalCount = 100

    // Audio Recording
    const [getDeviceFound, setDeviceFound] = createSignal(false)
    const [getRecordingId, setRecordingId] = createSignal('')
    const [getElapsedTime, setElapsedTime] = createSignal(0)
    const [changeData, setChangeData] = createSignal(-1)
    const [getRecordStatus, setRecordStatus] = createSignal(0)
    let initRecordsData: RecordType[] = [];
    // if (localStorage.getItem('recordsData') && localStorage.getItem('recordsData')?.trim()){
    //     initRecordsData = JSON.parse(localStorage.getItem('recordsData'));
    // }

    const [getRecords, setRecords] = createSignal<RecordType[]>(initRecordsData)
    const [getMediaRecorder, setMediaRecorder] = createSignal<MediaRecorder>()

    let chunks: Blob[] = [];
    let localAudio: HTMLAudioElement;
    let recordingTimerId: number;

    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'dark') {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true)

        }
        else {
            document.documentElement.classList.add('light');
            setIsDarkMode(false)
        }
    }
    const getDataWithAPI = () => {

        const logFileText = async (file: RequestInfo | URL) => {
            const response = await fetch(file)
            const text = await response.text()
            const parseCSV = (text: string) => {
                const lines = text.split('\n');
                const output: never[][] = [];

                lines.forEach(line => {
                    line = line.trim();

                    if (line.length === 0) return;

                    const skipIndexes: any = {};
                    const columns = line.split(',');

                    output.push(columns.reduce((result: any, item: any, index) => {
                        if (skipIndexes[index]) return result;

                        if (item.startsWith('"') && !item.endsWith('"')) {
                            while (!columns[index + 1].endsWith('"')) {
                                index++;
                                item += `,${columns[index]}`;
                                skipIndexes[index] = true;
                            }

                            index++;
                            skipIndexes[index] = true;
                            item += `,${columns[index]}`;
                        }

                        result.push(item);
                        return result;
                    }, []));
                });

                return output;
            };

            let tempArr = parseCSV(text)
            const recordArray: any = [];
            for (let i = 1; i < tempArr.length; i++) {
                if (tempArr[i][1]) {
                    recordArray.push(tempArr[i][0])
                    scripts.push(tempArr[i][1])
                    scriptIds.push(tempArr[i][2])
                }
            }
            setRecordScripts(recordArray)
        }

        logFileText(CSV_FILE_PATH)
    }

    const getMedia = async () => {
        const constraints = {
            video: {  width: 1280, height: 720 },
            audio: true
        };
        const options = {
            audioBitsPerSecond: 128000,
            videoBitsPerSecond: 2500000,
            mimeType: 'video/webm\;codecs=opus'
        }

        if (!MediaRecorder.isTypeSupported(options['mimeType'])) options['mimeType'] = "video/ogg; codecs=opus";
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        const mediaRecorder: MediaRecorder = new MediaRecorder(mediaStream, options);
        mediaRecorder.ondataavailable = handleOnDataAvailable;
        setMediaRecorder(mediaRecorder)

        setDeviceFound(true);
    }

    const handleOnDataAvailable = ({ data }: any) => {
        if (data.size > 0) {
            chunks.push(data);
        }
    }

    const saveBlob = (blob: Blob, fileName: string) => {
        var a: HTMLAnchorElement = document.createElement("a");
        document.body.appendChild(a);

        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    const onRecord = () => {
        if (!getDeviceFound())
            return;
        recordingTimerId && clearInterval(recordingTimerId)
        setElapsedTime(0)
        setRecordStatus(1);
        setChangeData(getCurrentIndex())
        recordingTimerId = setInterval(() => {
            setElapsedTime(getElapsedTime() + 1);
            if (changeData() !== getCurrentIndex()) {
                clearInterval(recordingTimerId)
                if (getMediaRecorder()?.state === 'recording') {
                    getMediaRecorder()?.stop()
                }
            }
        }, 1000);
        getMediaRecorder()?.start(1000);
    }

    const onSave = () => {
        getMediaRecorder()?.stop();
        recordingStack.push(getCurrentIndex())
        clearInterval(recordingTimerId);
        setRecordStatus(4)

        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setRecords([...getRecords().filter(record => record.index !== getCurrentIndex()), { index: getCurrentIndex(), time: getElapsedTime(), data: audioBlob, status: 4 }])
        localStorage.setItem('recordsData', JSON.stringify(getRecords()))
        // after recording audio, move to next automatically 
        onNext()
        compareWithScript(audioBlob)
        // saveBlob(audioBlob, `myRecording.${audioBlob.type.split('/')[1].split(';')[0]}`);
    }

    const compareWithScript = (audioBlob: Blob) => {
        // saveBlob(audioBlob, `myRecording.${audioBlob.type.split('/')[1].split(';')[0]}`);
        let status = 2;
        if (Math.random() < 0.5)
            status = 5;
        let temp_index = recordingStack.shift();
        let data = getRecords().filter(record => record.index === temp_index)[0]
        data.status = status
        setRecordStatus(status)
        setRecords([...getRecords().filter(record => record.index !== temp_index), data])
        console.log(getRecords())
        localStorage.setItem('recordsData', JSON.stringify(getRecords()))
    }

    const onNext = () => {
        getCurrentIndex() < totalCount - 1 && setCurrentIndex(getCurrentIndex() + 1)
    }

    const onPrev = () => {
        getCurrentIndex() > 0 && setCurrentIndex(getCurrentIndex() - 1)
    }

    const onDarkModeToggle = () => {
        type SvgInHtml = HTMLElement & SVGElement;

        var themeToggleDarkIcon: SvgInHtml = document.getElementById('theme-toggle-dark-icon') as SvgInHtml;
        var themeToggleLightIcon: SvgInHtml = document.getElementById('theme-toggle-light-icon') as SvgInHtml;

        // Change the icons inside the button based on previous settings
        if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            themeToggleLightIcon.classList.remove('hidden');
        } else {
            themeToggleDarkIcon.classList.remove('hidden');
        }

        var themeToggleBtn: HTMLButtonElement = document.getElementById('theme-toggle') as HTMLButtonElement;
        themeToggleBtn.addEventListener('click', function () {
            // toggle icons inside button
            themeToggleDarkIcon.classList.toggle('hidden');
            themeToggleLightIcon.classList.toggle('hidden');

            // if set via local storage previously
            if (localStorage.getItem('color-theme')) {
                if (localStorage.getItem('color-theme') === 'light') {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                    setIsDarkMode(true)
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                    setIsDarkMode(false)
                }

                // if NOT set via local storage previously
            } else {
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                    setIsDarkMode(false)
                } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                    setIsDarkMode(true)
                }
            }
        });
    }


    const setMaxRowAndColumn = () => {
        const width = document.documentElement.clientWidth
        const height = document.documentElement.clientHeight

        setMaxRow((height - 120) / 75 | 0)
        if (width > 3000) setMaxColumn(6)
        if (width > 2400 && width >= 3000) setMaxColumn(5)
        if (width > 2000 && width >= 2400) setMaxColumn(4)
        if (width <= 2000 && width > 1500) setMaxColumn(3)
        if (width <= 1500 && width > 1100) setMaxColumn(2)
        if (width <= 1100) setMaxColumn(1)
    }

    window.addEventListener('resize', function () {
        setMaxRowAndColumn()
    }, true)

    createEffect(() => {
        setMturkID(getUrlSearchParam('mturkID'))
        clearInterval(recordingTimerId);
    })

    createEffect((prev) => {
        setElapsedTime(0)
        setRecordStatus(0)
        if (getMediaRecorder()?.state === 'recording')
            getMediaRecorder()?.stop();
    }, getCurrentIndex())


    onMount(() => {
        getDataWithAPI()
        setMaxRowAndColumn()
        onDarkModeToggle()
        setRecordingId(makeid(30));
        getMedia();
    })

    return (
        <div class='container dark:bg-slate-800'>
            <div class='record-section grid lx:grid-cols-5 lg:grid-cols-5 md:grid-cols-5 sm:grid-cols-1'>
                <div class='record-pane lx:col-span-3 lg:col-span-3 md:col-span-3 sm:col-span-1'>
                    <div class='record-control dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.2)] dark:shadow-[0_6px_20px_0_rgba(255,255,255,0.2)]'>
                        <Switch>
                            <Match when={getRecordStatus() === 1}>
                                <button class='w-8' onClick={onSave}>
                                    <svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 100 100">
                                        <circle style="fill:#ffffff;" cx="50" cy="50" r="50" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#d92176" stroke-width="20" stroke-miterlimit="10" />
                                        <circle cx="50" cy="50" r="21" fill="#d92176" />
                                    </svg>
                                </button>
                            </Match>
                            <Match when={getRecordStatus() !== 1}>
                                <button class='w-8' classList={{ disabled: getRecordStatus() === 3 }} onClick={onRecord}>
                                    <svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 100 100">
                                        <circle style="fill:#ffffff;" cx="50" cy="50" r="50" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#007bff" stroke-width="20" stroke-miterlimit="10" />
                                        <circle cx="50" cy="50" r="21" fill="#007bff" />
                                    </svg>
                                </button>
                            </Match>
                        </Switch>
                        <img src={NextButton} width="40" alt='NextButton SVG' onClick={onNext}></img>
                        <img src={PreviousButton} width="40" alt='PreviousButton SVG' onClick={onPrev}></img>
                    </div>

                    <RecordViewList
                        currentIndex={getCurrentIndex()}
                        setCurrentIndex={setCurrentIndex}
                        maxRow={getMaxRow()}
                        maxColumn={getMaxColumn()}
                        elapsedTime={getElapsedTime()}
                        recordScripts={getRecordScripts()}
                        changeData={changeData()}
                        recordStatus={getRecordStatus()}
                        setRecordStatus={setRecordStatus}
                        isDarkMode={getIsDarkMode()}
                        records={getRecords()}
                    />
                </div>
                <div class='lx:col-span-2 lg:col-span-2 md:col-span-2 sm:col-span-1'>
                    <div class='statistics-section'>
                        <button class='bg-primary-500 hover:bg-primary-600 btn-request-payout md:w-[150px] lg:w-[200px] xs:w-[100px]'>Payout</button>
                        <button
                            id="theme-toggle"
                            type="button"
                            class="text-black-500 border-1 border-black-400 dark:text-black-400 hover:bg-black-100 dark:hover:bg-black-700 focus:outline-none  dark:focus:ring-black-700 rounded-lg text-sm p-2.5"
                        >
                            <svg
                                id="theme-toggle-dark-icon"
                                class="w-5 h-5 hidden"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                                ></path>
                            </svg>
                            <svg
                                id="theme-toggle-light-icon"
                                class="w-5 h-5 hidden"
                                fill="yellow"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                ></path>
                            </svg>
                        </button>
                        <div class='camera-section m-1 2xl:h-200 xl:h-64 lg:h-48 md:h-36 sm:h-24 xs:h-12 2xl:w-200 xl:w-64 lg:w-48 md:w-36 sm:w-24 xs:w-12 border-2 border-black-400 dark:text-black-400 '>
                            <video id="cameraPreview"></video>
                        </div>
                        <div class='dark:text-white truncate '><div class='title truncate'>Mturk ID: </div><p class='dark:text-yellow-500 truncate'>{getMturkID()}</p></div>
                        <div class='dark:text-white truncate '><div class='title truncate'>Total Recorded: </div><p class='dark:text-yellow-500 truncate'>{getTotalRecorded()}</p></div>
                        <div class='dark:text-white truncate '><div class='title truncate'>Earned: </div><p class='dark:text-yellow-500 truncate'>${getEarned()}</p></div>
                        <div class='dark:text-white truncate '><div class='title truncate'>Balance: </div><p class='dark:text-yellow-500 truncate'>${getBalance()}</p></div>
                    </div>
                </div>
            </div>
            <audio class='localAudio' autoplay></audio>
        </div>
    );
};

export default RecordDashboard;