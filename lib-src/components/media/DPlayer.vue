<template>
  <div
    :class="{
      [$style.dplayer]: true,
      [$style.isVertical]: isVertical,
      [$style.isNormal]: !isVertical
    }"
  >
    <div :class="$style.player" ref="dplayer"></div>
  </div>
</template>
<script>
import DPlayer from 'dplayer'

export default {
  name: 'DPlayer',
  data() {
    return {
      dp: null,
      isVertical: false
    }
  },
  props: {
    url: {
      type: String,
      default: ''
    }
  },
  methods: {
    initPlayer() {
      const el = this.$refs.dplayer
      this.dp = new DPlayer({
        container: el,
        video: {
          url: this.url
        }
      })

      this.dp.on('canplay', () => {
        const isVertical = this.dp.video.videoWidth < this.dp.video.videoHeight
        this.isVertical = isVertical
      })
    }
  },
  mounted() {
    this.initPlayer()
  },
  beforeDestroy() {
    this.dp.destroy()
  }
}
</script>
<style lang="scss" module>
.dplayer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;&.isNormal {
    width: 640px;
  }&.isVertical {
    width: 368px;
  }.player {
    width: 100%;
  }
}

</style>
