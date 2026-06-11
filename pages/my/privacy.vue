<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 头部 -->
      <view class="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden" style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)">
        <view class="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-6" :style="{ backgroundColor: th.primary }" />
        <view class="w-12 h-12 rounded-2xl flex items-center justify-center relative z-10" :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }">
          <yy-icon name="ri:shield-check-line" size="24" color="#ffffff" />
        </view>
        <view class="relative z-10">
          <text class="text-base font-bold" style="color: #1F2937">隐私与协议</text>
          <text class="text-xs mt-1" style="color: #9CA3AF">更新于 2025年6月</text>
        </view>
      </view>

      <!-- 内容区 -->
      <view class="rounded-2xl p-5 flex-col gap-6" style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)">
        <view v-for="(section, idx) in sections" :key="idx" class="flex-col gap-3">
          <view class="flex items-center gap-3">
            <view class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" :style="{ background: `linear-gradient(135deg, ${th.primaryLight}, ${th.primaryLight})` }">
              <text class="text-xs font-bold" :style="{ color: th.primary }">{{ idx + 1 }}</text>
            </view>
            <text class="text-sm font-bold" style="color: #1F2937">{{ section.title }}</text>
          </view>
          <text class="text-sm leading-relaxed pl-10" style="color: #6B7280">{{ section.content }}</text>
        </view>
      </view>

      <!-- 底部 -->
      <view class="flex items-center justify-center gap-2 py-2">
        <yy-icon name="ri:mail-line" size="14" style="color: #D1D5DB" />
        <text class="text-xs" style="color: #9CA3AF">如有疑问请联系客服</text>
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
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '隐私与协议',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()

  const sections = [
    { title: '信息收集', content: '我们仅收集您在使用服务过程中必要的设备信息（如微信 OpenID）与您主动提交的教材查询、下载等操作记录。不会收集您的个人身份信息。' },
    { title: '信息使用', content: '收集的信息用于提供教材查询与下载服务、改善用户体验、统计应用使用情况。您的联系方式不会被用于任何营销推广用途。' },
    { title: '信息存储与安全', content: '您的数据存储在阿里云 UniCloud 云端服务器，采用行业标准加密传输技术（HTTPS）。我们将采取合理的安全措施保护您的数据。' },
    { title: '信息共享', content: '未经您的明确同意，我们不会向任何第三方共享您的个人信息。法律法规另有规定的情况除外。' },
    { title: '用户权利', content: '您可以随时在应用中查看、更正您的个人信息，或要求删除您的账号数据。删除数据后，相关记录将不可恢复。' },
  ]

  onLoad(() => {})
  onShow(() => {})

  function scroll(e) { state.value.isScroll = e.detail.scrollTop > 0 }
  function queryList() { paging.value?.complete([]) }
</script>

<style lang="scss" scoped></style>
