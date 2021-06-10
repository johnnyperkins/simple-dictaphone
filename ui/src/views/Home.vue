<template>
  <div class="wrapper">
    <record-btn
      @start="startRecording"
      @stop="onStopClick"
    />

    <div class="recordings">
      <div
        v-for="(audioURL, recordingName) in recordings"
        :key="recordingName"
        :class="{ noAudio: !audioURL }"
        @click="onRecordingNameClick(recordingName)"
      >
        <label>{{ recordingName }}</label>
        <audio-player v-if="audioURL" :url="audioURL" />
      </div>
    </div>
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
      recordingsList: [],
      recordings: {}
    }
  },

  async mounted () {
    const resp = await getRecordingsList()
    this.recordingsList = JSON.parse(resp)

    this.recordingsList.forEach(name => {
      this.recordings[name] = null
    })

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
      const name = prompt('Enter a name for your recording', 'Super important!') || this.getRandomName()
      const buffer = await blob.arrayBuffer()
      await uploadRecording(buffer, name)
      this.recordings[name] = audioURL
    },

    getRandomName () {
      return 'rec-' + Math.floor(Math.random() * 100000000000)
    },

    onStopClick () {
      this.mediaRecorder.stop()
    },

    async onRecordingNameClick (recordingName = '') {
      if (!this.recordings[recordingName]) {
        const recordingBlob = await downloadRecording(recordingName)
        const audioURL = window.URL.createObjectURL(recordingBlob)
        this.recordings[recordingName] = audioURL
      }
    }
  },

  components: {
    AudioPlayer,
    RecordBtn
  }
}
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.recordings {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 528px;
  margin-top: 24px;

  & > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-wrap: nowrap;
    width: 100%;
    margin-top: 16px;
    padding: 12px;
    box-shadow: 3px 3px 8px #aaa;

    &.noAudio:hover {
      box-shadow: 3px 3px 10px #888;
      cursor: pointer;
    }

    > label {
      font-size: 18px;
    }

    > audio {
      width: 100%;
      margin-top: 4px;
    }
  }
}
</style>
