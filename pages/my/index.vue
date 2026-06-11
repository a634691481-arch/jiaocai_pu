<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex flex-col gap-5 p-4">
      <!-- 用户卡片 -->
      <view
        class="rounded-2xl relative p-5 overflow-hidden"
        :style="{
          background: `linear-gradient(135deg, ${th.primary}08, #ffffff 70%, ${th.primaryLight}40)`,
          boxShadow: '0 4rpx 24rpx rgba(0,0,0,0.04)',
        }"
      >
        <view
          class="-top-6 -right-6 opacity-10 absolute w-32 h-32 rounded-full"
          :style="{ backgroundColor: th.primary }"
        />
        <view
          class="-bottom-4 -left-4 opacity-8 absolute w-20 h-20 rounded-full"
          :style="{ backgroundColor: th.primaryDark }"
        />

        <!-- 已登录 -->
        <view v-if="userInfo._id" class="relative z-10 flex items-center gap-4">
          <view class="relative">
            <image
              :src="userInfo.avatar || ''"
              class="w-14 h-14 rounded-full"
              style="background: #f3f4f6; border: 2rpx solid #ffffff"
              mode="aspectFill"
            />
            <view
              class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: th.primary }"
            >
              <yy-icon name="ri:check-line" size="10" color="#ffffff" />
            </view>
          </view>
          <view class="flex-1">
            <text class="text-base font-bold" style="color: #1f2937">{{ userInfo.nickname || '微信用户' }}</text>
            <text class="mt-0.5 text-xs" style="color: #94a3b8">欢迎使用教材宝 📖</text>
          </view>
          <yy-icon name="ri:arrow-right-s-line" size="20" style="color: #d1d5db" />
        </view>

        <!-- 未登录 -->
        <view v-else class="relative z-10 flex items-center gap-4" @click="goLogin">
          <view
            class="w-14 h-14 flex items-center justify-center rounded-full"
            style="background: #f8fafc; border: 2rpx dashed #e2e8f0"
          >
            <yy-icon name="ri:user-line" size="24" style="color: #94a3b8" />
          </view>
          <view class="flex-1">
            <text class="text-base font-bold" style="color: #1f2937">点击登录</text>
            <text class="mt-0.5 text-xs" style="color: #94a3b8">登录后享受完整服务</text>
          </view>
          <view
            class="px-4 py-2 rounded-full relative overflow-hidden active:scale-[0.96] transition-transform duration-200 shadow-sm"
            :style="{
              background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})`,
              boxShadow: `0 4rpx 12rpx ${th.primary}3d`,
            }"
          >
            <text class="relative z-10 text-xs font-medium text-white">去登录</text>
          </view>
        </view>
      </view>

      <!-- 菜单卡片 -->
      <view
        class="rounded-2xl overflow-hidden"
        style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)"
      >
        <view
          class="active:bg-gray-50 flex items-center gap-4 p-4 transition-all duration-150"
          hover-class="active-scale"
          @click="goDownloadHistory"
        >
          <view
            class="w-9 h-9 rounded-xl flex items-center justify-center"
            :style="{ background: `linear-gradient(135deg, ${th.primaryLight}, ${th.primary}15)` }"
          >
            <yy-icon name="ri:download-2-line" size="18" :color="th.primary" />
          </view>
          <text class="flex-1 text-sm font-medium" style="color: #1f2937">下载历史</text>
          <text class="mr-1 text-xs" style="color: #94a3b8">查看全部</text>
          <yy-icon name="ri:arrow-right-s-line" size="16" style="color: #cbd5e1" />
        </view>
        <view class="h-px mx-4" style="background: #f1f5f9" />
        <view
          class="active:bg-gray-50 flex items-center gap-4 p-4 transition-all duration-150"
          hover-class="active-scale"
          @click="goPrivacy"
        >
          <view
            class="w-9 h-9 rounded-xl flex items-center justify-center"
            :style="{ background: `linear-gradient(135deg, ${th.primaryLight}, ${th.primary}15)` }"
          >
            <yy-icon name="ri:shield-check-line" size="18" :color="th.primary" />
          </view>
          <text class="flex-1 text-sm font-medium" style="color: #1f2937">隐私与协议</text>
          <yy-icon name="ri:arrow-right-s-line" size="16" style="color: #cbd5e1" />
        </view>
        <view class="h-px mx-4" style="background: #f1f5f9" />
        <view
          class="active:bg-gray-50 flex items-center gap-4 p-4 transition-all duration-150"
          hover-class="active-scale"
          @click="showThemePicker = true"
        >
          <view
            class="w-9 h-9 rounded-xl flex items-center justify-center"
            :style="{ background: `linear-gradient(135deg, ${th.primaryLight}, ${th.primary}15)` }"
          >
            <yy-icon name="ri:paint-brush-line" size="18" :color="th.primary" />
          </view>
          <text class="flex-1 text-sm font-medium" style="color: #1f2937">主题切换</text>
          <view
            class="w-5 h-5 rounded-full border-2 shrink-0"
            :style="{ backgroundColor: th.primary, borderColor: th.primaryLight }"
          />
        </view>
      </view>

      <!-- 最近下载 -->
      <view v-if="downloadedList.length" class="flex-col gap-3">
        <view class="flex items-center gap-2 px-0.5">
          <view
            class="w-1 h-5 rounded-full"
            :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.primaryDark})` }"
          />
          <text class="text-sm font-bold" style="color: #1f2937">最近下载</text>
          <text class="ml-auto text-xs" style="color: #94a3b8">共 {{ downloadedList.length }} 本</text>
        </view>
        <view class="flex-col gap-2.5">
          <view
            v-for="dl in downloadedList"
            :key="dl._id"
            class="rounded-xl flex items-center gap-3 p-3.5 transition-all duration-150 active:scale-[0.98]"
            style="background: #ffffff; box-shadow: 0 1rpx 6rpx rgba(0,0,0,0.03)"
            @click="openDownload(dl)"
          >
            <view
              class="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
              style="background: linear-gradient(135deg, #fef3c7, #fffbeb)"
            >
              <text class="text-lg">📄</text>
            </view>
            <view class="flex-1 min-w-0">
              <text class="line-clamp-1 text-sm font-medium" style="color: #1f2937">{{ dl.title }}</text>
              <view class="flex items-center gap-2 mt-0.5">
                <yy-icon name="ri:time-line" size="12" style="color: #94a3b8" />
                <text class="text-xs" style="color: #94a3b8">{{ formatTime(dl.createTime) }}</text>
              </view>
            </view>
            <yy-icon name="ri:eye-line" size="16" style="color: #cbd5e1" />
          </view>
        </view>
      </view>
    </view>
  </yy-paging>

  <!-- 主题切换弹窗 -->
  <yy-theme-picker v-model="showThemePicker" />
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
  const showThemePicker = ref(false)

  onLoad(() => {
    updateUserInfo()
  })
  onShow(() => {
    updateUserInfo()
    loadDownloaded()
  })

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function updateUserInfo() {
    userInfo.value = vk.vuex.get('$user.info') || {}
  }

  async function loadDownloaded() {
    const res = await vk.callFunction({ url: 'client/pub_index.getDownloadHistory', data: { limit: 5 } })
    if (res.code === 1) downloadedList.value = res.data || []
  }

  function queryList() {
    paging.value?.complete([1])
  }
  function goLogin() {
    vk.navigateTo('/pages/login/index')
  }
  function goDownloadHistory() {
    vk.navigateTo('/pages/my/download-history')
  }
  function goPrivacy() {
    vk.navigateTo('/pages/my/privacy')
  }
  function openDownload(dl) {
    vk.navigateTo(`/pages/index/detail?id=${dl.textbookId}`)
  }

  function formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
</script>

<style lang="scss" scoped>
.active-scale {
  transform: scale(0.98);
  transition: transform 0.15s ease;
}
</style>
