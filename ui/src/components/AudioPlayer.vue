<template>
  <audio controls :src="url"></audio>
</template>

<script>
export default {
  name: 'AudioPlayer',

  props: {
    url: {
      type: String,
      default: ''
    }
  }
}
</script>
