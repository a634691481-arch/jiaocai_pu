<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 用户卡片 — 渐变头像 -->
      <view
        class="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden active:scale-[0.98] transition-transform duration-200"
        style="background: linear-gradient(135deg, #FFFBEB, #FEF3C7)"
        @click="handleLoginClick"
      >
        <view class="absolute top-0 right-0 w-24 h-24 rounded-full opacity-15" style="background: radial-gradient(circle, #D97706, transparent 70%); transform: translate(30%, -30%)" />
        <view
          class="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden relative"
          style="background: linear-gradient(135deg, #D97706, #F59E0B); box-shadow: 0 4rpx 16rpx rgba(217,119,6,0.25)"
        >
          <image v-if="userInfo.avatar" :src="userInfo.avatar" class="w-full h-full" mode="aspectFill" />
          <yy-icon v-else name="ri:user-3-line" size="24" color="#FFFFFF" />
        </view>
        <view class="flex-1 relative z-10">
          <text class="text-base font-bold" style="color: #92400E">{{ userInfo.name || '未登录' }}</text>
          <view class="flex items-center gap-1 mt-1">
            <yy-icon name="ri:arrow-right-s-line" size="14" style="color: #B45309" />
            <text class="text-xs" style="color: #B45309">{{ userInfo.name ? '查看下载记录' : '登录解锁全部功能' }}</text>
          </view>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="rounded-2xl overflow-hidden" style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)">
        <view class="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors" @click="goLogin">
          <view class="flex items-center gap-3">
            <view class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #FEF3C7, #FDE68A)">
              <yy-icon name="ri:download-2-line" size="16" color="#D97706" />
            </view>
            <text class="text-sm font-medium" style="color: #374151">下载历史</text>
          </view>
          <yy-icon name="ri:arrow-right-s-line" size="18" color="#D1D5DB" />
        </view>
        <view class="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors" style="border-top: 1rpx solid #F3F4F6">
          <view class="flex items-center gap-3">
            <view class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #F0FDFA, #CCFBF1)">
              <yy-icon name="ri:shield-check-line" size="16" color="#0D9488" />
            </view>
            <text class="text-sm font-medium" style="color: #374151">隐私与协议</text>
          </view>
          <yy-icon name="ri:arrow-right-s-line" size="18" color="#D1D5DB" />
        </view>
      </view>

      <!-- 下载历史列表 -->
      <view v-if="isLogin">
        <view class="flex items-center gap-2 mb-3">
          <view class="w-1 h-4 rounded-full" style="background: linear-gradient(180deg, #D97706, #F59E0B)" />
          <text class="text-sm font-bold" style="color: #1F2937">最近下载</text>
        </view>

        <view v-if="state.dataList.length" class="flex-col gap-2">
          <view
            v-for="item in state.dataList"
            :key="item._id"
            class="rounded-xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
            style="background: #FFFFFF; box-shadow: 0 1rpx 6rpx rgba(0,0,0,0.03)"
          >
            <view class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #FEF3C7, #FDE68A)">
              <yy-icon name="ri:file-pdf-2-line" size="18" color="#D97706" />
            </view>
            <view class="flex-1">
              <text class="text-sm font-medium line-clamp-1" style="color: #1F2937">{{ item.title }}</text>
              <text class="text-xs" style="color: #9CA3AF">{{ formatTime(item.downloadTime) }}</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!state.dataList.length" class="flex flex-col items-center py-10">
          <view class="w-20 h-20 rounded-full flex items-center justify-center mb-3" style="background: linear-gradient(135deg, #FFFBEB, #FEF3C7)">
            <yy-icon name="ri:inbox-line" size="32" color="#D97706" />
          </view>
          <text class="text-sm font-medium" style="color: #6B7280">暂无下载记录</text>
          <text class="text-xs mt-1" style="color: #9CA3AF">去首页浏览教材吧</text>
        </view>
      </view>

      <!-- 未登录引导 -->
      <view v-if="!isLogin" class="flex flex-col items-center py-8">
        <view class="w-20 h-20 rounded-full flex items-center justify-center mb-3" style="background: linear-gradient(135deg, #FFFBEB, #FEF3C7)">
          <yy-icon name="ri:lock-line" size="32" color="#D97706" />
        </view>
        <text class="text-sm font-medium" style="color: #6B7280">登录后查看下载记录</text>
        <view
          class="mt-4 px-8 py-2.5 rounded-full text-sm font-bold text-white active:scale-95 transition-transform"
          style="background: linear-gradient(135deg, #D97706, #F59E0B); box-shadow: 0 4rpx 16rpx rgba(217,119,6,0.3)"
          @click="goLogin"
        >立即登录</view>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  const pagingConfig = ref({
    auto: false,
    refresherEnabled: true,
    showRefresherWhenReload: true,
    showTabbar: true,
    hideNav: false,
    showNavBack: false,
    navTitle: '我的',
    color: '#D97706',
  })

  const state = ref({
    isScroll: false,
    dataList: [],
  })

  const paging = ref()

  const isLogin = ref(false)
  const userInfo = ref({})

  onLoad(() => {})

  onShow(() => {
    checkLogin()
  })

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function checkLogin() {
    const user = vk.pubfn.getUserInfo()
    isLogin.value = !!user.uid
    userInfo.value = {
      name: user.nickname || user.username || '',
      avatar: user.avatar || user.avatar_file?.url || '',
    }
    if (isLogin.value) {
      paging.value?.reload()
    }
  }

  function handleLoginClick() {
    if (isLogin.value) return
    goLogin()
  }

  function goLogin() {
    vk.navigateTo('/pages/login/index')
  }

  async function queryList(page, limit) {
    if (!isLogin.value) {
      paging.value?.complete([])
      return
    }
    const res = await vk.callFunction({
      url: 'client/pub_index.getMyDownloads',
      data: { pageIndex: page, pageSize: limit },
    })
    if (res.code === 1) {
      paging.value?.complete(res.data || [])
    } else {
      paging.value?.complete(false)
    }
  }

  function formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
</script>

<style lang="scss" scoped></style>
