<template>
  <div>
    <button @click="startRecording">Record</button>
    <button @click="onStopClick">Stop</button>

    <div class="recording-list">
      <audio-player
        v-for="(audioURL, i) in audioURLs"
        :key="i"
        :url="audioURL"
      />
    </div>
  </div>
</template>

<script>
import AudioPlayer from '@/components/AudioPlayer'

export default {
  name: 'Home',

  data () {
    return {
      mediaRecorder: undefined,
      audioCtx: undefined,
      chunks: [],
      audioURLs: []
    }
  },

  mounted () {
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

    stopRecording () {
      const blob = new Blob(this.chunks, { type: 'audio/ogg; codecs=opus' })
      this.chunks = []
      const audioURL = window.URL.createObjectURL(blob)
      this.audioURLs.push(audioURL)
    },

    onStopClick () {
      this.mediaRecorder.stop()
    }
  },

  components: {
    AudioPlayer
  }
}
</script>

<style scoped lang="scss">
.recording-list {
  display: flex;
  flex-direction: column;
  align-items: center;

  > audio {
    width: 100%;
    max-width: 700px;
    margin-bottom: 16px;
  }
}
</style>
