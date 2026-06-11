<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 封面区 -->
      <view class="flex gap-4">
        <view
          class="rounded-2xl shrink-0 relative overflow-hidden flex items-center justify-center"
          style="width: 240rpx; height: 320rpx; box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08)"
        >
          <view
            class="absolute inset-0"
            :style="{ background: `linear-gradient(135deg, ${th.primaryLight}, ${th.accentLight || '#F0FDFA'})` }"
          />
          <view class="-top-4 -right-4 opacity-20 absolute w-20 h-20 rounded-full" :style="{ backgroundColor: th.primary }" />
          <view class="-bottom-6 -left-4 opacity-15 absolute w-16 h-16 rounded-full" :style="{ backgroundColor: th.primaryDark }" />
          <image
            v-if="detail.cover"
            :src="detail.cover"
            mode="aspectFill"
            class="relative z-10 w-full h-full"
            @error="onCoverError"
          />
          <view v-else class="relative z-10 flex flex-col items-center justify-center gap-2">
            <view class="w-16 h-20 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #ef4444, #dc2626)">
              <text class="text-sm font-black tracking-wider" style="color: #ffffff">PDF</text>
            </view>
            <text class="text-xs font-medium" style="color: #94a3b8">{{ detail.section || '' }}</text>
          </view>
        </view>
        <view class="flex-col gap-1.5 flex-1 justify-center">
          <text class="text-base font-bold leading-snug" style="color: #1f2937">{{ detail.title || '加载中…' }}</text>
          <view class="flex items-center gap-1.5">
            <view
              class="opacity-70 flex items-center justify-center w-4 h-4 rounded-full"
              :style="{ backgroundColor: th.primaryLight }"
            >
              <text class="text-xs" :style="{ color: th.primary }">▪</text>
            </view>
            <text class="text-xs" style="color: #6b7280">{{ detail.publisher || '未知出版社' }}</text>
          </view>
          <view class="flex items-center gap-1.5">
            <view
              class="opacity-70 flex items-center justify-center w-4 h-4 rounded-full"
              :style="{ backgroundColor: th.primaryLight }"
            >
              <text class="text-xs" :style="{ color: th.primary }">●</text>
            </view>
            <text class="text-xs" style="color: #6b7280">{{ detail.grade || '' }} · {{ detail.subject || '' }}</text>
          </view>
        </view>
      </view>

      <!-- 下载按钮 -->
      <view
        class="rounded-2xl py-4 text-center font-bold text-base active:scale-[0.97] transition-all duration-250 relative overflow-hidden text-white"
        :style="{
          background: DOWNLOAD_STATES[downloadState].bg,
          boxShadow: downloadState === 'idle' ? `0 6rpx 24rpx ${th.primary}4d` : '',
        }"
        @click="handleDownload"
      >
        <text class="relative z-10">{{ DOWNLOAD_STATES[downloadState].text }}</text>
        <text v-if="downloadState === 'downloading'" class="relative z-10">{{ downloadProgress }}%</text>
      </view>

      <!-- 统计 -->
      <view
        class="rounded-2xl flex overflow-hidden"
        style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04)"
      >
        <view class="relative flex-col items-center flex-1 py-4">
          <text class="text-lg font-bold" :style="{ color: th.primaryDark }">{{ formatSize(detail.fileSize) }}</text>
          <text class="mt-1 text-xs" style="color: #9ca3af">📦 文件大小</text>
        </view>
        <view class="self-stretch w-px" style="background: #f3f4f6" />
        <view class="flex-col items-center flex-1 py-4">
          <text class="text-lg font-bold" :style="{ color: '#2563EB' }">{{ detail.viewCount || 0 }}</text>
          <text class="mt-1 text-xs" style="color: #9ca3af">👁️ 浏览</text>
        </view>
        <view class="self-stretch w-px" style="background: #f3f4f6" />
        <view class="flex-col items-center flex-1 py-4">
          <text class="text-lg font-bold" :style="{ color: '#059669' }">{{ detail.downloadCount || 0 }}</text>
          <text class="mt-1 text-xs" style="color: #9ca3af">⬇️ 下载</text>
        </view>
      </view>

      <!-- 教材信息 -->
      <view class="rounded-2xl p-5" style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04)">
        <view class="flex items-center gap-2 mb-3">
          <view
            class="w-1 h-5 rounded-full"
            :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.primaryDark})` }"
          />
          <text class="text-sm font-bold" style="color: #1f2937">📖 教材信息</text>
        </view>
        <view class="flex-col gap-2.5">
          <view class="flex items-center justify-between">
            <text class="text-xs" style="color: #94a3b8">教材名称</text>
            <text class="text-xs font-medium" style="color: #374151">{{ detail.title }}</text>
          </view>
          <view class="flex items-center justify-between">
            <text class="text-xs" style="color: #94a3b8">出版社</text>
            <text class="text-xs font-medium" style="color: #374151">{{ detail.publisher }}</text>
          </view>
          <view class="flex items-center justify-between">
            <text class="text-xs" style="color: #94a3b8">适用年级</text>
            <text class="text-xs font-medium" style="color: #374151">{{ detail.grade }}</text>
          </view>
          <view class="flex items-center justify-between">
            <text class="text-xs" style="color: #94a3b8">所属科目</text>
            <text class="text-xs font-medium" style="color: #374151">{{ detail.subject }}</text>
          </view>
          <view class="flex items-center justify-between">
            <text class="text-xs" style="color: #94a3b8">学段</text>
            <text class="text-xs font-medium" style="color: #374151">{{ detail.section }}</text>
          </view>
        </view>
      </view>

      <!-- 相关推荐 -->
      <view v-if="state.dataList.length" class="flex-col gap-3">
        <view class="flex items-center gap-2">
          <view
            class="w-1 h-5 rounded-full"
            :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.primaryDark})` }"
          />
          <text class="text-sm font-bold" style="color: #1f2937">📚 相关推荐</text>
        </view>
        <view class="flex-col gap-2">
          <view
            v-for="(item, idx) in state.dataList"
            :key="idx"
            class="flex items-center gap-3 rounded-2xl p-3 active:scale-[0.98] transition-all duration-150"
            style="background: #ffffff; box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.03)"
            @click="goRelated(item)"
          >
            <view class="relative shrink-0 w-9 h-12 rounded-lg overflow-hidden flex flex-col items-center justify-center" style="background: linear-gradient(135deg, #ef4444, #dc2626)">
              <text class="text-[9px] font-black tracking-wider" style="color: #ffffff">PDF</text>
            </view>
            <view class="flex-1 min-w-0">
              <text class="text-sm font-semibold line-clamp-1" style="color: #1f2937">{{ item.title }}</text>
              <text class="text-xs mt-0.5" style="color: #94a3b8">{{ item.publisher }} · {{ item.grade }}</text>
            </view>
            <text class="text-xs shrink-0" style="color: #9ca3af">{{ formatSize(item.sizeBytes) }}</text>
          </view>
        </view>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  import textbookTree from '@/common/mock/textbook-tree.js'

  const th = uni.$u.color

  const pagingConfig = ref({
    auto: false,
    refresherEnabled: false,
    showRefresherWhenReload: false,
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

  onLoad(options => {
    // 支持两种进入方式：1) 从 list 传来的完整参数  2) 从其他页面传来的 id
    if (options.title) {
      detail.value = {
        title: decodeURIComponent(options.title),
        subject: decodeURIComponent(options.subject || ''),
        publisher: decodeURIComponent(options.publisher || ''),
        grade: decodeURIComponent(options.grade || ''),
        section: decodeURIComponent(options.section || ''),
        fileSize: Number(options.fileSize) || 0,
        viewCount: Math.floor(Math.random() * 500),
        downloadCount: Math.floor(Math.random() * 200),
      }
      pagingConfig.value.navTitle = detail.value.title
    } else if (options.id) {
      loadDetail(options.id)
    }
  })
  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  async function loadDetail(id) {
    const res = await vk.callFunction({ url: 'client/pub_index.getTextbookDetail', data: { id } })
    if (res.code === 1) detail.value = res.data || {}
  }

  async function queryList() {
    // 加载同科目相关教材
    const subj = detail.value.subject
    if (!subj) { paging.value?.complete([]); return }

    const sectionData = textbookTree[detail.value.section]
    if (!sectionData) { paging.value?.complete([]); return }
    const subjectData = sectionData[subj]
    if (!subjectData) { paging.value?.complete([]); return }

    const related = []
    Object.entries(subjectData).forEach(([pub, gs]) => {
      gs.forEach(g => {
        const title = `义务教育教科书·${subj}${g}`
        if (title !== detail.value.title) {
          related.push({
            title,
            grade: g,
            publisher: pub,
            publisherShort: pub.replace(/-.+/, ''),
            subject: subj,
            section: detail.value.section,
            sizeBytes: mockSize(subj, g),
          })
        }
      })
    })

    paging.value?.complete(related.slice(0, 6))
  }

  function mockSize(subj, grade) {
    let hash = 0
    const str = subj + grade
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
    }
    return (8000 + Math.abs(hash) % 12000) * 1024
  }

  function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  async function handleDownload() {
    if (downloadState.value === 'downloading' || downloadState.value === 'loading') return
    if (downloadState.value === 'error') { downloadState.value = 'idle'; return }

    downloadState.value = 'loading'

    try {
      // 尝试从云端获取下载链接
      if (detail.value._id) {
        const res = await vk.callFunction({ url: 'client/pub_index.getDownloadUrl', data: { id: detail.value._id } })
        if (res.code === 1 && res.data?.url) {
          const task = uni.downloadFile({
            url: res.data.url,
            success(r) {
              if (r.statusCode === 200) {
                uni.openDocument({
                  filePath: r.tempFilePath,
                  success() { downloadState.value = 'success' },
                  fail() { downloadState.value = 'error' },
                })
              } else { downloadState.value = 'error' }
            },
            fail() { downloadState.value = 'error' },
          })
          task.onProgressUpdate(r => { downloadProgress.value = r.progress; downloadState.value = 'downloading' })
          return
        }
      }
      // 无云端数据，模拟下载完成
      downloadState.value = 'downloading'
      downloadProgress.value = 0
      const timer = setInterval(() => {
        downloadProgress.value += 10
        if (downloadProgress.value >= 100) {
          clearInterval(timer)
          downloadState.value = 'success'
        }
      }, 200)
    } catch (e) {
      downloadState.value = 'error'
    }
  }

  function goRelated(item) {
    vk.navigateTo(
      `/pages/index/detail?title=${encodeURIComponent(item.title)}&subject=${encodeURIComponent(item.subject)}&publisher=${encodeURIComponent(item.publisher)}&grade=${encodeURIComponent(item.grade)}&section=${encodeURIComponent(item.section)}&fileSize=${item.sizeBytes}`,
    )
  }

  function onCoverError() {
    detail.value.cover = ''
  }
</script>

<style lang="scss" scoped></style>
