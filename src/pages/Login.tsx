import { createEffect, createSignal, onMount, Show } from "solid-js";
import axios from "axios";
import { Input, notificationService, Tooltip } from '@hope-ui/solid'
import NextButton from '../assets/previous-button.svg';

import { LoginUrl, SignUpUrl, GetMturkUserData } from '../utils/Url';
const Login = () => {
    // log in params
    const [getMturkID, setMturkID] = createSignal('')
    const [getPassword, setPassword] = createSignal('')
    const [onLoading, setOnLoading] = createSignal(false)
    const [isLogin, setIsLogin] = createSignal(true)

    // sign up params
    const [getSignupMturkID, setSignupMturkID] = createSignal('')
    const [getSignupPassword, setSignupPassword] = createSignal('')
    const [getPayment, setPayment] = createSignal('')
    const [onSignupLoading, setOnSignupLoading] = createSignal(false)

    const enterKeyCode = 13
    const login = () => {
        let userID = getMturkID()
        let userPWD = getPassword()
        if (userID.trim() && userPWD.trim()) {
            setOnLoading(true)
            axios
                .post(LoginUrl, {
                    mturk_id: getMturkID(),
                    password: getPassword(),
                })
                .then((response) => {
                    if (response.data.code == 200) {
                        localStorage.setItem('mturk_pwd', getPassword())
                        localStorage.setItem('mturk_id', getMturkID())
                        window.location.replace("/dashboard?mturkID=" + userID)
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
        // localStorage.setItem('mturk_id', getMturkID())
        // window.location.replace("/dashboard?mturkID=" + userID)
    }

    const keyIDDown = (event: any) => {
        if (getMturkID() && event.keyCode == enterKeyCode)
            login()
    }

    const createUser = () => {
        setIsLogin(!isLogin());
    }

    const keyPwdDown = (event: any) => {
        if (getMturkID() && event.keyCode == enterKeyCode)
            login()
    }

    const keySignUpDown = (event: any) => {
        if (getSignupMturkID() && getSignupPassword() && event.keyCode == enterKeyCode)
            signUp()
    }

    const signUp = () => {
        console.log('signup')
        let userID = getSignupMturkID()
        let userPWD = getSignupPassword()
        if (userID.trim() && userPWD.trim()) {
            setOnLoading(true)
            axios
                .post(SignUpUrl, {
                    mturk_id: userID,
                    password: userPWD,
                    paypal: getPayment()
                })
                .then((response) => {
                    if (response.data.code == 200) {
                        notificationService.show({
                            status: "success", /* or success, warning, danger */
                            title: "Successfully!",
                            duration: 1500,
                        });
                        setOnLoading(false)
                        setIsLogin(true)
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
    }

    return (
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-white-300">
            <div class="rounded-2xl p-12 flex items-center justify-center flex-col bg-dark login-block">
                {isLogin() ?
                    <>
                        <h2 class="font-bold mb-2 text-white uppercase text-4xl"> Login </h2>
                        <p class="text-white/50 mb-12"> Please enter your mtruk ID! </p>
                        <span class="login-label">MturkID *</span>
                        <Input type="text" class="px-3 py-1.5 border rounded outline-none text-white leading-9 bg-transparent login-input" placeholder='Mturk ID' onInput={(e) => setMturkID(e.currentTarget.value)} onKeyDown={keyIDDown} />
                        <span class="login-label">Password *</span>
                        <Input type="password" class="px-3 py-1.5 border rounded outline-none text-white leading-9 bg-transparent login-input" placeholder='Password' onInput={(e) => setPassword(e.currentTarget.value)} onKeyDown={keyPwdDown} />
                        <Show when={getMturkID() && getPassword()} fallback={<span class="btn-login opacity-40 disabled">Login</span>}>
                            <a class={`btn-login ` + (onLoading() ? 'disabled' : '')} onClick={login}>
                                {onLoading() ?
                                    <svg role="status" class="inline mr-3 w-4 h-4 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                                    </svg> : ''
                                }
                                Login
                            </a>
                        </Show>
                        <span class="text-white m-2">You don't have any account.</span>
                        <a class="text-white text-underline" onClick={createUser}>sign up</a>
                    </>
                    :
                    <>
                        <img src={NextButton} width="32" class="backButton" alt='' onClick={createUser}></img>
                        <h2 class="font-bold mb-2 text-white uppercase text-4xl"> Sign Up </h2>
                        <p class="text-white/50 mb-12"> Please enter your mtruk ID and password! </p>
                        <span class="login-label">MturkID *</span>
                        <Input type="text" class="px-3 py-1.5 border rounded outline-none text-white leading-9 bg-transparent login-input" placeholder='Mturk ID' onInput={(e) => setSignupPassword(e.currentTarget.value)} onKeyDown={keySignUpDown} id="" />
                        <span class="login-label">Password *</span>
                        <Input type="password" class="px-3 py-1.5 border rounded outline-none text-white leading-9 bg-transparent login-input" placeholder='Password' onInput={(e) => setSignupMturkID(e.currentTarget.value)} onKeyDown={keySignUpDown} />
                        <span class="login-label">Payment(optional)</span>
                        <Input type="text" class="px-3 py-1.5 border rounded outline-none text-white leading-9 bg-transparent login-input" placeholder='Payment' onInput={(e) => setPayment(e.currentTarget.value)} onKeyDown={keySignUpDown} />
                        <Show when={getSignupPassword() && getSignupMturkID()} fallback={<span class="btn-login opacity-40 disabled">Sign up</span>}>
                            <a class={`btn-login text-slate-800 dark:text-white ` + (onLoading() ? 'disabled' : '')} onClick={signUp}>
                            {onLoading() ?
                                <svg role="status" class="inline mr-3 w-4 h-4 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                                </svg> : ''
                            }
                            Sign up
                        </a>
                    </Show>
                    </>
                }
        </div>
        </div >
    );
}

export default Login;