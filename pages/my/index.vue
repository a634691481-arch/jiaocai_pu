<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 用户卡片 -->
      <view class="rounded-2xl p-5 relative overflow-hidden" style="background: linear-gradient(135deg, #FFFFFF, #FAFAFA); box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.04)">
        <view class="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-6" :style="{ backgroundColor: th.primary }" />
        <view v-if="userInfo._id" class="flex items-center gap-4 relative z-10">
          <image :src="userInfo.avatar || ''" class="w-14 h-14 rounded-full" style="background: #F3F4F6" mode="aspectFill" />
          <view class="flex-1">
            <text class="text-base font-bold" style="color: #1F2937">{{ userInfo.nickname || '微信用户' }}</text>
            <text class="text-xs mt-1" style="color: #9CA3AF">欢迎使用教材宝 📖</text>
          </view>
          <yy-icon name="ri:arrow-right-s-line" size="20" style="color: #D1D5DB" />
        </view>
        <view v-else class="flex items-center gap-4 relative z-10" @click="goLogin">
          <view class="w-14 h-14 rounded-full flex items-center justify-center" style="background: #F3F4F6">
            <yy-icon name="ri:user-line" size="24" style="color: #D1D5DB" />
          </view>
          <view class="flex-1">
            <text class="text-base font-bold" style="color: #1F2937">点击登录</text>
            <text class="text-xs mt-1" style="color: #9CA3AF">登录后享受完整服务</text>
          </view>
          <view class="px-4 py-2 rounded-full relative overflow-hidden active:scale-[0.96] transition-transform duration-200">
            <view class="absolute inset-0 opacity-10" :style="{ backgroundColor: th.primary }" />
            <text class="text-xs font-medium relative z-10" :style="{ color: th.primary }">去登录</text>
          </view>
        </view>
      </view>

      <!-- 菜单 -->
      <view class="rounded-2xl overflow-hidden" style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)">
        <view class="flex items-center gap-4 p-4 active:bg-gray-50 transition-colors duration-150" @click="goDownloadHistory">
          <view class="w-9 h-9 rounded-xl flex items-center justify-center" :style="{ background: `linear-gradient(135deg, ${th.primaryLight}, ${th.primaryLight})` }">
            <yy-icon name="ri:download-2-line" size="18" :color="th.primary" />
          </view>
          <text class="flex-1 text-sm font-medium" style="color: #1F2937">下载历史</text>
          <yy-icon name="ri:arrow-right-s-line" size="18" style="color: #D1D5DB" />
        </view>
        <view class="h-px mx-4" style="background: #F3F4F6" />
        <view class="flex items-center gap-4 p-4 active:bg-gray-50 transition-colors duration-150" @click="goPrivacy">
          <view class="w-9 h-9 rounded-xl flex items-center justify-center" :style="{ background: `linear-gradient(135deg, ${th.primaryLight}, ${th.primaryLight})` }">
            <yy-icon name="ri:shield-check-line" size="18" :color="th.primary" />
          </view>
          <text class="flex-1 text-sm font-medium" style="color: #1F2937">隐私与协议</text>
          <yy-icon name="ri:arrow-right-s-line" size="18" style="color: #D1D5DB" />
        </view>
      </view>

      <!-- 下载历史预览 -->
      <view v-if="downloadedList.length" class="flex-col gap-3">
        <view class="flex items-center gap-2">
          <view class="w-1 h-5 rounded-full" :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.primaryDark})` }" />
          <text class="text-sm font-bold" style="color: #1F2937">最近下载</text>
        </view>
        <view
          v-for="dl in downloadedList"
          :key="dl._id"
          class="flex items-center gap-3 p-3 rounded-xl active:bg-gray-50 transition-colors duration-150"
          style="background: #FFFFFF; box-shadow: 0 1rpx 6rpx rgba(0,0,0,0.03)"
          @click="openDownload(dl)"
        >
          <view class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background: #FEF3C7">
            <text class="text-lg">📄</text>
          </view>
          <view class="flex-1 min-w-0">
            <text class="text-sm font-medium line-clamp-1" style="color: #1F2937">{{ dl.title }}</text>
            <text class="text-xs" style="color: #9CA3AF">{{ formatTime(dl.createTime) }}</text>
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
    refresherEnabled: true,
    showRefresherWhenReload: true,
    showTabbar: true,
    hideNav: false,
    showNavBack: false,
    navTitle: '我的',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const userInfo = ref({})
  const downloadedList = ref([])

  onLoad(() => { updateUserInfo() })
  onShow(() => { updateUserInfo(); loadDownloaded() })

  function scroll(e) { state.value.isScroll = e.detail.scrollTop > 0 }

  function updateUserInfo() { userInfo.value = vk.vuex.get('$user.info') || {} }

  async function loadDownloaded() {
    const res = await vk.callFunction({ url: 'client/pub_index.getDownloadHistory', data: { limit: 5 } })
    if (res.code === 1) downloadedList.value = res.data || []
  }

  function queryList() { paging.value?.complete([]) }
  function goLogin() { vk.navigateTo('/pages/login/index') }
  function goDownloadHistory() { vk.navigateTo('/pages/my/download-history') }
  function goPrivacy() { vk.navigateTo('/pages/my/privacy') }
  function openDownload(dl) { vk.navigateTo(`/pages/category/detail?id=${dl.textbookId}`) }

  function formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
</script>

<style lang="scss" scoped></style>
