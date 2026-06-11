<template>
  <view class="relative flex flex-col min-h-screen overflow-hidden" style="background-color: #f5f3f7">
    <!-- 多层背景渐变装饰 -->
    <view
      class="absolute -top-16 -left-8 w-64 h-64 rounded-full blur-3xl"
      :style="{ background: 'rgba(139,95,191,0.12)' }"
    />
    <view
      class="absolute -top-16 -right-8 w-52 h-52 rounded-full blur-3xl"
      :style="{ background: 'rgba(214,198,225,0.5)' }"
    />
    <view
      class="absolute top-48 -right-12 w-40 h-40 rounded-full blur-3xl"
      :style="{ background: 'rgba(139,95,191,0.06)' }"
    />

    <!-- 内容区 -->
    <view class="relative z-10 flex flex-col flex-1 p-6 pt-16">
      <!-- 品牌 Logo -->
      <view class="flex flex-col items-center gap-5 mt-10 mb-8">
        <view class="relative">
          <!-- 外层装饰光环 -->
          <view
            class="absolute -inset-4 rounded-full"
            style="
              background: conic-gradient(
                from 0deg,
                #8b5fbf 0%,
                transparent 30%,
                #d6c6e1 60%,
                transparent 80%,
                #8b5fbf 100%
              );
            "
          />
          <view
            class="absolute -inset-2 rounded-full"
            style="background: conic-gradient(from 180deg, #61398f 0%, transparent 40%, #d6c6e1 70%, transparent 100%)"
          />
          <!-- 主图标容器 -->
          <view
            class="relative size-28 rounded-[32rpx] flex items-center justify-center overflow-hidden"
            style="
              background: linear-gradient(145deg, #8b5fbf, #61398f);
              box-shadow:
                0 12rpx 40rpx rgba(139, 95, 191, 0.35),
                inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
            "
          >
            <!-- 装饰光晕 -->
            <view
              class="absolute -top-4 -right-4 size-14 rounded-full opacity-25"
              style="background: radial-gradient(circle, #ffffff, transparent)"
            />
            <view
              class="absolute -bottom-2 -left-2 size-10 rounded-full opacity-15"
              style="background: radial-gradient(circle, #ffffff, transparent)"
            />
            <!-- 书 + 星星组合 -->
            <view class="relative z-10 flex items-center justify-center">
              <yy-icon name="ri:book-2-fill" size="34" color="#ffffff" />
              <yy-icon
                name="ri:star-fill"
                size="16"
                color="#FCD34D"
                style="position: absolute; top: -6rpx; right: -10rpx"
              />
            </view>
          </view>
        </view>
        <view class="flex flex-col items-center gap-1">
          <view class="flex items-center gap-2">
            <view class="w-1.5 h-6 rounded-full" style="background: linear-gradient(180deg, #8b5fbf, #61398f)" />
            <text class="text-3xl font-extrabold" style="color: #4a4a4a; letter-spacing: 2rpx">教材铺</text>
          </view>
          <text class="text-sm" style="color: #878787">海量教材 · 免费下载 · 便捷高效</text>
        </view>
      </view>

      <!-- 功能介绍 -->
      <view class="flex flex-col gap-3.5">
        <view
          class="rounded-2xl flex items-center gap-4 p-4 overflow-hidden"
          style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(139, 95, 191, 0.06)"
          v-for="(item, idx) in featureList"
          :key="idx"
        >
          <view
            class="w-1 h-10 rounded-full shrink-0"
            :style="{ background: `linear-gradient(180deg, #8B5FBF, #61398F)` }"
          />
          <view
            class="size-11 rounded-xl shrink-0 flex items-center justify-center"
            :style="{ backgroundColor: 'rgba(139,95,191,0.08)' }"
          >
            <yy-icon :name="item.icon" size="22" color="#8B5FBF" />
          </view>
          <view class="flex flex-col gap-0.5 flex-1 min-w-0">
            <view class="text-sm font-semibold" style="color: #4a4a4a">{{ item.title }}</view>
            <view class="text-xs" style="color: #878787">{{ item.desc }}</view>
          </view>
        </view>
      </view>

      <!-- 隐私协议入口 -->
      <view class="flex justify-center mt-5">
        <text class="text-xs" style="color: #9ca3af">
          登录即代表同意
          <text class="underline font-medium" style="color: #8b5fbf" @click="toPrivacy">《隐私与协议》</text>
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
    background: `linear-gradient(135deg, #8B5FBF, #61398F)`,
    boxShadow: `0 6px 16px rgba(139,95,191,0.3)`,
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
