<template>
  <button
    :class="{
      btn: true,
      pressed: isPressed
    }"
    :style="isPressed ? 'cursor: progress' : ''"
    @mousedown="setPressed(true)"
    @mouseup="setPressed(false)"
    @mouseleave="setPressed(false)"
  >
    🎙️
  </button>
</template>

<script>
export default {
  name: 'RecordBtn',

  props: {
    url: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      isPressed: false
    }
  },

  methods: {
    setPressed (isPressed = false) {
      if (isPressed) this.$emit('start')
      else if (this.isPressed) this.$emit('stop')

      this.isPressed = isPressed
    }
  }
}
</script>

<style scoped lang="scss">
.btn {
  height: 100px;
  width: 100px;
  border: 3px solid red;
  border-radius: 50%;
  background-color: darkred;
  font-size: 60px;
  line-height: 0;

  &:hover {
    cursor: pointer;
    filter: brightness(1.3);
  }

  &.pressed {
    background-color: red;
    animation-name: pulse;
    animation-duration: 1.5s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }
}

@keyframes pulse{
  0%{
    box-shadow: 0px 0px 5px 0px rgba(red, .3);
  }
  65%{
    box-shadow: 0px 0px 5px 13px rgba(red, .3);
  }
  90%{
    box-shadow: 0px 0px 5px 13px rgba(red, 0);
  }
}
</style>
