import type { Component } from 'solid-js';

import { createSignal, onMount, Suspense, For } from "solid-js";
import RecordView from './RecordView';
import './RecordViewList.scss';

const RecordViewList: Component = () => {
	const [recordScripts, setRecordScripts] = createSignal([])
  const getRecords = () => {
    const textcontent = "Hi, John"
    const recordarray:string[] = []

    for(let i = 0; i < 1000; i++) {
      recordarray.push(textcontent + i)
    }
    setRecordScripts(recordarray)
  }

  onMount(() => getRecords());

	return (
    <div class="record-view-list">
      <Suspense fallback={<div class="record-preview">Loading records...</div>}>
        <For
          each={recordScripts()}
          fallback={<div class="record-preview">No records are here... yet.</div>}
        >
          {(record, i) => (
            <RecordView index={i()} textcontent={record} />
          )}
        </For>
      </Suspense>
    </div>
  );
};

export default RecordViewList;