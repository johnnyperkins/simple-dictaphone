<template>
  <div class="wrapper">
    <canvas ref="canvas" class="visualization"></canvas>

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
      recordings: {},
      mediaRecorder: undefined,
      chunks: [],
      audioCtx: undefined,
      canvasCtx: undefined
    }
  },

  async mounted () {
    const resp = await getRecordingsList()
    const recordingsList = JSON.parse(resp)

    recordingsList.forEach(name => {
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

    this.canvasCtx = this.$refs.canvas.getContext('2d')
  },

  methods: {
    setupMediaRecorder (stream) {
      this.mediaRecorder = new MediaRecorder(stream)

      this.visualize(stream)

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

      // upload
      const name = prompt('Enter a name for your recording', 'Super important!') || this.getRandomName()
      const buffer = await blob.arrayBuffer()
      await uploadRecording(buffer, name)
      this.recordings[name] = audioURL
    },

    getRandomName () {
      return 'rec-' + Math.floor(Math.random() * 100000000000)
    },

    visualize (stream) {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext()
      }

      const source = this.audioCtx.createMediaStreamSource(stream)
      const analyser = this.audioCtx.createAnalyser()
      analyser.fftSize = 2048
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      source.connect(analyser)

      const draw = () => {
        const WIDTH = this.$refs.canvas.width
        const HEIGHT = this.$refs.canvas.height

        requestAnimationFrame(draw)

        analyser.getByteTimeDomainData(dataArray)

        this.canvasCtx.fillStyle = 'rgb(256, 256, 256)'
        this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

        this.canvasCtx.lineWidth = 2
        this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)'

        this.canvasCtx.beginPath()

        const sliceWidth = WIDTH * 1.0 / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = v * HEIGHT / 2

          if (i === 0) {
            this.canvasCtx.moveTo(x, y)
          } else {
            this.canvasCtx.lineTo(x, y)
          }

          x += sliceWidth
        }

        this.canvasCtx.lineTo(this.$refs.canvas.width, this.$refs.canvas.height / 2)
        this.canvasCtx.stroke()
      }

      draw()
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

.visualization {
  position: fixed;
  top: 0;
  width: 100%;
  height: 120px;
  z-index: -1;
}
</style>
