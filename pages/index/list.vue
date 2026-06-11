<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-3 p-3">
      <view class="grid grid-cols-3 gap-3">
        <view
          v-for="item in state.dataList"
          :key="item._id"
          class="rounded-xl overflow-hidden active:scale-[0.96] transition-all duration-250"
          style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)"
          @click="goDetail(item)"
        >
          <view class="relative" style="aspect-ratio: 3/4">
            <image :src="item.cover" mode="aspectFill" class="w-full h-full" :style="{ backgroundColor: th.primaryLight }" @error="onCoverError(item)" />
            <view class="absolute inset-0" style="background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.18) 100%)" />
          </view>
          <view class="p-2.5">
            <text class="text-xs font-semibold line-clamp-1" style="color: #1F2937">{{ item.title }}</text>
            <text class="text-xs mt-0.5" style="color: #9CA3AF">{{ item.publisher || '' }}</text>
          </view>
        </view>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  const th = uni.$u.color

  const pagingConfig = ref({
    auto: true,
    refresherEnabled: true,
    showRefresherWhenReload: true,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '教材列表',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const grade = ref('')
  const subject = ref('')

  onLoad((options) => {
    grade.value = options.grade || ''
    subject.value = options.subject || ''
    pagingConfig.value.navTitle = decodeURIComponent(options.title || '教材列表')
  })

  onShow(() => {})

  function scroll(e) { state.value.isScroll = e.detail.scrollTop > 0 }

  async function queryList(page, limit) {
    const res = await vk.callFunction({
      url: 'client/pub_index.getTextbookList',
      data: { grade: grade.value, subject: subject.value, pageIndex: page, pageSize: limit },
    })
    if (res.code === 1) paging.value?.complete(res.data || [])
    else paging.value?.complete(false)
  }

  function goDetail(item) { vk.navigateTo(`/pages/index/detail?id=${item._id}`) }
  function onCoverError(item) { item.cover = '' }
</script>

<style lang="scss" scoped></style>
