<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 搜索入口 -->
      <view
        class="rounded-2xl px-5 flex items-center active:scale-[0.98] transition-transform duration-200 relative overflow-hidden"
        style="height: 88rpx"
        @click="goSearch"
      >
        <view class="opacity-8 absolute inset-0" :style="{ backgroundColor: th.primary }" />
        <view
          class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full"
          :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }"
        >
          <yy-icon name="ri:search-line" size="16" color="#ffffff" />
        </view>
        <text class="relative z-10 flex-1 ml-3 text-sm" style="color: #9ca3af">搜索教材名称或年级</text>
      </view>

      <!-- Banner -->
      <view v-if="banners.length" class="rounded-2xl relative overflow-hidden" style="height: 300rpx">
        <swiper
          class="w-full h-full"
          :autoplay="true"
          :interval="3500"
          :circular="true"
          indicator-dots
          indicator-color="rgba(255,255,255,0.4)"
          :indicator-active-color="th.primary"
        >
          <swiper-item v-for="b in banners" :key="b._id" @click="onBannerTap(b)">
            <image :src="b.imageUrl" mode="aspectFill" class="w-full h-full" />
            <view
              class="absolute inset-0"
              style="background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.35) 100%)"
            />
          </swiper-item>
        </swiper>
      </view>

      <!-- 快捷入口 -->
      <view class="flex gap-3">
        <view
          class="flex-1 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.97] transition-transform duration-200 relative overflow-hidden"
          @click="switchTab(1)"
        >
          <view class="opacity-8 absolute inset-0" :style="{ backgroundColor: th.primary }" />
          <view
            class="rounded-xl relative z-10 flex items-center justify-center w-10 h-10"
            :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }"
          >
            <yy-icon name="ri:grid-fill" size="20" color="#ffffff" />
          </view>
          <view class="relative z-10">
            <text class="block text-sm font-semibold" :style="{ color: th.primaryDark }">浏览教材</text>
            <text class="text-xs" :style="{ color: th.primary }">按年级科目查找</text>
          </view>
        </view>
        <view
          class="flex-1 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.97] transition-transform duration-200 relative overflow-hidden"
          @click="goSearch"
        >
          <view class="opacity-8 absolute inset-0" :style="{ backgroundColor: th.primary }" />
          <view
            class="rounded-xl relative z-10 flex items-center justify-center w-10 h-10"
            :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }"
          >
            <yy-icon name="ri:file-search-line" size="20" color="#ffffff" />
          </view>
          <view class="relative z-10">
            <text class="block text-sm font-semibold" :style="{ color: th.primaryDark }">搜索教材</text>
            <text class="text-xs" :style="{ color: th.primary }">精准查找资源</text>
          </view>
        </view>
      </view>

      <!-- 热门推荐 -->
      <view class="flex items-center gap-2">
        <view
          class="w-1 h-5 rounded-full"
          :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.primaryDark})` }"
        />
        <text class="text-lg font-bold" style="color: #1f2937">🔥 热门推荐</text>
        <view class="flex-1" />
        <text class="text-xs font-medium" :style="{ color: th.primary }" @click="switchTab(1)">查看全部 →</text>
      </view>

      <view class="grid grid-cols-2 gap-3">
        <view
          v-for="item in state.dataList"
          :key="item._id"
          class="rounded-2xl overflow-hidden active:scale-[0.96] transition-all duration-250"
          style="background: #ffffff; box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04)"
          @click="goDetail(item)"
        >
          <view class="relative" style="aspect-ratio: 3/4">
            <image
              :src="item.cover"
              mode="aspectFill"
              class="w-full h-full"
              :style="{ backgroundColor: th.primaryLight }"
            />
            <view
              class="absolute inset-0"
              style="background: linear-gradient(180deg, transparent 60%, rgba(0, 0, 0, 0.15) 100%)"
            />
            <view class="bottom-2 left-2 right-2 absolute">
              <text class="drop-shadow text-xs font-medium text-white">{{ item.publisher || '' }}</text>
            </view>
          </view>
          <view class="p-3">
            <text class="line-clamp-1 text-sm font-semibold" style="color: #1f2937">{{ item.title }}</text>
            <text class="mt-1 text-xs" style="color: #9ca3af">{{ formatSize(item.fileSize) }}</text>
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
    showTabbar: true,
    hideNav: false,
    showNavBack: false,
    navTitle: '教材铺',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const banners = ref([])

  onLoad(() => {
    loadBanners()
  })
  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  async function loadBanners() {
    const res = await vk.callFunction({ url: 'client/pub_index.getBanners' })
    if (res.code === 1) banners.value = res.data || []
  }

  async function queryList(page, limit) {
    const res = await vk.callFunction({ url: 'client/pub_index.getHotTextbooks', data: { limit } })
    if (res.code === 1) paging.value?.complete(res.data || [])
    else paging.value?.complete(false)
  }

  function onBannerTap(banner) {
    if (banner.linkType === 'textbook' && banner.linkValue) {
      vk.navigateTo(`/pages/index/detail?id=${banner.linkValue}`)
    }
  }

  function goDetail(item) {
    vk.navigateTo(`/pages/index/detail?id=${item._id}`)
  }
  function goSearch() {
    vk.navigateTo('/pages/index/search')
  }
  function switchTab(index) {
    vk.vuex.set('$tabbar.activeIndex', index)
    vk.navigateTo('/pages/index/category')
  }

  function formatSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }
</script>

<style lang="scss" scoped></style>
