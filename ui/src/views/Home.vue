<template>
  <div>
    <record-btn
      @start="startRecording"
      @stop="onStopClick"
    />

    <div class="recording-list">
      <audio-player
        v-for="(audioURL, i) in audioURLs"
        :key="i"
        :url="audioURL"
      />
    </div>

    <p
      v-for="recordingName in recordingsList"
      :key="recordingName"
      @click="onRecordingNameClick(recordingName)"
    >
      {{ recordingName }}
    </p>
  </div>
</template>

<script>
import AudioPlayer from '@/components/AudioPlayer'
import RecordBtn from '@/components/RecordBtn.vue'
import { uploadRecording, getRecordingsList, downloadRecording } from '@/services/api'

export default {
  name: 'Home',

  data () {
    return {
      mediaRecorder: undefined,
      audioCtx: undefined,
      chunks: [],
      audioURLs: [],
      recordingsList: []
    }
  },

  async mounted () {
    const resp = await getRecordingsList()
    this.recordingsList = JSON.parse(resp)

    if (navigator.mediaDevices.getUserMedia) {
      console.log('getUserMedia supported')

      const constraints = { audio: true }

      const onError = err => console.error(err)

      navigator.mediaDevices.getUserMedia(constraints)
        .then(this.setupMediaRecorder, onError)
    } else {
      alert('getUserMedia not supported on your browser!')
    }
  },

  methods: {
    setupMediaRecorder (stream) {
      this.mediaRecorder = new MediaRecorder(stream)

      this.mediaRecorder.onstop = this.stopRecording

      this.mediaRecorder.ondataavailable = e =>
        this.chunks.push(e.data)
    },

    startRecording () {
      this.mediaRecorder.start()
    },

    async stopRecording () {
      const blob = new Blob(this.chunks, { type: 'audio/ogg; codecs=opus' })
      this.chunks = []
      const audioURL = window.URL.createObjectURL(blob)
      this.audioURLs.push(audioURL)

      // upload
      const buffer = await blob.arrayBuffer()
      const resp = await uploadRecording(buffer, 'rec-' + Math.random())
      console.log('upload resp', resp)
    },

    onStopClick () {
      this.mediaRecorder.stop()
    },

    async onRecordingNameClick (recordingName = '') {
      const recordingBlob = await downloadRecording(recordingName)
      const audioURL = window.URL.createObjectURL(recordingBlob)
      this.audioURLs.push(audioURL)
    }
  },

  components: {
    AudioPlayer,
    RecordBtn
  }
}
</script>

<style scoped lang="scss">
.recording-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;

  > audio {
    width: 100%;
    max-width: 700px;
    margin-bottom: 16px;
  }
}
</style>
