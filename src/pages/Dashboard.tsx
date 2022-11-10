import { onMount, createSignal, Switch, Match, createEffect, For } from 'solid-js';

import RecordViewList from '../components/RecordViewList';
import Camera from '../components/Camera';
import NextButton from '../assets/next-button.svg';
import PreviousButton from '../assets/previous-button.svg';
import { notificationService } from '@hope-ui/solid'
import { makeid, getUrlSearchParam } from '../utils';

export type RecordType = {
    index: number,
    data: Blob
    time: number,
    status: number,
}


export type CameraType = {
    index: number,
    did: string,
    state: boolean,
    label: string,
}

const RecordDashboard = () => {
    // scripts list
    const scripts: String[] = [];
    const scriptIds: number[] = [];
    const CSV_FILE_PATH: string = './name.csv';
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
    let totalCount: number

    // Video Recording
    const [getDeviceFound, setDeviceFound] = createSignal(false)
    const [getRecordingId, setRecordingId] = createSignal('')
    const [getElapsedTime, setElapsedTime] = createSignal(0)
    const [changeData, setChangeData] = createSignal(-1)
    const [getRecordStatus, setRecordStatus] = createSignal(0)

    const [getIsPlaying, setIsPlaying] = createSignal(false)
    let initRecordsData: RecordType[] = [];

    // Camera lists
    const [camera, setCamera] = createSignal<CameraType[]>([]);
    const [currentCamera, setCurrentCamera] = createSignal('-1')
    // if (localStorage.getItem('recordsData') && localStorage.getItem('recordsData')?.trim()){
    //     initRecordsData = JSON.parse(localStorage.getItem('recordsData'));
    // }

    const [getRecords, setRecords] = createSignal<RecordType[]>(initRecordsData)
    const [getMediaRecorder, setMediaRecorder] = createSignal<MediaRecorder>()

    // video preview
    const options = {
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
        mimeType: 'video/webm\;codecs=pcm'
    }

    let chunks: Blob[] = [];
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
            const recordArray: string[] = [];
            for (let i = 1; i < tempArr.length; i++) {
                if (tempArr[i][1]) {
                    recordArray.push(tempArr[i][0])
                    scripts.push(tempArr[i][1])
                    scriptIds.push(tempArr[i][2])
                }
            }
            setRecordScripts(recordArray)
            totalCount = recordArray.length
            const spinner: HTMLElement | null = document.getElementById('spinner')
            spinner?.remove();
        }

        logFileText(CSV_FILE_PATH)
    }

    const getMedia = async () => {
        if (!MediaRecorder.isTypeSupported(options['mimeType'])) options['mimeType'] = "video/ogg; codecs=pcm";
        const devices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();
        const videoDevices: MediaDeviceInfo[] = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length < 1) {
            notificationService.show({
                status: "danger", /* or success, warning, danger */
                title: "Not found any camera device!",
                description: "Please check your camera device. 🤥",
                duration: 3000,
            });
            console.log('No device!!!');
            return;
        }
        let camArr: CameraType[] = [];
        for (let i = 0; i < videoDevices.length; i++) {
            let device: MediaDeviceInfo = videoDevices[i];
            if (i == 0)
                camArr.push({ index: i, 'did': device.deviceId, state: true, 'label': device.label })
            else
                camArr.push({ index: i, 'did': device.deviceId, state: false, 'label': device.label })
        };
        setCamera(camArr)
        setCurrentCamera(camArr.filter(cam => cam.state === true)[0]?.did)
        setTimeout(function () {
            startStream();
        }, 500)
    }

    const startStream = async () => {
        // if (currentCamera() == 'none')
        //     return;
        const updatedConstraints = {
            video: {
                width: {
                    min: 720,
                    ideal: 1080,
                    max: 1440,
                },
                height: {
                    min: 720,
                    ideal: 1080,
                    max: 1440
                },
            },
            audio: true,
            deviceId: {
                exact: currentCamera()
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(updatedConstraints);
            const mediaRecorder: MediaRecorder = new MediaRecorder(stream, options);
            mediaRecorder.ondataavailable = handleOnDataAvailable;
            setMediaRecorder(mediaRecorder);
            setDeviceFound(true);
            handleStream(stream);
        } catch (e) {
            notificationService.show({
                status: "danger", /* or success, warning, danger */
                title: "Not found any audio or camera device!",
                description: "Please check your audio or camera device. 🤥",
                duration: 3000,
            });
        }
    };

    const handleStream = (stream: any) => {
        let video: HTMLElement | any;
        video = document.getElementById('cameraPreview')
        video.srcObject = stream;
        video.play();
    };

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

        const videoBlob: Blob = new Blob(chunks, { type: 'video/webm' });
        setRecords([...getRecords().filter(record => record.index !== getCurrentIndex()), { index: getCurrentIndex(), time: getElapsedTime(), data: videoBlob, status: 4 }])
        localStorage.setItem('recordsData', JSON.stringify(getRecords()))
        // after recording video, move to next automatically 
        onNext()
        compareWithScript(videoBlob)
        // saveBlob(videoBlob, `myRecording.${videoBlob.type.split('/')[1].split(';')[0]}`);
    }

    const compareWithScript = (videoBlob: Blob) => {
        // saveBlob(videoBlob, `myRecording.${videoBlob.type.split('/')[1].split(';')[0]}`);
        let status = 2;
        if (Math.random() < 0.5)
            status = 5;
        let temp_index = recordingStack.shift();
        let data = getRecords().filter(record => record.index === temp_index)[0]
        data.status = status
        setRecordStatus(status)
        setRecords([...getRecords().filter(record => record.index !== temp_index), data])
        localStorage.setItem('recordsData', JSON.stringify(getRecords()))
    }

    const changeCamera = (eve: any) => {
        if (eve.currentTarget.value === 'none') {
            let video: HTMLElement | any
            video = document.getElementById('cameraPreview')
            video.srcObject = null;
            video.play();
            setDeviceFound(false)
            return;
        }
        else {
            setCurrentCamera(camera().filter(cam => cam.did === eve.currentTarget.value)[0]?.did)
        }
        startStream();
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

        setMaxRow((height - 60) / 65 | 0)
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
        <div class='container dark:bg-slate-800 '>
            <div class='record-section grid lx:grid-cols-10 lg:grid-cols-8 md:grid-cols-5 sm:grid-cols-1'>
                <div class='record-pane lx:col-span-8 lg:col-span-6 md:col-span-3 sm:col-span-1'>
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
                        <img src={NextButton} width="32" alt='NextButton SVG' onClick={onNext}></img>
                        <img src={PreviousButton} width="32" alt='PreviousButton SVG' onClick={onPrev}></img>
                    </div>

                    <RecordViewList
                        currentIndex={getCurrentIndex()}
                        setCurrentIndex={setCurrentIndex}
                        maxRow={getMaxRow()}
                        maxColumn={getMaxColumn()}
                        elapsedTime={getElapsedTime()}
                        recordScripts={getRecordScripts()}
                        changeData={changeData()}
                        getIsPlaying={getIsPlaying()}
                        recordStatus={getRecordStatus()}
                        setRecordStatus={setRecordStatus}
                        isDarkMode={getIsDarkMode()}
                        setIsPlaying={setIsPlaying}
                        records={getRecords()}
                    />
                </div>
                <div class='lx:col-span-2 lg:col-span-2 md:col-span-2 sm:col-span-1'>
                    <div class='statistics-section'>
                        <div class='btn-group'>
                            <button class='bg-primary-500 hover:bg-primary-600 btn-request-payout md:w-[150px] lg:w-[150px] xs:w-[100px]'>Payout</button>
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
                        <div class='preview-div'>
                            <div class='camera-section m-1 2xl:h-200 xl:h-64 lg:h-64 md:h-48 sm:h-48 xs:h-48 2xl:w-200 xl:w-64 lg:w-64 md:w-48 sm:w-48 xs:w-48 border-2 border-black-400 dark:text-black-400 '>
                                <video id="cameraPreview" autoplay poster="./poster.png" muted={getIsPlaying() !== true}></video>
                            </div>
                        </div>
                        <div class='m-1'>
                            <select id='camera_list' class='select-camera border-2 border-black-400 dark:text-black-400 hover:bg-black-100 dark:hover:bg-black-700 focus:outline-none  dark:focus:ring-black-700 rounded-lg dark:bg-slate-800 dark:text-white' onChange={changeCamera}>
                                <For each={[...camera().keys()].map((e, i) => i)} fallback={<option value='none'>Not found any device.</option>}>
                                    {(column, i) => (
                                        <Camera
                                            state={camera().filter(record => record.index == i())[0]?.state}
                                            did={camera().filter(record => record.index == i())[0]?.did}
                                            label={camera().filter(record => record.index == i())[0]?.label}>
                                        </Camera>
                                    )}
                                </For>
                            </select>
                        </div>
                        <div class='dark:text-white truncate section-item'><div class='title truncate'>Mturk ID: </div><p class='dark:text-yellow-500 truncate'>{getMturkID()}</p></div>
                        <div class='dark:text-white truncate section-item'><div class='title truncate'>Recorded: </div><p class='dark:text-yellow-500 truncate'>{getTotalRecorded()}</p></div>
                        <div class='dark:text-white truncate section-item'><div class='title truncate'>Earned: </div><p class='dark:text-yellow-500 truncate'>${getEarned()}</p></div>
                        <div class='dark:text-white truncate section-item'><div class='title truncate'>Balance: </div><p class='dark:text-yellow-500 truncate'>${getBalance()}</p></div>
                    </div>
                </div>
            </div>
            {/* <audio class='localAudio' autoplay></audio> */}
        </div>
    );
};

export default RecordDashboard;