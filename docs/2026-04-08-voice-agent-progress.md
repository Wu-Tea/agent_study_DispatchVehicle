# 2026-04-08 Voice Agent Progress

Historical snapshot only.

Do not treat this file as the current source of truth.

Current references:

- entry: [AGENT_ENTRY.md](D:\work\AI\DispatchVehicle\docs\AGENT_ENTRY.md)
- current status: [CURRENT_STATUS.md](D:\work\AI\DispatchVehicle\docs\CURRENT_STATUS.md)

## Today Completed

- MVP scope confirmed:
  - only `TASK0 + HANDLE`
  - no `FLAG_BB`
  - backend ASR uses FunASR
  - semantic model uses DeepSeek
  - frontend remains responsible for linkage fields and final write-back
  - user confirms before writing updates into the form
- Backend voice chain is connected:
  - `agent` provides `WS /ws/asr`
  - `agent` provides `POST /api/agent/parse`
  - FunASR websocket protocol was corrected to match the official binary streaming flow
  - final and partial transcript paths are both wired
- Frontend voice chain is connected:
  - recording switch is available in the form page
  - browser capture changed from `MediaRecorder` to PCM capture through Web Audio
  - PCM audio is downsampled and streamed to backend ASR websocket
  - AI confirm dialog is already integrated
- Transcript UX was improved:
  - live transcript now displays cumulatively instead of overwriting each partial chunk
  - final transcript still uses the final ASR result
- Tail-audio loss was mitigated:
  - stop flow now waits briefly before closing microphone/audio nodes
  - this is intended to reduce the missing-last-character problem caused by the final PCM chunk not flushing in time
  - PCM processor buffer was reduced from `4096` to `1024`
  - stop flow now appends a short silent PCM padding chunk before sending the final ASR stop signal
  - the post-stop live capture grace window was later increased again because short Chinese tail syllables were still occasionally dropped in manual testing
  - the silent padding duration was also increased to give FunASR more sentence-end context

## Key Files

- Backend:
  - `D:\work\AI\DispatchVehicle\agent\app\api\asr_ws.py`
  - `D:\work\AI\DispatchVehicle\agent\app\services\funasr_stream.py`
  - `D:\work\AI\DispatchVehicle\agent\tests\test_asr_ws.py`
  - `D:\work\AI\DispatchVehicle\agent\tests\test_funasr_stream.py`
- Frontend:
  - `D:\work\AI\DispatchVehicle\web\src\views\VehicleDispatchForm.vue`
  - `D:\work\AI\DispatchVehicle\web\src\composables\useVoiceAgent.js`
  - `D:\work\AI\DispatchVehicle\web\src\api\asrSocket.js`
  - `D:\work\AI\DispatchVehicle\web\src\utils\pcmAudio.js`
  - `D:\work\AI\DispatchVehicle\web\src\views\__tests__\VehicleDispatchForm.test.js`
  - `D:\work\AI\DispatchVehicle\web\src\composables\__tests__\useVoiceAgent.test.js`

## Verified Status

- Backend tests passed earlier in this session:
  - `python -m pytest D:\work\AI\DispatchVehicle\agent\tests -q`
- Frontend verification passed after the latest voice fixes:
  - `npm run test -- VehicleDispatchForm`
  - `npm run test -- useVoiceAgent`
  - `npm run test`
  - `npm run build`

## Current Runtime Notes

- Backend ASR service expects FunASR on `ws://127.0.0.1:10095`
- Python backend is intended to run on `127.0.0.1:8010`
- Frontend currently streams PCM chunks to backend websocket, not recorded blob chunks
- Live transcript is suitable for MVP demos now, but semantic extraction is still the next major milestone

## Startup Commands

- FunASR Docker startup command:

```powershell
docker run --rm -it `
  --name funasr-online `
  -p 10095:10095 `
  -v "D:\work\AI\DispatchVehicle\funasr-runtime-resources\models:/workspace/models" `
  registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.13 `
  /bin/bash -lc "/workspace/FunASR/runtime/websocket/build/bin/funasr-wss-server-2pass --download-model-dir /workspace/models --vad-dir damo/speech_fsmn_vad_zh-cn-16k-common-onnx --model-dir damo/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-onnx --online-model-dir damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx --punc-dir damo/punc_ct-transformer_zh-cn-common-vad_realtime-vocab272727-onnx --lm-dir damo/speech_ngram_lm_zh-cn-ai-wesp-fst --itn-dir thuduj12/fst_itn_zh --certfile 0"
```

- Important note for FunASR:
  - do not use `run_server_2pass.sh` as the container entry command
  - that script backgrounds the service and the container exits immediately

- Python backend startup command:

```powershell
cd D:\work\AI\DispatchVehicle\agent
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
```

## Known Remaining Issues

- The missing-last-character issue should be improved, but it still needs more real-browser validation with short Chinese phrases
- `VehicleDispatchForm.vue` still contains old unused `handleVoiceStart` / `handleVoiceStop` legacy code paths and should be cleaned when the next round touches this file
- Some UI strings in the console/file output appear garbled in this shell environment; functional behavior was prioritized first
- Frontend build still shows the existing Vite large-chunk warning

## Next Work For Tomorrow

1. Start semantic extraction with DeepSeek:
   - normalize transcript text
   - map transcript semantics into `updates`
   - produce `respMessage`
   - return overwrite hints when incoming values conflict with existing form values
2. Improve frontend write-back flow:
   - review confirm dialog content
   - verify the update list is clear enough for actual users
   - verify missing-field follow-up prompts after confirm
3. Clean the form page voice code:
   - remove the old unused voice handlers from `VehicleDispatchForm.vue`
   - keep only the PCM path that is actually used
4. Do one real end-to-end pass:
   - speak
   - get transcript
   - call semantic parse
   - confirm updates
   - write updates into the form

## Suggested Restart Checklist

1. Start FunASR service on port `10095`
2. Start Python backend on port `8010`
3. Start frontend dev server
4. Verify voice input works before touching semantic parsing
5. Then move to `POST /api/agent/parse` behavior and confirm-dialog/frontend update logic
