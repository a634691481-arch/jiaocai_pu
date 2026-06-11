<template>
  <yy-paging ref="paging" bgColor="#F3F4F6" navTitle="搜索教材" showNavBack @query="queryList">
    <view class="page-content px-4 pt-3">
      <view class="bg-white rounded-full px-5 flex items-center shadow-sm mb-4" style="height: 80rpx">
        <u-icon name="search" size="18" color="#9CA3AF" />
        <input
          v-model="keyword"
          class="flex-1 ml-2 text-base"
          placeholder="搜索教材名称"
          confirm-type="search"
          @confirm="doSearch"
        />
        <text v-if="keyword" class="text-muted text-sm" @click="clearSearch">✕</text>
      </view>

      <view v-if="!keyword && !searched && history.length" class="mb-4">
        <view class="flex items-center justify-between mb-2">
          <text class="text-sm font-medium">搜索历史</text>
          <text class="text-xs text-muted" @click="clearHistory">清空</text>
        </view>
        <view class="flex flex-wrap gap-2">
          <text
            v-for="(h, i) in history"
            :key="i"
            class="px-3 py-1 bg-white rounded-full text-sm text-secondary"
            @click="keyword = h; doSearch()"
          >{{ h }}</text>
        </view>
      </view>

      <view v-if="searched">
        <view class="grid grid-cols-3 gap-3">
          <view
            v-for="item in state.dataList"
            :key="item._id"
            class="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform"
            @click="goDetail(item)"
          >
            <image :src="item.cover" mode="aspectFill" class="w-full bg-gray-100" style="aspect-ratio: 3/4" />
            <view class="p-2">
              <text class="text-sm font-medium line-clamp-1">{{ item.title }}</text>
              <text class="text-xs text-muted">{{ item.publisher || '' }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="h-8"></view>
    </view>
  </yy-paging>
</template>

<script>
const HISTORY_KEY = 'search_history'

export default {
  data() {
    return {
      keyword: '',
      searched: false,
      history: [],
      state: { dataList: [] },
      queryKeyword: '',
    }
  },
  onLoad() {
    this.loadHistory()
  },
  methods: {
    loadHistory() {
      try { this.history = uni.getStorageSync(HISTORY_KEY) || [] } catch (e) { this.history = [] }
    },
    saveHistory(kw) {
      if (!kw) return
      let list = this.history.filter(h => h !== kw)
      list.unshift(kw)
      if (list.length > 10) list.pop()
      this.history = list
      uni.setStorageSync(HISTORY_KEY, list)
    },
    clearHistory() { this.history = []; uni.removeStorageSync(HISTORY_KEY) },
    clearSearch() { this.keyword = ''; this.searched = false; this.state.dataList = [] },
    doSearch() {
      const kw = this.keyword.trim()
      if (!kw) return
      this.queryKeyword = kw; this.searched = true; this.saveHistory(kw)
      this.$refs.paging.reload()
    },
    async queryList(pageIndex, pageSize) {
      if (!this.queryKeyword) { this.$refs.paging.complete([]); return }
      const res = await vk.callFunction({ url: 'client/pub_index.searchTextbooks', data: { keyword: this.queryKeyword, pageIndex, pageSize } })
      if (res.code === 1) { this.$refs.paging.complete(res.data || []) } else { this.$refs.paging.complete(false) }
    },
    goDetail(item) { vk.navigateTo(`/pages/category/detail?id=${item._id}`) },
  },
}
</script>
