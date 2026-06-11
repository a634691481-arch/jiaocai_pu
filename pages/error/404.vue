<template>
  <view>
    <yy-paging
      v-model="state.dataList"
      @query="queryList"
      ref="paging"
      :auto="false"
      @scroll="scroll"
      :refresher-enabled="true"
    >
      <template #top>
        <u-navbar
          :background="{ backgroundColor: state.isScroll ? '#8B5FBF' : '#8B5FBF' }"
          :title="state.title"
          :border-bottom="false"
          title-color="#fff"
          isBack
          backIconColor="#fff"
        >
        </u-navbar>
      </template>
      <template #empty>
        <yy-empty></yy-empty>
      </template>
      <template #loadingMoreNoMore>
        <yy-nomore></yy-nomore>
      </template>
      <template #bottom>
        <view class="h-11"></view>
      </template>
      <view class="flex flex-col px-3"> </view>
    </yy-paging>
    <!--  -->
    <!--  -->
    <!--  -->
    <yy-tabbar></yy-tabbar>
  </view>
</template>

<script setup>
  // 状态
  const state = ref({
    isScroll: false,
    dataList: [],
    title: '首页'
  })

  // 组件引用
  const paging = ref()
  const alert = ref()

  // 页面生命周期（Uni-App）
  onLoad(options => {
    console.log('🚀 ~ :55 ~ options:', options)
  })

  // 滚动事件
  const scroll = e => {
    state.value.isScroll = e.detail.scrollTop > 0
  }
  // 列表查询
  const queryList = (page, limit) => {
    console.log('🚀 ~ :58 ~ queryList ~ page, limit:', page, limit)
    setTimeout(() => {
      paging.value?.complete([1])
    }, 1000)
  }
</script>

<style lang="scss" scoped></style>
