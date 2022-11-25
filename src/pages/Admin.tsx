import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import axios from "axios";
import { Button, Input, InputGroup, InputLeftElement, InputRightElement, Modal, ModalBody, ModalContent, ModalOverlay, notificationService, Table, TableCaption, Tbody, Td, Tfoot, Th, Thead, Tooltip, Tr } from '@hope-ui/solid'
import { SetPaymentURL, GetAllUsersData } from '../utils/Url';
import Pagination from '../components/Pagination';
import settingImage from '../assets/settings.svg';
import settingWhiteImage from '../assets/settings-white.svg';

type UserField = {
    id: number,
    mturk_id: string,
    paypal: string,
    total_records: number,
    total_payment: number,
    password: string,
    balance: number,
}
const itemShowCount = 10;
const pricePerRecord = 0.03;
const AdminPanel = () => {
    const [loading, setLoading] = createSignal(false)
    const [getIsDarkMode, setIsDarkMode] = createSignal(false)
    const [pageNum, setPageNum] = createSignal(1)
    const [firstIndex, setFirstIndex] = createSignal(0)
    const [lastIndex, setLastIndex] = createSignal(itemShowCount - 1)
    createEffect(() => {
        setFirstIndex((pageNum() - 1) * itemShowCount)
        setLastIndex(pageNum() * itemShowCount)
    }, [pageNum()])
    const [lastPage, setLastPage] = createSignal(1)
    const [userDatas, setUserDatas] = createSignal<UserField[]>([])
    const [getPayment, setPayment] = createSignal(0)
    const [getMturkID, setMturkID] = createSignal('a23AD2e')

    const [selectedUser, setSelectedUser] = createSignal<UserField>({
        id: 0,
        mturk_id: '',
        paypal: '',
        total_records: 0,
        total_payment: 0,
        password: '',
        balance: 0,
    })
    let totalData: UserField[] = [];
    createEffect(() => {
        setLastPage(1 + (userDatas().length - 1) / itemShowCount | 0)
    }, [userDatas()])

    const getInitData = () => {
        setLoading(true)
        axios
            .post(GetAllUsersData, {
            })
            .then((response) => {
                if (response.data.code == 200) {
                    let datas = response.data.result.sort(SortUserData)
                    datas.map((element: UserField, i: number) => {
                        element.id = i + 1
                        element.balance = element.total_records * pricePerRecord - element.total_payment / 100
                    });
                    setUserDatas(datas)
                    totalData = datas
                    setLastPage(1 + (response.data.result.length - 1) / itemShowCount | 0)
                }
                else {
                    notificationService.show({
                        status: "danger", /* or success, warning, danger */
                        title: response.data.result.error,
                        description: "Please retry! 🤥",
                        duration: 1500,
                    });
                }
                setLoading(false)
            })
            .catch((error) => {
                setLoading(false)
                notificationService.show({
                    status: "danger", /* or success, warning, danger */
                    title: "Connection error!",
                    description: "Refresh the page! 🤥",
                    duration: 1500,
                });
            });
    }

    const SortUserData = (a: UserField, b: UserField) => {
        return a.mturk_id > b.mturk_id ? 1 : -1
    }

    const enterKeyCode = 13
    const paymentKeyDown = (event: any) => {
        if (getMturkID() && event.keyCode == enterKeyCode) {
            savePayment()
        }
    }
    
    const paymentInputChange = (event: any) => {
        if (event.currentTarget.value == '')
            return;
        let temp: number = selectedUser()?.balance - parseFloat(event.currentTarget.value)
        setUserBalance(parseFloat(temp.toFixed(2)))
        setPayment(parseFloat(event.currentTarget.value))
    }
    const [onLoading, setOnLoading] = createSignal(false)
   
    onMount(() => {
        getInitData()
    })
    const [showModal, setShowModal] = createSignal(false)
    const [getUserBalance, setUserBalance] = createSignal(0)
    const editPayment = (userdata: UserField) => {
        if (userdata.paypal === '') {
            notificationService.show({
                status: "warning", /* or success, warning, danger */
                title: 'That user has no payment account.',
                duration: 1500,
            });
        }
        else {
            setSelectedUser(userdata)
            setUserBalance(userdata.balance)
            setTimeout(() => { document.getElementById('paymentInput')?.focus(); setPayment(userdata.balance) }, 300)
            setShowModal(true)
            setMturkID(userdata.mturk_id)
        }
    }

    const onStop = () => {
        setOnLoading(false)
        setShowModal(false);
    }

    const savePayment = () => {
        setOnLoading(true)
        console.log(getPayment())
        axios
            .post(SetPaymentURL, {
                mturk_id: getMturkID(),
                payment_amount: getPayment() * 100 // convert cent
            })
            .then((response) => {
                if (response.data.code == 200) {
                    notificationService.show({
                        status: "success", /* or success, warning, danger */
                        title: 'Successfully updated.',
                        duration: 1500,
                    });
                    let item = userDatas().filter((item) => item.mturk_id === getMturkID())[0]
                    item.total_payment = parseFloat((item.total_payment + getPayment() * 100).toFixed(2))
                    item.balance = parseFloat((item.balance - getPayment()).toFixed(2))
                    let datas = [...userDatas().filter((item) => item.mturk_id !== getMturkID()), item].sort(SortUserData)
                    setUserDatas(datas)
                    totalData = [...totalData.filter((item) => item.mturk_id !== getMturkID()), item].sort(SortUserData)
                    setShowModal(false)
                }
                else {
                    notificationService.show({
                        status: "danger", /* or success, warning, danger */
                        title: response.data.result.error,
                        description: "Please retry! 🤥",
                        duration: 1500,
                    });
                }
                setOnLoading(false)
            })
            .catch((error) => {
                setOnLoading(false)
                notificationService.show({
                    status: "danger", /* or success, warning, danger */
                    title: "Connection error!",
                    description: "Refresh the page! 🤥",
                    duration: 1500,
                });
            });
    }

    const [showSettingModal, setShowSettingModal] = createSignal(false)

    const searchUser = (event: any) => {
        if (event.keyCode == enterKeyCode) {
            let datas = []
            if (event.currentTarget.value == '') {
                datas = totalData
            }
            else {
                datas = totalData.filter((item) => item.mturk_id.indexOf(event.currentTarget.value) != -1)
            }
            setUserDatas(datas.sort(SortUserData))
        }
    }

    const goFistPage = () => {
        window.location.replace("/")
    }

    return (
        <div class="container">
            <div class="admin-header">
                <span class="admin-title" onClick={goFistPage}>Bhuman</span>
                {/* <button class='bg-primary-500 hover:bg-primary-600 btn-setting dark:#1e293b' onclick={() => setShowSettingModal(true)}>
                    <img class='border-whtite-400 border-2 rounded-lg p-2.5' src={getIsDarkMode() ? settingImage : settingWhiteImage}></img>
                </button>
                <button
                    id="theme-toggle"
                    type="button"
                    class="text-black-500 border-2 border-black-400 dark:text-black-400 hover:bg-black-100 dark:hover:bg-black-700 focus:outline-none  dark:focus:ring-black-700 rounded-lg text-sm p-2.5 admin-toggle-button"
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
                </button> */}
            </div>
            <div class="admin-body">
                <InputGroup>
                    <InputLeftElement
                        pointerEvents="none"
                        color="$neutral8"
                        fontSize="1.2em"
                    >
                        <svg role="status" class="inline mr-2 ml-2 w-6 h-6 text-black animate-spin" viewBox="0 0 100 101" fill="yellow" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                        </svg>
                    </InputLeftElement>
                    <Input id="searchInput" placeholder="Search by mturk_id" class="rounded-lg" onKeyDown={searchUser} />
                    <InputRightElement pointerEvents="none" style={{ 'width': '120px' }}>
                        <span class="color-primary">{userDatas().length == 0 ? 'No Mturk User' : (userDatas().length + ' Mturk ' + (userDatas().length == 1 ? "User" : 'Users'))}</span>
                    </InputRightElement>
                </InputGroup>
                <br></br>
                <Table striped="odd" class="rounded-lg">
                    <TableCaption>
                        <Pagination
                            currentPage={pageNum()}
                            lastPage={lastPage()}
                            setCurrentPage={setPageNum}
                        />
                    </TableCaption>
                    <Thead>
                        <Tr>
                            <Th class="text-center">No</Th>
                            <Th>MturkID</Th>
                            <Th>Paypal</Th>
                            <Th numeric>Total Records</Th>
                            <Th numeric>Total Payment</Th>
                            <Th numeric>Balance</Th>
                            <Th style={{ 'text-align': 'center' }}>Action</Th>
                        </Tr>
                    </Thead>
                    <Tbody style={{ opacity: loading() ? '.3' : 1 }}>
                        {userDatas().length > 0 ?
                            <For each={userDatas().filter((item, i) => { return i >= firstIndex() && i < lastIndex() ? 1 : 0 }).map((e, i) => i)} fallback={''}>
                                {(column, i) => (
                                    <><Tr>
                                        <Td class="text-center">{i() + firstIndex() + 1}</Td>
                                        <Td>{userDatas()[i() + firstIndex()]?.mturk_id}</Td>
                                        <Td><a class="text-primary">{userDatas()[i() + firstIndex()]?.paypal}</a></Td>
                                        <Td class="text-teal" numeric>{userDatas()[i() + firstIndex()]?.total_records}</Td>
                                        <Td class="text-danger" numeric>{userDatas()[i() + firstIndex()]?.total_payment / 100}</Td>
                                        <Td class="text-warning" numeric>{userDatas()[i() + firstIndex()]?.balance}</Td>
                                        <Td style={{ 'text-align': 'center' }}>
                                            <Button class="rounded-2xl" fontSize="1.5rem" colorScheme={userDatas()[i() + firstIndex()]?.paypal ? `info` : 'warning'} variant="outline" onClick={[editPayment, userDatas()[i() + firstIndex()]]}>
                                                Payout
                                            </Button>
                                        </Td>
                                    </Tr></>
                                )}
                            </For>
                            :
                            <tr><td colspan={7} class="text-center text-slate-800 p-6">No display data.</td></tr>
                        }
                    </Tbody>
                    {loading() ? <svg role="status" class="inline mr-3 w-8 h-8 text-black animate-spin table-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                    </svg> : ''
                    }
                </Table>
                <Modal centered size="2xl" closeOnOverlayClick={true} opened={showModal()} onClose={onStop}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalBody>
                            <div class={`payment-content `}>
                                <button class={`modal-close `} onClick={onStop}>
                                    <svg style={{ "margin-top": '10px' }} class="hope-icon hope-c-XNyZK hope-c-PJLV hope-c-PJLV-ijhzIfm-css" viewBox="0 0 16 16"><path fill="currentColor" d="M2.64 1.27L7.5 6.13l4.84-4.84A.92.92 0 0 1 13 1a1 1 0 0 1 1 1a.9.9 0 0 1-.27.66L8.84 7.5l4.89 4.89A.9.9 0 0 1 14 13a1 1 0 0 1-1 1a.92.92 0 0 1-.69-.27L7.5 8.87l-4.85 4.85A.92.92 0 0 1 2 14a1 1 0 0 1-1-1a.9.9 0 0 1 .27-.66L6.16 7.5L1.27 2.61A.9.9 0 0 1 1 2a1 1 0 0 1 1-1c.24.003.47.1.64.27z"></path></svg>
                                </button>
                                <span class="text-slate-800"> - To <span class="text-danger">{getMturkID()}</span></span>
                                <div class="modal-balance text-teal">User Balance : {getUserBalance()}</div>
                                <Input disabled={onLoading() ? true : false} id="paymentInput" type="number" class={`px-3 py-1.5 border rounded outline-none leading-9 bg-transparent login-input mt-2 `} placeholder='Payment' value={0} onKeyDown={paymentKeyDown} onInput={paymentInputChange} />
                                <div class='text-center'>
                                    <Show when={getPayment() != 0} fallback={<span class={`btn-send opacity-40 disabled `}>Save</span>}>
                                        <a class={`btn-send border-lg rounded border-slate-800 ` + (onLoading() ? 'disabled' : '')} onClick={savePayment}>
                                            {onLoading() ?
                                                <svg role="status" class="inline mr-3 w-4 h-4 text-slate-800 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                                                </svg> : ''
                                            }
                                            Save
                                        </a>
                                    </Show>

                                </div>
                            </div>

                        </ModalBody>
                    </ModalContent>
                </Modal>
            </div>
        </div>
    );
}

export default AdminPanel;