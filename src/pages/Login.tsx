import { createEffect, createSignal, onMount, Show } from "solid-js";

const Login = () => {
    const [getMturkID, setMturkID] = createSignal('')

    return (
        <form class="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-900 to-blue-600">
            <div class="rounded-2xl p-12 flex items-center justify-center flex-col bg-dark">
                <h2 class="font-bold mb-2 text-white uppercase text-4xl"> Login </h2>
                <p class="text-white/50 mb-12"> Please enter your mtruk ID! </p>
                <input type="text" class="px-3 py-1.5 border rounded outline-none text-white leading-9 bg-transparent" placeholder='Mturk ID' onInput={(e) => setMturkID(e.currentTarget.value)}></input>
                <Show when={getMturkID()} fallback={<span class="btn-login opacity-40 disabled">Login</span>}>
                    <a class="btn-login" href={"/dashboard?mturkID=" + getMturkID()}> Login </a>
                </Show>
            </div>
        </form>
    );
}

export default Login;