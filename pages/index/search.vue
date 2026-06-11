<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 搜索栏 -->
      <view class="rounded-2xl px-4 flex items-center" style="height: 88rpx; background: rgba(217,119,6,0.06); border: 1rpx solid rgba(217,119,6,0.1)">
        <yy-icon name="ri:search-line" size="18" color="#D97706" />
        <input
          v-model="keyword"
          class="flex-1 ml-3 text-sm"
          style="color: #1F2937"
          placeholder="搜索教材名称"
          confirm-type="search"
          @confirm="doSearch"
        />
        <view v-if="keyword" class="w-5 h-5 rounded-full flex items-center justify-center active:scale-90" style="background: rgba(217,119,6,0.15)" @click="clearSearch">
          <yy-icon name="ri:close-line" size="12" color="#D97706" />
        </view>
      </view>

      <!-- 搜索历史 -->
      <view v-if="!keyword && !searched && history.length">
        <view class="flex items-center justify-between mb-3">
          <view class="flex items-center gap-2">
            <yy-icon name="ri:history-line" size="16" color="#9CA3AF" />
            <text class="text-sm font-semibold" style="color: #374151">搜索历史</text>
          </view>
          <text class="text-xs" style="color: #9CA3AF" @click="clearHistory">清空</text>
        </view>
        <view class="flex flex-wrap gap-2">
          <text
            v-for="(h, i) in history"
            :key="i"
            class="px-4 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-transform"
            style="background: #FFFFFF; color: #6B7280; box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.04)"
            @click="keyword = h; doSearch()"
          >{{ h }}</text>
        </view>
      </view>

      <!-- 搜索结果 -->
      <view v-if="searched">
        <view class="grid grid-cols-3 gap-3">
          <view
            v-for="item in state.dataList"
            :key="item._id"
            class="rounded-xl overflow-hidden active:scale-[0.96] transition-all duration-200"
            style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)"
            @click="goDetail(item)"
          >
            <view class="relative" style="aspect-ratio: 3/4">
              <image :src="item.cover" mode="aspectFill" class="w-full h-full" style="background: linear-gradient(135deg, #FEF3C7, #F0FDFA)" />
              <view class="absolute inset-0" style="background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.15) 100%)" />
            </view>
            <view class="p-2.5">
              <text class="text-xs font-semibold line-clamp-1" style="color: #1F2937">{{ item.title }}</text>
              <text class="text-xs mt-0.5" style="color: #9CA3AF">{{ item.publisher || '' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  const pagingConfig = ref({
    auto: false,
    refresherEnabled: true,
    showRefresherWhenReload: true,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '搜索教材',
    color: '#D97706',
  })

  const state = ref({
    isScroll: false,
    dataList: [],
  })

  const paging = ref()

  const HISTORY_KEY = 'search_history'

  const keyword = ref('')
  const searched = ref(false)
  const history = ref([])
  const queryKeyword = ref('')

  onLoad(() => {
    loadHistory()
  })

  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function loadHistory() {
    try {
      history.value = uni.getStorageSync(HISTORY_KEY) || []
    } catch (e) {
      history.value = []
    }
  }

  function saveHistory(kw) {
    if (!kw) return
    let list = history.value.filter(h => h !== kw)
    list.unshift(kw)
    if (list.length > 10) list.pop()
    history.value = list
    uni.setStorageSync(HISTORY_KEY, list)
  }

  function clearHistory() {
    history.value = []
    uni.removeStorageSync(HISTORY_KEY)
  }

  function clearSearch() {
    keyword.value = ''
    searched.value = false
    state.value.dataList = []
  }

  function doSearch() {
    const kw = keyword.value.trim()
    if (!kw) return
    queryKeyword.value = kw
    searched.value = true
    saveHistory(kw)
    paging.value.reload()
  }

  async function queryList(page, limit) {
    if (!queryKeyword.value) {
      paging.value?.complete([])
      return
    }
    const res = await vk.callFunction({
      url: 'client/pub_index.searchTextbooks',
      data: { keyword: queryKeyword.value, pageIndex: page, pageSize: limit },
    })
    if (res.code === 1) {
      paging.value?.complete(res.data || [])
    } else {
      paging.value?.complete(false)
    }
  }

  function goDetail(item) {
    vk.navigateTo(`/pages/category/detail?id=${item._id}`)
  }
</script>

<style lang="scss" scoped></style>
