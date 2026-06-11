<template>
  <yy-paging ref="paging" bgColor="#F3F4F6" :navTitle="navTitle" showNavBack @query="queryList">
    <view class="page-content px-3 pt-3">
      <view class="grid grid-cols-3 gap-3">
        <view
          v-for="item in state.dataList"
          :key="item._id"
          class="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform"
          @click="goDetail(item)"
        >
          <image :src="item.cover" mode="aspectFill" class="w-full bg-gray-100" style="aspect-ratio: 3/4" @error="onCoverError(item)" />
          <view class="p-2">
            <text class="text-sm font-medium line-clamp-1">{{ item.title }}</text>
            <text class="text-xs text-muted">{{ item.publisher || '' }}</text>
          </view>
        </view>
      </view>
      <view class="h-8"></view>
    </view>
  </yy-paging>
</template>

<script>
export default {
  data() { return { navTitle: '教材列表', grade: '', subject: '', state: { dataList: [] } } },
  onLoad(options) {
    this.grade = options.grade || ''; this.subject = options.subject || ''
    this.navTitle = decodeURIComponent(options.title || '教材列表')
  },
  methods: {
    async queryList(pageIndex, pageSize) {
      const res = await vk.callFunction({ url: 'client/pub_index.getTextbookList', data: { grade: this.grade, subject: this.subject, pageIndex, pageSize } })
      if (res.code === 1) { this.$refs.paging.complete(res.data || []) } else { this.$refs.paging.complete(false) }
    },
    goDetail(item) { vk.navigateTo(`/pages/category/detail?id=${item._id}`) },
    onCoverError(item) { item.cover = '' },
  },
}
</script>
