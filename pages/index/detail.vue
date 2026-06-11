<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 封面区 -->
      <view class="flex gap-4">
        <view class="relative rounded-2xl overflow-hidden shrink-0" style="width: 240rpx; height: 320rpx; box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.08)">
          <view class="absolute inset-0" :style="{ background: `linear-gradient(135deg, ${th.primaryLight}, ${th.accentLight || '#F0FDFA'})` }" />
          <view class="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" :style="{ backgroundColor: th.primary }" />
          <view class="absolute -bottom-6 -left-4 w-16 h-16 rounded-full opacity-15" :style="{ backgroundColor: th.primaryDark }" />
          <image :src="detail.cover" mode="aspectFill" class="w-full h-full relative z-10" @error="onCoverError" />
        </view>
        <view class="flex-col gap-1.5 flex-1 justify-center">
          <text class="text-base font-bold leading-snug" style="color: #1F2937">{{ detail.title || '加载中…' }}</text>
          <view class="flex items-center gap-1.5">
            <view class="w-4 h-4 rounded-full flex items-center justify-center opacity-70" :style="{ backgroundColor: th.primaryLight }">
              <text class="text-xs" :style="{ color: th.primary }">▪</text>
            </view>
            <text class="text-xs" style="color: #6B7280">{{ detail.publisher || '未知出版社' }}</text>
          </view>
          <view class="flex items-center gap-1.5">
            <view class="w-4 h-4 rounded-full flex items-center justify-center opacity-70" :style="{ backgroundColor: th.primaryLight }">
              <text class="text-xs" :style="{ color: th.primary }">●</text>
            </view>
            <text class="text-xs" style="color: #6B7280">{{ detail.grade || '' }} · {{ detail.subject || '' }}</text>
          </view>
        </view>
      </view>

      <!-- 下载按钮 -->
      <view
        class="rounded-2xl py-4 text-center font-bold text-base active:scale-[0.97] transition-all duration-250 relative overflow-hidden text-white"
        :style="{ background: DOWNLOAD_STATES[downloadState].bg, boxShadow: downloadState === 'idle' ? `0 6rpx 24rpx ${th.primary}4d` : '' }"
        @click="handleDownload"
      >
        <text class="relative z-10">{{ DOWNLOAD_STATES[downloadState].text }}</text>
        <text v-if="downloadState === 'downloading'" class="relative z-10">{{ downloadProgress }}%</text>
      </view>

      <!-- 统计 -->
      <view class="flex rounded-2xl overflow-hidden" style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)">
        <view class="flex-1 flex-col items-center py-4 relative">
          <text class="text-lg font-bold" :style="{ color: th.primaryDark }">{{ formatSize(detail.fileSize) }}</text>
          <text class="text-xs mt-1" style="color: #9CA3AF">📦 文件大小</text>
        </view>
        <view class="w-px self-stretch" style="background: #F3F4F6" />
        <view class="flex-1 flex-col items-center py-4">
          <text class="text-lg font-bold" :style="{ color: '#2563EB' }">{{ detail.viewCount || 0 }}</text>
          <text class="text-xs mt-1" style="color: #9CA3AF">👁️ 浏览</text>
        </view>
        <view class="w-px self-stretch" style="background: #F3F4F6" />
        <view class="flex-1 flex-col items-center py-4">
          <text class="text-lg font-bold" :style="{ color: '#059669' }">{{ detail.downloadCount || 0 }}</text>
          <text class="text-xs mt-1" style="color: #9CA3AF">⬇️ 下载</text>
        </view>
      </view>

      <!-- 教材简介 -->
      <view class="rounded-2xl p-5" style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)">
        <view class="flex items-center gap-2 mb-3">
          <view class="w-1 h-5 rounded-full" :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.primaryDark})` }" />
          <text class="text-sm font-bold" style="color: #1F2937">📖 教材简介</text>
        </view>
        <text class="text-sm leading-relaxed" style="color: #6B7280">{{ detail.description || '暂无简介' }}</text>
      </view>

      <!-- 相关推荐 -->
      <view v-if="state.dataList.length" class="flex-col gap-3">
        <view class="flex items-center gap-2">
          <view class="w-1 h-5 rounded-full" :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.primaryDark})` }" />
          <text class="text-sm font-bold" style="color: #1F2937">📚 相关推荐</text>
        </view>
        <view class="grid grid-cols-3 gap-3">
          <view
            v-for="item in state.dataList"
            :key="item._id"
            class="rounded-xl overflow-hidden active:scale-[0.96] transition-all duration-250"
            style="background: #FFFFFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04)"
            @click="goRelated(item)"
          >
            <view class="relative" style="aspect-ratio: 3/4">
              <image :src="item.cover" mode="aspectFill" class="w-full h-full" :style="{ backgroundColor: th.primaryLight }" />
              <view class="absolute inset-0" style="background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.15) 100%)" />
            </view>
            <view class="p-2.5">
              <text class="text-xs font-semibold line-clamp-1" style="color: #1F2937">{{ item.title }}</text>
            </view>
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
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '教材详情',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const detail = ref({})
  const downloadState = ref('idle')
  const downloadProgress = ref(0)

  const DOWNLOAD_STATES = {
    idle: { key: 'idle', text: '📥 免费下载教材', bg: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` },
    loading: { key: 'loading', text: '正在获取下载链接…', bg: 'linear-gradient(135deg, #9CA3AF, #B0B7C3)' },
    downloading: { key: 'downloading', text: '', bg: 'linear-gradient(135deg, #0D9488, #14B8A6)' },
    success: { key: 'success', text: '✅ 下载完成，可在微信中查看', bg: 'linear-gradient(135deg, #059669, #10B981)' },
    error: { key: 'error', text: '❌ 下载失败 · 点击重试', bg: 'linear-gradient(135deg, #EF4444, #F87171)' },
  }

  onLoad((options) => { loadDetail(options.id) })
  onShow(() => {})

  function scroll(e) { state.value.isScroll = e.detail.scrollTop > 0 }

  async function loadDetail(id) {
    const res = await vk.callFunction({ url: 'client/pub_index.getTextbookDetail', data: { id } })
    if (res.code === 1) detail.value = res.data || {}
  }

  async function queryList() {
    if (!detail.value.subject) { paging.value?.complete([]); return }
    const res = await vk.callFunction({
      url: 'client/pub_index.getTextbookList',
      data: { subject: detail.value.subject, limit: 6 },
    })
    if (res.code === 1) paging.value?.complete((res.data || []).filter(i => i._id !== detail.value._id))
    else paging.value?.complete(false)
  }

  async function handleDownload() {
    if (downloadState.value === 'downloading' || downloadState.value === 'loading') return
    if (downloadState.value === 'error') { downloadState.value = 'idle'; return }
    downloadState.value = 'loading'
    try {
      const res = await vk.callFunction({ url: 'client/pub_index.getDownloadUrl', data: { id: detail.value._id } })
      if (res.code !== 1) { vk.toast('获取链接失败'); downloadState.value = 'error'; return }
      const task = uni.downloadFile({
        url: res.data.url,
        success(r) {
          if (r.statusCode === 200) {
            uni.openDocument({ filePath: r.tempFilePath, success() { downloadState.value = 'success' }, fail() { downloadState.value = 'error' } })
          } else { downloadState.value = 'error' }
        },
        fail() { downloadState.value = 'error' },
      })
      task.onProgressUpdate(r => { downloadProgress.value = r.progress; downloadState.value = 'downloading' })
    } catch (e) { downloadState.value = 'error' }
  }

  function goRelated(item) { vk.navigateTo(`/pages/index/detail?id=${item._id}`) }
  function onCoverError() { detail.value.cover = '' }

  function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }
</script>

<style lang="scss" scoped></style>
