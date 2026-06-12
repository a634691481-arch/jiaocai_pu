<template>
  <view class="login-page" :style="themeVars">
    <view class="login-bg">
      <view class="login-glow login-glow-1" />
      <view class="login-glow login-glow-2" />
      <view class="login-glow login-glow-3" />
    </view>

    <view class="login-content">
      <!-- Brand -->
      <view class="brand-section">
        <view class="brand-logo-wrap">
          <view class="brand-ring brand-ring-outer" />
          <view class="brand-ring brand-ring-inner" />
          <view class="brand-icon-box">
            <view class="brand-icon-glow" />
            <yy-icon name="ri:book-2-fill" size="36" color="#ffffff" />
            <view class="brand-star">
              <yy-icon name="ri:star-fill" size="14" color="#FCD34D" />
            </view>
          </view>
        </view>
        <text class="brand-title">教材铺</text>
        <text class="brand-subtitle">海量教材 · 免费下载 · 便捷高效</text>
      </view>

      <!-- Feature Cards -->
      <view class="feature-list">
        <view v-for="(item, idx) in featureList" :key="idx" class="feature-card">
          <view class="feature-icon-wrap">
            <yy-icon :name="item.icon" size="22" :color="th.primary" />
          </view>
          <view class="feature-info">
            <text class="feature-title">{{ item.title }}</text>
            <text class="feature-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <!-- Agreement -->
      <view class="agreement-row">
        <text class="agreement-text">
          登录即代表同意
          <text class="agreement-link" @click="toPrivacy">《隐私与协议》</text>
        </text>
      </view>
    </view>

    <!-- Login Button -->
    <view class="login-bottom">
      <view class="login-btn" :class="{ 'login-btn--loading': loginLoading }" @click="onLogin">
        <view class="login-btn-bg" :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }" />
        <text class="login-btn-text">{{ loginLoadingText }}</text>
        <yy-icon v-if="!loginLoading" name="ri:login-circle-line" size="22" color="#ffffff" />
        <u-loading v-else mode="circle" :size="32" color="#ffffff" />
      </view>
    </view>
  </view>
</template>

<script setup>
  const th = uni.$u.color

  function hexToRgb(hex) {
    const num = parseInt(hex.replace('#', ''), 16)
    return `${(num >> 16) & 0xff}, ${(num >> 8) & 0xff}, ${num & 0xff}`
  }

  const themeVars = computed(() => ({
    '--clr-primary': th.primary,
    '--clr-primary-rgb': hexToRgb(th.primary),
    '--clr-primary-dark': th.primaryDark,
    '--clr-error-rgb': hexToRgb(th.error),
    '--clr-text': '#2d2320',
    '--clr-muted': '#8c8173',
    '--clr-muted-light': '#b8aea4',
  }))

  const featureList = [
    { icon: 'ri:file-text-line', title: '海量资源', desc: '覆盖小学到初中全部年级科目' },
    { icon: 'ri:download-2-line', title: '免费下载', desc: '观看广告后即可免费下载PDF教材' },
    { icon: 'ri:history-line', title: '下载记录', desc: '登录后可查看和管理下载历史' },
  ]

  const loginLoading = ref(false)
  const loginLoadingText = ref('立即登录')

  function onLogin() {
    doLogin()
  }

  function toPrivacy() {
    vk.navigateTo('/pages/my/privacy')
  }

  async function doLogin() {
    loginLoading.value = true
    loginLoadingText.value = '登录中...'
    vk.showLoading({ title: '登录中...', mask: true })

    try {
      const data = await new Promise((resolve, reject) => {
        vk.userCenter.loginByWeixin({
          data: { type: '' },
          success: res => resolve(res),
          fail: err => reject(err),
        })
      })

      const userData = data.userInfo || data
      vk.vuex.set('$user.userInfo', userData)

      vk.showLoading({ title: '登录成功，正在跳转...', mask: true })

      const originalPage = vk.navigate.getOriginalPage()
      vk.redirectTo(originalPage?.url || '/pages/my/index')
    } catch (error) {
      vk.toast('登录失败，请稍后重试', 'none', 2000)
    } finally {
      loginLoading.value = false
      loginLoadingText.value = '立即登录'
      vk.hideLoading()
    }
  }
</script>

<style lang="scss" scoped>
  .login-page {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #f7f5f0;
    overflow: hidden;
  }

  .login-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .login-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(80rpx);
  }

  .login-glow-1 {
    width: 500rpx;
    height: 500rpx;
    top: -160rpx;
    left: -120rpx;
    background: rgba(var(--clr-primary-rgb), 0.08);
  }
  .login-glow-2 {
    width: 360rpx;
    height: 360rpx;
    top: 80rpx;
    right: -100rpx;
    background: rgba(var(--clr-error-rgb), 0.05);
  }
  .login-glow-3 {
    width: 300rpx;
    height: 300rpx;
    bottom: 200rpx;
    left: -80rpx;
    background: rgba(var(--clr-primary-rgb), 0.04);
  }

  .login-content {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 120rpx 40rpx 40rpx;
  }

  /* Brand */
  .brand-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 60rpx;
  }

  .brand-logo-wrap {
    position: relative;
    margin-bottom: 28rpx;
  }

  .brand-ring {
    position: absolute;
    border-radius: 50%;
    border: 2rpx solid;
  }

  .brand-ring-outer {
    width: 160rpx;
    height: 160rpx;
    top: -20rpx;
    left: -20rpx;
    border-color: rgba(var(--clr-primary-rgb), 0.08);
    animation: brandSpin 20s linear infinite;
  }
  .brand-ring-inner {
    width: 132rpx;
    height: 132rpx;
    top: -6rpx;
    left: -6rpx;
    border-color: rgba(var(--clr-primary-rgb), 0.04);
    border-style: dashed;
    animation: brandSpin 12s linear infinite reverse;
  }

  @keyframes brandSpin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .brand-icon-box {
    position: relative;
    width: 120rpx;
    height: 120rpx;
    border-radius: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, var(--clr-primary), var(--clr-primary-dark));
    box-shadow:
      0 12rpx 40rpx rgba(var(--clr-primary-rgb), 0.3),
      inset 0 1rpx 0 rgba(255, 255, 255, 0.15);
  }

  .brand-icon-glow {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.25), transparent);
  }

  .brand-star {
    position: absolute;
    top: -4rpx;
    right: -12rpx;
  }

  .brand-title {
    font-size: 48rpx;
    font-weight: 800;
    color: var(--clr-text, #2d2320);
    letter-spacing: 4rpx;
    font-family: Georgia, 'Noto Serif SC', serif;
  }
  .brand-subtitle {
    font-size: 24rpx;
    color: var(--clr-muted, #8c8173);
    margin-top: 8rpx;
  }

  /* Features */
  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  .feature-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx 28rpx;
    background: #ffffff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
    transition: all 0.2s ease;
  }

  .feature-card:active {
    transform: scale(0.98);
  }

  .feature-icon-wrap {
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(var(--clr-primary-rgb), 0.06);
  }
  .feature-info {
    flex: 1;
    min-width: 0;
  }
  .feature-title {
    font-size: 28rpx;
    font-weight: 700;
    color: var(--clr-text, #2d2320);
    line-height: 1.3;
  }
  .feature-desc {
    font-size: 22rpx;
    color: var(--clr-muted, #8c8173);
    margin-top: 4rpx;
  }

  /* Agreement */
  .agreement-row {
    display: flex;
    justify-content: center;
    margin-top: auto;
    padding-top: 40rpx;
  }

  .agreement-text {
    font-size: 24rpx;
    color: var(--clr-muted-light, #b8aea4);
  }
  .agreement-link {
    color: var(--clr-primary);
    font-weight: 600;
    text-decoration: underline;
  }

  /* Bottom Button */
  .login-bottom {
    position: relative;
    z-index: 10;
    padding: 20rpx 40rpx 48rpx;
  }

  .login-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    height: 96rpx;
    border-radius: 48rpx;
    overflow: hidden;
    transition: all 0.25s ease;
  }

  .login-btn:active {
    transform: scale(0.97);
  }

  .login-btn--loading {
    opacity: 0.8;
  }

  .login-btn-bg {
    position: absolute;
    inset: 0;
    box-shadow: 0 8rpx 32rpx rgba(var(--clr-primary-rgb), 0.25);
  }

  .login-btn-text {
    position: relative;
    font-size: 30rpx;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 2rpx;
  }
</style>
