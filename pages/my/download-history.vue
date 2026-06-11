<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-3 p-3">
      <view
        v-for="item in state.dataList"
        :key="item._id"
        class="flex items-center gap-3 p-4 rounded-xl active:scale-[0.98] transition-all duration-200"
        style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)"
        @click="goDetail(item)"
      >
        <!-- 封面 -->
        <view class="relative rounded-lg overflow-hidden shrink-0" style="width: 100rpx; height: 130rpx">
          <image :src="item.cover" mode="aspectFill" class="w-full h-full" :style="{ backgroundColor: th.primaryLight }" />
        </view>

        <!-- 信息 -->
        <view class="flex-1 min-w-0">
          <text class="text-sm font-semibold line-clamp-1" style="color: #1F2937">{{ item.title }}</text>
          <text class="text-xs mt-1" style="color: #6B7280">{{ item.publisher || '' }}</text>
          <view class="flex items-center gap-2 mt-1.5">
            <text class="text-xs" style="color: #9CA3AF">{{ formatTime(item.downloadTime) }}</text>
          </view>
        </view>

        <yy-icon name="ri:arrow-right-s-line" size="18" style="color: #D1D5DB" />
      </view>

      <yy-empty v-if="!state.dataList.length && loaded" />
    </view>
  </yy-paging>
</template>

<script setup>
  const th = uni.$u.color

  const pagingConfig = ref({
    auto: true,
    refresherEnabled: true,
    showRefresherWhenReload: true,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '下载历史',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const loaded = ref(false)

  onLoad(() => {})
  onShow(() => {})

  function scroll(e) { state.value.isScroll = e.detail.scrollTop > 0 }

  async function queryList(page, limit) {
    const res = await vk.callFunction({
      url: 'client/pub_index.getDownloadHistory',
      data: { pageIndex: page, pageSize: limit },
    })
    if (res.code === 1) {
      paging.value?.complete(res.data || [])
      loaded.value = true
    } else { paging.value?.complete(false) }
  }

  function goDetail(item) { vk.navigateTo(`/pages/index/detail?id=${item.textbookId || item._id}`) }

  function formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
</script>

<style lang="scss" scoped></style>
