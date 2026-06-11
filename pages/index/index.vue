<template>
  <yy-paging ref="paging" bgColor="#F3F4F6" :showTabbar="true" navTitle="教材铺" @query="queryList">
    <view class="page-content px-4 pt-3">
      <!-- 搜索入口 -->
      <view class="bg-white rounded-full px-5 flex items-center shadow-sm mb-4" style="height: 80rpx" @click="goSearch">
        <u-icon name="search" size="18" color="#9CA3AF" />
        <text class="ml-2 text-muted text-base">搜索教材名称或年级</text>
      </view>

      <!-- Banner 轮播 -->
      <swiper
        v-if="banners.length"
        class="rounded-2xl overflow-hidden mb-5"
        style="height: 280rpx"
        :autoplay="true"
        :interval="3000"
        :circular="true"
        indicator-dots
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#2563EB"
      >
        <swiper-item v-for="b in banners" :key="b._id" @click="onBannerTap(b)">
          <image :src="b.imageUrl" mode="aspectFill" class="w-full h-full bg-gray-200" />
        </swiper-item>
      </swiper>

      <!-- 热门推荐 -->
      <view class="flex items-center justify-between mb-3">
        <text class="text-lg font-bold">🔥 热门推荐</text>
        <text class="text-sm text-primary" @click="switchTab(1)">查看更多 ></text>
      </view>

      <view class="grid grid-cols-2 gap-3">
        <view
          v-for="item in state.dataList"
          :key="item._id"
          class="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform"
          @click="goDetail(item)"
        >
          <image
            :src="item.cover"
            mode="aspectFill"
            class="w-full bg-gray-100"
            style="aspect-ratio: 3/4"
          />
          <view class="p-3">
            <text class="text-base font-medium line-clamp-1">{{ item.title }}</text>
            <text class="text-xs text-muted mt-1">{{ item.publisher || '' }} {{ formatSize(item.fileSize) }}</text>
          </view>
        </view>
      </view>

      <!-- 底部广告占位 -->
      <view class="h-30"></view>
    </view>
  </yy-paging>
</template>

<script>
export default {
  data() {
    return {
      banners: [],
      state: { dataList: [] },
    }
  },
  onLoad() {
    this.loadBanners()
  },
  methods: {
    async loadBanners() {
      const res = await vk.callFunction({ url: 'client/pub_index.getBanners' })
      if (res.code === 1) this.banners = res.data || []
    },
    async queryList(pageIndex, pageSize) {
      const res = await vk.callFunction({
        url: 'client/pub_index.getHotTextbooks',
        data: { limit: pageSize },
      })
      if (res.code === 1) {
        this.$refs.paging.complete(res.data || [])
      } else {
        this.$refs.paging.complete(false)
      }
    },
    onBannerTap(banner) {
      if (banner.linkType === 'textbook' && banner.linkValue) {
        vk.navigateTo(`/pages/category/detail?id=${banner.linkValue}`)
      } else if (banner.linkType === 'url' && banner.linkValue) {
        // #ifdef H5
        window.open(banner.linkValue)
        // #endif
      }
    },
    goDetail(item) {
      vk.navigateTo(`/pages/category/detail?id=${item._id}`)
    },
    goSearch() {
      vk.navigateTo('/pages/index/search')
    },
    switchTab(index) {
      // 切换到分类 Tab
      vk.vuex.set('$tabbar.activeIndex', index)
      vk.switchTab('/pages/category/index')
    },
    formatSize(bytes) {
      if (!bytes) return ''
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
      return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
    },
  },
}
</script>
