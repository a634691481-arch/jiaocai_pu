<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <view class="rounded-2xl p-5" style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)">
        <view class="flex items-center gap-3 mb-5 pb-4" style="border-bottom: 1rpx solid #F3F4F6">
          <view class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #FFFBEB, #FEF3C7)">
            <yy-icon name="ri:shield-check-line" size="22" color="#D97706" />
          </view>
          <view>
            <text class="block text-base font-bold" style="color: #1F2937">隐私政策与用户协议</text>
            <text class="text-xs" style="color: #9CA3AF">更新日期：2026年6月11日</text>
          </view>
        </view>

        <view class="flex-col gap-4">
          <view>
            <view class="flex items-center gap-2 mb-2">
              <view class="w-5 h-5 rounded-md flex items-center justify-center" style="background: linear-gradient(135deg, #D97706, #F59E0B)">
                <text class="text-xs text-white font-bold">1</text>
              </view>
              <text class="text-sm font-bold" style="color: #374151">信息收集</text>
            </view>
            <text class="text-xs leading-relaxed" style="color: #6B7280">我们仅收集您的微信昵称、头像用于账户展示。不会收集您的真实姓名、身份证号等敏感信息。</text>
          </view>

          <view>
            <view class="flex items-center gap-2 mb-2">
              <view class="w-5 h-5 rounded-md flex items-center justify-center" style="background: linear-gradient(135deg, #0D9488, #14B8A6)">
                <text class="text-xs text-white font-bold">2</text>
              </view>
              <text class="text-sm font-bold" style="color: #374151">信息使用</text>
            </view>
            <text class="text-xs leading-relaxed" style="color: #6B7280">您的下载记录仅用于为您提供下载历史查询功能，不会被用于其他用途或分享给第三方。</text>
          </view>

          <view>
            <view class="flex items-center gap-2 mb-2">
              <view class="w-5 h-5 rounded-md flex items-center justify-center" style="background: linear-gradient(135deg, #2563EB, #3B82F6)">
                <text class="text-xs text-white font-bold">3</text>
              </view>
              <text class="text-sm font-bold" style="color: #374151">数据安全</text>
            </view>
            <text class="text-xs leading-relaxed" style="color: #6B7280">您的数据存储在阿里云 UniCloud 平台，采用加密传输与存储，确保数据安全。</text>
          </view>

          <view>
            <view class="flex items-center gap-2 mb-2">
              <view class="w-5 h-5 rounded-md flex items-center justify-center" style="background: linear-gradient(135deg, #7C3AED, #8B5CF6)">
                <text class="text-xs text-white font-bold">4</text>
              </view>
              <text class="text-sm font-bold" style="color: #374151">用户权利</text>
            </view>
            <text class="text-xs leading-relaxed" style="color: #6B7280">您可以在"我的"页面查看和下载您的历史记录。如需删除账户或数据，请联系客服。</text>
          </view>

          <view>
            <view class="flex items-center gap-2 mb-2">
              <view class="w-5 h-5 rounded-md flex items-center justify-center" style="background: linear-gradient(135deg, #DC2626, #EF4444)">
                <text class="text-xs text-white font-bold">5</text>
              </view>
              <text class="text-sm font-bold" style="color: #374151">免责声明</text>
            </view>
            <text class="text-xs leading-relaxed" style="color: #6B7280">本小程序提供的教材资源仅供学习参考使用，版权归原出版社所有。请勿将下载资源用于商业用途。</text>
          </view>
        </view>

        <view class="mt-5 pt-4 flex items-center gap-2" style="border-top: 1rpx solid #F3F4F6">
          <yy-icon name="ri:mail-line" size="14" color="#9CA3AF" />
          <text class="text-xs" style="color: #9CA3AF">如有任何疑问，请通过意见反馈联系我们</text>
        </view>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  const pagingConfig = ref({
    auto: false,
    refresherEnabled: true,
    showRefresherWhenReload: true,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '隐私与协议',
    color: '#D97706',
  })

  const state = ref({
    isScroll: false,
    dataList: [],
  })

  const paging = ref()

  onLoad(() => {})
  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function queryList() {
    paging.value?.complete([])
  }
</script>

<style lang="scss" scoped></style>
