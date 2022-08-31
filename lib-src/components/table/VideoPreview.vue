<template>
  <div :class='$style.videoPreview'>
    <el-dialog
      width='800px'
      title='视频预览'
      v-model="state.dialogVisible"
      @close='handleBeforeClose'
    >
      <DPlayer :url='playurl' :key='playurl' />
    </el-dialog>
    <div :class='$style.videoImg' @click='openDialog'>
      <template v-if='inner.type === "url"'>
        <div style='color: #409eff'>
          {{ playurl }}
        </div>
      </template>
      <template v-else-if='value'>
        <img
          alt='封面'
          draggable='false'
          :class='$style.imgBoxContent'
          :src='value'
        />
        <i class='el-icon-video-play' :class='$style.videoPlayIcon'>
        </i>
      </template>
      <template v-else>
        <div :class='$style.imgBoxNoData'>无预览图</div>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useFaasParams } from '../../index'
import { computed, reactive, toRefs } from 'vue'
import DPlayer from '../media/DPlayer.vue'

const faasParams = useFaasParams()
const props = defineProps([ 'scope', 'value', 'inner' ])
const state = reactive({
    dialogVisible: false,
})
const playurl = computed(() => props.inner?.playurl({
    ...faasParams,
    row: props.scope.row,
}))

const handleBeforeClose = () => {
    state.dialogVisible = false
}
const openDialog = () =>  {
    state.dialogVisible = true
}
</script>

<style lang='scss' module>
.videoPreview {
  cursor: pointer;
  display: flex;
  justify-content: center;
  
  .imgBoxContent {
    width: 160px;
  }.videoImg {
    display: flex;
    position: relative;
  }.videoPlayIcon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 40px;
    z-index: 1;
    color: #fff;
  }.imgBoxNoData {
    display: inline-flex;
    border: 1px solid #999;
    color: #666;
    border-radius: 2px;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    background: #fff;
    padding: 10px;
    box-sizing: border-box;
    cursor: pointer;
  }
}
</style>
