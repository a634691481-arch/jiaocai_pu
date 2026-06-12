<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex flex-col gap-3 p-3" style="background-color: #f5f3f7">
      <!-- 用户卡片 -->
      <view
        class="rounded-2xl relative p-3 overflow-hidden"
        :style="{
          background: `linear-gradient(135deg, ${th.primaryLight}, #ffffff 70%, rgba(255,255,255,0.3))`,
          boxShadow: `0 4rpx 24rpx ${th.primary}1a`,
        }"
      >
        <view
          class="-top-6 -right-6 opacity-10 absolute w-32 h-32 rounded-full"
          :style="{ backgroundColor: th.primaryLight }"
        />
        <view
          class="-bottom-4 -left-4 opacity-8 absolute w-20 h-20 rounded-full"
          :style="{ backgroundColor: th.primaryLight }"
        />

        <!-- 已登录 -->
        <view v-if="userInfo._id" class="relative z-10 flex items-center gap-3">
          <view class="relative">
            <image
              v-if="userInfo.avatar"
              :src="userInfo.avatar"
              class="w-14 h-14 rounded-full"
              style="background: #f3f4f6; border: 2rpx solid #ffffff"
              mode="aspectFill"
            />
            <view
              v-else
              class="w-14 h-14 flex items-center justify-center rounded-full"
              :style="{ background: `${th.primaryLight}`, border: `2rpx solid ${th.primaryLight}` }"
            >
              <yy-icon name="ri:user-smile-line" size="28" :color="th.primary" />
            </view>
            <view
              class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: uni.$u.color.primary }"
            >
              <yy-icon name="ri:check-line" size="10" color="#ffffff" />
            </view>
          </view>
          <view class="items-center flex-1 gap-3">
            <text class="text-base font-bold" style="color: #4a4a4a">{{ userInfo.nickname || '微信用户' }}</text>
          </view>
          <yy-icon name="ri:arrow-right-s-line" size="20" style="color: #d6c6e1" />
        </view>

        <!-- 未登录 -->
        <view v-else class="relative z-10 flex items-center gap-3" @click="goLogin">
          <view
            class="w-14 h-14 flex items-center justify-center rounded-full"
            style="background: #f5f3f7; border: 2rpx dashed #e9e4ed"
          >
            <yy-icon name="ri:user-line" size="24" style="color: #878787" />
          </view>
          <view class="flex-1">
            <!-- <text class="text-base font-bold" style="color: #4a4a4a">点击登录</text> -->
            <text class="mt-3 text-xs" style="color: #878787">登录后享受完整服务</text>
          </view>
          <view
            class="px-5 py-2 rounded-full relative overflow-hidden active:scale-[0.96] transition-transform duration-200 shadow-sm"
            :style="{
              background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})`,
              boxShadow: `0 4rpx 12rpx ${th.primary}40`,
            }"
          >
            <text class="relative z-10 text-xs font-medium text-white">去登录</text>
          </view>
        </view>
      </view>

      <!-- 菜单卡片 -->
      <view class="rounded-2xl overflow-hidden" style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04)">
        <view
          class="active:bg-gray-50 flex items-center gap-3 p-3 transition-all duration-150"
          hover-class="active-scale"
          @click="goDownloadHistory"
        >
          <view class="w-9 h-9 rounded-xl flex items-center justify-center" :style="{ background: th.primaryLight }">
            <yy-icon name="ri:download-2-line" size="18" :color="th.primary" />
          </view>
          <text class="flex-1 text-sm font-medium" style="color: #4a4a4a">下载历史</text>
          <yy-icon name="ri:arrow-right-s-line" size="16" :color="th.primary" />
        </view>
        <view class="h-px mx-3" style="background: #e9e4ed" />
        <view
          class="active:bg-gray-50 flex items-center gap-3 p-3 transition-all duration-150"
          hover-class="active-scale"
          @click="goPrivacy"
        >
          <view class="w-9 h-9 rounded-xl flex items-center justify-center" :style="{ background: th.primaryLight }">
            <yy-icon name="ri:shield-check-line" size="18" :color="th.primary" />
          </view>
          <text class="flex-1 text-sm font-medium" style="color: #4a4a4a">隐私与协议</text>
          <yy-icon name="ri:arrow-right-s-line" size="16" :color="th.primary" />
        </view>
        <view v-if="userInfo._id" class="h-px mx-3" style="background: #e9e4ed" />
        <view
          v-if="userInfo._id"
          class="active:bg-gray-50 flex items-center gap-3 p-3 transition-all duration-150"
          hover-class="active-scale"
          @click="handleLogout"
        >
          <view class="w-9 h-9 rounded-xl flex items-center justify-center" :style="{ background: th.errorLight }">
            <yy-icon name="ri:logout-box-r-line" size="18" :color="th.error" />
          </view>
          <text class="flex-1 text-sm font-medium" :style="{ color: th.error }">退出登录</text>
          <yy-icon name="ri:arrow-right-s-line" size="16" :color="th.errorDisabled" />
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
    color: uni.$u.color.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const userInfo = ref({})

  onLoad(() => {
    updateUserInfo()
  })
  onShow(() => {
    updateUserInfo()
  })

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function updateUserInfo() {
    userInfo.value = vk.vuex.get('$user.userInfo') || {}
  }

  function queryList() {
    paging.value?.complete([1])
  }
  import myfn from '@/common/function/myPubFunction.js'

  function handleLogout() {
    vk.alert('确定要退出登录吗？', '提示', '确定', () => {
      myfn.logout()
    })
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
</script>

<style lang="scss" scoped>
  .active-scale {
    transform: scale(0.98);
    transition: transform 0.15s ease;
  }
</style>
