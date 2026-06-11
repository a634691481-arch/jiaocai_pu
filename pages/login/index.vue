<template>
  <view class="bg-gray-50 relative flex flex-col min-h-screen overflow-hidden">
    <!-- 多层背景渐变装饰 -->
    <view
      class="absolute -top-16 -left-8 w-64 h-64 rounded-full blur-3xl"
      :style="{ background: `${uni.$u.color.primary}25` }"
    />
    <view
      class="absolute -top-16 -right-8 w-52 h-52 rounded-full blur-3xl"
      :style="{ background: `${uni.$u.color.primaryLight}` }"
    />
    <view
      class="absolute top-48 -right-12 w-40 h-40 rounded-full blur-3xl"
      :style="{ background: `${uni.$u.color.primary}15` }"
    />

    <!-- 内容区 -->
    <view class="relative z-10 flex flex-col flex-1 p-6 pt-16">
      <!-- 品牌 Logo -->
      <view class="flex flex-col items-center gap-4 mt-8 mb-6">
        <view class="relative">
          <!-- 装饰环 -->
          <view
            class="absolute -inset-3 rounded-full opacity-20"
            :style="{ background: `conic-gradient(from 180deg, ${uni.$u.color.primary}, transparent, ${uni.$u.color.primaryDark}, transparent)` }"
          />
          <view
            class="relative rounded-3xl size-24 flex items-center justify-center shadow-xl"
            :style="{
              backgroundColor: uni.$u.color.primary,
              boxShadow: `0 8rpx 32rpx ${uni.$u.color.primary}4d`,
            }"
          >
            <yy-icon name="ri:book-3-line" size="48" color="#ffffff" />
          </view>
        </view>
        <view class="flex flex-col items-center gap-1.5">
          <view class="text-3xl font-extrabold" style="color: #1f2937">教材宝</view>
          <view class="text-sm" style="color: #94a3b8">精选教材，免费下载</view>
        </view>
      </view>

      <!-- 功能介绍 -->
      <view class="flex flex-col gap-3.5">
        <view
          class="rounded-2xl flex items-center gap-4 p-4 overflow-hidden"
          style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)"
          v-for="(item, idx) in featureList"
          :key="idx"
        >
          <view
            class="w-1 h-10 rounded-full shrink-0"
            :style="{ background: `linear-gradient(180deg, ${uni.$u.color.primary}, ${uni.$u.color.primaryDark})` }"
          />
          <view
            class="size-11 rounded-xl shrink-0 flex items-center justify-center"
            :style="{ backgroundColor: `${uni.$u.color.primary}10` }"
          >
            <yy-icon :name="item.icon" size="22" :color="uni.$u.color.primary" />
          </view>
          <view class="flex flex-col gap-0.5 flex-1 min-w-0">
            <view class="text-sm font-semibold" style="color: #1f2937">{{ item.title }}</view>
            <view class="text-xs" style="color: #94a3b8">{{ item.desc }}</view>
          </view>
        </view>
      </view>

      <!-- 隐私协议入口 -->
      <view class="flex justify-center mt-5">
        <text class="text-xs" style="color: #cbd5e1">
          登录即代表同意
          <text
            class="underline font-medium"
            :style="{ color: uni.$u.color.primary }"
            @click="toPrivacy"
          >《隐私与协议》</text>
        </text>
      </view>
    </view>

    <!-- 底部固定按钮 -->
    <yy-fixed-bottom
      :text="loginLoadingText"
      icon="ri:login-circle-line"
      :disabled="loginLoading"
      :btn-style="loginBtnStyle"
      @click="onLogin"
    />
  </view>
</template>

<script setup>
  const featureList = [
    { icon: 'ri:file-text-line', title: '海量资源', desc: '覆盖小学到初中全部年级科目' },
    { icon: 'ri:download-2-line', title: '免费下载', desc: '观看广告后即可免费下载PDF教材' },
    { icon: 'ri:history-line', title: '下载记录', desc: '登录后可查看和管理下载历史' },
  ]

  const loginLoading = ref(false)
  const loginLoadingText = ref('立即登录')

  const loginBtnStyle = computed(() => ({
    background: `linear-gradient(135deg, ${uni.$u.color.primary}, ${uni.$u.color.primaryDark})`,
    boxShadow: `0 6px 16px ${uni.$u.color.primary}4d`,
  }))

  // 点击登录按钮
  function onLogin() {
    doLogin()
  }

  // 跳转到隐私协议页面
  function toPrivacy() {
    vk.navigateTo('/pages/my/privacy')
  }

  // 执行登录
  async function doLogin() {
    loginLoading.value = true
    loginLoadingText.value = '登录中...'
    vk.showLoading({ title: '登录中...', mask: true })

    try {
      const data = await new Promise((resolve, reject) => {
        vk.userCenter.loginByWeixin({
          data: {
            type: '',
          },
          success: res => {
            resolve(res)
          },
          fail: err => {
            reject(err)
          },
        })
      })

      const tokenData = data.vk_uni_token || data

      vk.showLoading({ title: '登录成功，正在跳转...', mask: true })

      const originalPage = vk.navigate.getOriginalPage()
      vk.redirectTo(originalPage?.url || '/pages/index/index')
    } catch (error) {
      vk.toast('登录失败，请稍后重试', 'none', 2000)
    } finally {
      loginLoading.value = false
      loginLoadingText.value = '立即登录'
      vk.hideLoading()
    }
  }
</script>

<style lang="scss" scoped></style>
