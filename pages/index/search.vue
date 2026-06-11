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

<script setup>
const paging = ref(null)

const HISTORY_KEY = 'search_history'

const keyword = ref('')
const searched = ref(false)
const history = ref([])
const state = reactive({ dataList: [] })
const queryKeyword = ref('')

onLoad(() => {
  loadHistory()
})

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
  state.dataList = []
}

function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  queryKeyword.value = kw
  searched.value = true
  saveHistory(kw)
  paging.value.reload()
}

async function queryList(pageIndex, pageSize) {
  if (!queryKeyword.value) {
    paging.value.complete([])
    return
  }
  const res = await vk.callFunction({
    url: 'client/pub_index.searchTextbooks',
    data: { keyword: queryKeyword.value, pageIndex, pageSize },
  })
  if (res.code === 1) {
    paging.value.complete(res.data || [])
  } else {
    paging.value.complete(false)
  }
}

function goDetail(item) {
  vk.navigateTo(`/pages/category/detail?id=${item._id}`)
}
</script>
