<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 搜索栏 -->
      <u-search
        v-model="keyword"
        @search="onSearch"
        @custom="onSearch"
        @clear="clearSearch"
        :bgColor="`${th.primaryLight}`"
        :borderColor="th.primary"
        :searchIconColor="th.primary"
        placeholder="书名、年级、科目…"
        actionText="搜索"
        :height="80"
        :inputStyle="{ color: '#1F2937', fontSize: '28rpx' }"
        :actionStyle="{ color: th.primary, fontWeight: '500', fontSize: '28rpx' }"
      />

      <!-- 搜索历史 -->
      <view v-if="!state.dataList.length && !searched && history.length" class="flex-col gap-3">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-2">
            <yy-icon name="ri:history-line" size="16" :color="th.primary" />
            <text class="text-xs font-semibold" style="color: #6B7280">搜索历史</text>
          </view>
          <text class="text-xs font-medium" :style="{ color: th.primary }" @click="clearHistory">清除</text>
        </view>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="(h, i) in history"
            :key="i"
            class="px-4 py-2 rounded-full text-xs font-medium active:scale-[0.96] transition-all duration-150"
            style="background: #FFFFFF; color: #374151; box-shadow: 0 1rpx 6rpx rgba(0,0,0,0.04)"
            @click="keyword = h; onSearch()"
          >{{ h }}</view>
        </view>
      </view>

      <!-- 结果 -->
      <view v-if="searched" class="flex-col gap-3">
        <text class="text-xs font-semibold" style="color: #6B7280">找到 {{ total }} 个结果</text>
        <view class="grid grid-cols-3 gap-3">
          <view
            v-for="item in state.dataList"
            :key="item._id"
            class="rounded-xl overflow-hidden active:scale-[0.96] transition-all duration-250"
            style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)"
            @click="goDetail(item)"
          >
            <view class="relative" style="aspect-ratio: 3/4">
              <image :src="item.cover" mode="aspectFill" class="w-full h-full" :style="{ backgroundColor: th.primaryLight }" />
              <view class="absolute inset-0" style="background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.18) 100%)" />
            </view>
            <view class="p-2.5">
              <text class="text-xs font-semibold line-clamp-1" style="color: #1F2937">{{ item.title }}</text>
              <text class="text-xs mt-0.5" style="color: #9CA3AF">{{ item.grade || '' }} · {{ item.subject || '' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  const th = uni.$u.color

  const pagingConfig = ref({
    auto: false,
    refresherEnabled: false,
    showRefresherWhenReload: false,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '搜索教材',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const keyword = ref('')
  const searched = ref(false)
  const total = ref(0)

  const history = ref(vk.getStorageSync('search_history') || [])

  onLoad(() => {})
  onShow(() => {})

  function scroll(e) { state.value.isScroll = e.detail.scrollTop > 0 }

  function onSearch() {
    if (!keyword.value.trim()) return
    saveHistory(keyword.value.trim())
    searched.value = true
    paging.value?.reload()
  }

  function clearSearch() {
    keyword.value = ''
    searched.value = false
    state.value.dataList = []
  }

  async function queryList(page, limit) {
    const res = await vk.callFunction({
      url: 'client/pub_index.searchTextbook',
      data: { keyword: keyword.value.trim(), limit },
    })
    if (res.code === 1) {
      paging.value?.complete(res.data || [])
      total.value = (res.data || []).length
    } else { paging.value?.complete(false) }
  }

  function saveHistory(kw) {
    let arr = history.value.filter(h => h !== kw)
    arr.unshift(kw)
    if (arr.length > 10) arr = arr.slice(0, 10)
    history.value = arr
    vk.setStorageSync('search_history', arr)
  }

  function clearHistory() {
    history.value = []
    vk.setStorageSync('search_history', [])
  }

  function goDetail(item) { vk.navigateTo(`/pages/index/detail?id=${item._id}`) }
</script>

<style lang="scss" scoped></style>
