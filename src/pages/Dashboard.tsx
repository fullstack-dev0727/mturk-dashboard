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
    const CSV_FILE_PATH = './name.csv';
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
    if (localStorage.getItem('recordsData') && localStorage.getItem('recordsData')?.trim()){
        initRecordsData = JSON.parse(localStorage.getItem('recordsData'));
    }

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
            video: false,
            audio: true
        };
        const options = {
            audioBitsPerSecond: 128000,
            videoBitsPerSecond: 2500000,
            mimeType: 'audio/webm\;codecs=opus'
        }

        if (!MediaRecorder.isTypeSupported(options['mimeType'])) options['mimeType'] = "audio/ogg; codecs=opus";

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
                if (getMediaRecorder()?.state === 'recording'){
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

        setMaxRow((height - 300) / 75 | 0)

        if (width > 3500) setMaxColumn(6)
        if (width < 3500 && width > 2500) setMaxColumn(5)
        if (width < 2560 && width > 1700) setMaxColumn(4)
        if (width < 1700 && width > 1350) setMaxColumn(3)
        if (width < 1350 && width > 1000) setMaxColumn(2)
        if (width < 1000) setMaxColumn(1)
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
            <div class='btn-theme'>
                <button
                    id="theme-toggle"
                    type="button"
                    class="text-black-500 border-2 border-black-400 dark:text-black-400 hover:bg-black-100 dark:hover:bg-black-700 focus:outline-none  dark:focus:ring-black-700 rounded-lg text-sm p-2.5"
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
            </div>
            <button class='bg-primary-500 hover:bg-primary-600 btn-request-payout'>Payout</button>
            <div class='statistics-section grid grid-cols-1 md:grid-cols-2 gap-1 lg:grid-cols-2 lx:grid-cols-4'>
                <span class='dark:text-white '>Mturk ID: <p class='dark:text-yellow-500'>{getMturkID()}</p></span>
                <span class='dark:text-white min-w-260'>Total Recorded: <p class='dark:text-yellow-500'>{getTotalRecorded()}</p></span>
                <span class='dark:text-white min-w-260'>Earned: <p class='dark:text-yellow-500'>${getEarned()}</p></span>
                <span class='dark:text-white min-w-260'>Balance: <p class='dark:text-yellow-500'>${getBalance()}</p></span>
            </div>
            <div class='record-section'>
                <div class='record-pane'>
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
            </div>
            <audio class='localAudio' autoplay></audio>
        </div>
    );
};

export default RecordDashboard;