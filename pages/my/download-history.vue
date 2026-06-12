<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-3 p-3" style="background-color: #f5f3f7">
      <view
        v-for="item in state.dataList"
        :key="item._id"
        class="flex items-center gap-3 p-3 rounded-xl active:scale-[0.98] transition-all duration-200"
        style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04)"
        @click="goDetail(item)"
      >
        <!-- 封面 -->
        <view class="shrink-0 relative overflow-hidden rounded-lg" style="width: 100rpx; height: 130rpx">
          <image
            v-if="item.cover"
            :src="item.cover"
            mode="aspectFill"
            class="w-full h-full"
            :style="{ backgroundColor: th.primaryLight }"
          />
          <view
            v-else
            class="w-full h-full flex items-center justify-center"
            :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }"
          >
            <text class="text-3xl font-bold text-white/80" style="font-family: Georgia, serif">{{ (item.title || '?').charAt(0) }}</text>
          </view>
        </view>

        <!-- 信息 -->
        <view class="flex-1 min-w-0">
          <text class="line-clamp-1 text-sm font-semibold" style="color: #4a4a4a">{{ item.title }}</text>
          <text class="mt-3 text-xs" style="color: #878787">{{ item.publisher || '' }}</text>
          <view class="flex items-center gap-3 mt-3">
            <text class="text-xs" style="color: #878787">{{ formatTime(item.downloadTime) }}</text>
          </view>
        </view>

        <yy-icon name="ri:arrow-right-s-line" size="18" :color="th.primary" />
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  import textbookData from '@/static/textbook-data.json'
  import myfn from '@/common/function/myPubFunction.js'

  const th = uni.$u.color

  const pagingConfig = ref({
    auto: true,
    refresherEnabled: true,
    showRefresherWhenReload: true,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '下载历史',
    color: uni.$u.color.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const loaded = ref(false)

  onLoad(() => {})
  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  async function queryList(page, limit) {
    const res = myfn.getDownloadHistory(page, limit)
    if (res.code === 1) {
      paging.value?.complete(res.data || [])
      loaded.value = true
    } else {
      paging.value?.complete(false)
    }
  }

  function goDetail(item) {
    vk.navigateTo(`/pages/index/detail?idx=${item.idx}`)
  }

  function formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
</script>

<style lang="scss" scoped></style>
