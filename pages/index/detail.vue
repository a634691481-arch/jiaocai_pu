<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 px-4 pt-4 pb-6" style="background-color: #f5f3f7">
      <!-- 封面区 -->
      <view class="flex gap-4">
        <view
          class="rounded-2xl shrink-0 relative flex items-center justify-center overflow-hidden"
          style="width: 250rpx; height: 330rpx; box-shadow: 0 8rpx 32rpx rgba(139, 95, 191, 0.1)"
        >
          <view
            class="-top-4 -right-4 opacity-20 absolute w-20 h-20 rounded-full"
            :style="{ backgroundcolor: uni.$u.color.primary }"
          />
          <view
            class="-bottom-6 -left-4 opacity-15 absolute w-16 h-16 rounded-full"
            :style="{ backgroundColor: '#61398F' }"
          />
          <view class="absolute inset-0" :style="{ background: `linear-gradient(135deg, #D6C6E1, #F0FDFA)` }" />
          <image
            v-if="detail.cover"
            :src="detail.cover"
            mode="aspectFill"
            class="relative z-10 w-full h-full"
            @error="onCoverError"
          />
          <view v-else class="relative z-10 flex flex-col items-center justify-center gap-2">
            <view
              class="flex items-center justify-center w-16 h-20 rounded-lg"
              style="background: linear-gradient(135deg, #ef4444, #dc2626)"
            >
              <text class="text-sm font-black tracking-wider text-white">PDF</text>
            </view>
            <text class="text-xs font-medium" style="color: #878787">{{ detail.section || '' }}</text>
          </view>
        </view>
        <view class="flex-col justify-center flex-1 gap-2">
          <text class="text-base font-bold leading-snug" style="color: #4a4a4a">{{ detail.title || '加载中…' }}</text>
          <view class="flex items-center gap-1.5 mt-0.5">
            <yy-icon name="ri:building-2-line" size="24" color="#8B5FBF" />
            <text class="text-xs" style="color: #878787">{{ detail.publisher || '未知出版社' }}</text>
          </view>
          <view class="flex items-center gap-1.5">
            <yy-icon name="ri:book-2-line" size="24" color="#8B5FBF" />
            <text class="text-xs" style="color: #878787">{{ detail.grade || '' }} · {{ detail.subject || '' }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮：预览 + 下载 -->
      <view class="flex gap-3">
        <!-- 预览 -->
        <view
          class="flex-1 rounded-2xl py-4 text-center font-bold text-sm active:scale-[0.97] transition-all duration-200 text-white flex items-center justify-center gap-2"
          style="background: linear-gradient(135deg, #2563eb, #1d4ed8); box-shadow: 0 6rpx 24rpx rgba(37, 99, 235, 0.3)"
          @click="handlePreview"
        >
          <yy-icon name="ri:eye-line" size="22" color="#FFFFFF" />
          <text>预览</text>
        </view>
        <!-- 下载 -->
        <view
          class="flex-1 rounded-2xl py-4 text-center font-bold text-sm active:scale-[0.97] transition-all duration-200 text-white flex items-center justify-center gap-2"
          :style="{
            background:
              downloadState === 'success'
                ? 'linear-gradient(135deg, #059669, #10B981)'
                : 'linear-gradient(135deg, #8B5FBF, #61398F)',
            boxShadow:
              downloadState === 'success' ? '0 6rpx 24rpx rgba(5,150,105,0.3)' : '0 6rpx 24rpx rgba(139,95,191,0.3)',
          }"
          @click="handleDownload"
        >
          <yy-icon
            :name="downloadState === 'success' ? 'ri:checkbox-circle-fill' : 'ri:download-2-line'"
            size="22"
            color="#FFFFFF"
          />
          <text>
            {{
              downloadState === 'success' ? '已保存' : downloadState === 'downloading' ? downloadProgress + '%' : '下载'
            }}
          </text>
        </view>
      </view>

      <!-- 统计 -->
      <view
        class="rounded-2xl flex py-4 overflow-hidden"
        style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(139, 95, 191, 0.06)"
      >
        <view class="flex-col items-center flex-1 gap-1.5">
          <yy-icon name="ri:hard-drive-2-line" size="28" color="#61398F" />
          <text class="text-lg font-bold" :style="{ color: '#61398F' }">{{ formatSize(detail.fileSize) }}</text>
          <text class="text-xs" style="color: #878787">文件大小</text>
        </view>
        <view class="self-stretch w-px" style="background: #e9e4ed" />
        <view class="flex-col items-center flex-1 gap-1.5">
          <yy-icon name="ri:eye-line" size="28" color="#2563EB" />
          <text class="text-lg font-bold" :style="{ color: '#2563EB' }">{{ detail.viewCount || 0 }}</text>
          <text class="text-xs" style="color: #878787">浏览</text>
        </view>
        <view class="self-stretch w-px" style="background: #e9e4ed" />
        <view class="flex-col items-center flex-1 gap-1.5">
          <yy-icon name="ri:download-2-line" size="28" color="#059669" />
          <text class="text-lg font-bold" :style="{ color: '#059669' }">{{ detail.downloadCount || 0 }}</text>
          <text class="text-xs" style="color: #878787">下载</text>
        </view>
      </view>

      <!-- 教材信息 -->
      <view class="rounded-2xl p-5" style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(139, 95, 191, 0.06)">
        <view class="flex items-center gap-2 mb-4">
          <view class="w-1 h-5 rounded-full" :style="{ background: `linear-gradient(180deg, #8B5FBF, #61398F)` }" />
          <yy-icon name="ri:book-open-line" size="28" color="#8B5FBF" />
          <text class="text-sm font-bold" style="color: #4a4a4a">教材信息</text>
        </view>
        <view class="flex-col gap-3">
          <view class="flex items-center justify-between py-1">
            <text class="text-xs" style="color: #878787">教材名称</text>
            <text class="text-xs font-medium" style="color: #4a4a4a">{{ detail.title }}</text>
          </view>
          <view class="h-px" :style="{ background: '#E9E4ED' }" />
          <view class="flex items-center justify-between py-1">
            <text class="text-xs" style="color: #878787">出版社</text>
            <text class="text-xs font-medium" style="color: #4a4a4a">{{ detail.publisher }}</text>
          </view>
          <view class="h-px" :style="{ background: '#E9E4ED' }" />
          <view class="flex items-center justify-between py-1">
            <text class="text-xs" style="color: #878787">适用年级</text>
            <text class="text-xs font-medium" style="color: #4a4a4a">{{ detail.grade }}</text>
          </view>
          <view class="h-px" :style="{ background: '#E9E4ED' }" />
          <view class="flex items-center justify-between py-1">
            <text class="text-xs" style="color: #878787">所属科目</text>
            <text class="text-xs font-medium" style="color: #4a4a4a">{{ detail.subject }}</text>
          </view>
          <view class="h-px" :style="{ background: '#E9E4ED' }" />
          <view class="flex items-center justify-between py-1">
            <text class="text-xs" style="color: #878787">学段</text>
            <text class="text-xs font-medium" style="color: #4a4a4a">{{ detail.section }}</text>
          </view>
        </view>
      </view>

      <!-- 相关推荐 -->
      <view v-if="state.dataList.length" class="flex-col gap-3">
        <view class="flex items-center gap-2">
          <view class="w-1 h-5 rounded-full" :style="{ background: `linear-gradient(180deg, #8B5FBF, #61398F)` }" />
          <yy-icon name="ri:star-line" size="28" color="#8B5FBF" />
          <text class="text-sm font-bold" style="color: #4a4a4a">相关推荐</text>
        </view>
        <view class="flex-col gap-2">
          <view
            v-for="(item, idx) in state.dataList"
            :key="idx"
            class="flex items-center gap-3 rounded-2xl p-3 active:scale-[0.98] transition-all duration-150"
            style="background: #ffffff; box-shadow: 0 1rpx 6rpx rgba(139, 95, 191, 0.05)"
            @click="goRelated(item)"
          >
            <view
              class="shrink-0 w-9 relative flex flex-col items-center justify-center h-12 overflow-hidden rounded-lg"
              style="background: linear-gradient(135deg, #ef4444, #dc2626)"
            >
              <text class="text-[9px] font-black tracking-wider text-white">PDF</text>
            </view>
            <view class="flex-1 min-w-0">
              <text class="line-clamp-1 text-sm font-semibold" style="color: #4a4a4a">{{ item.title }}</text>
              <text class="text-xs mt-0.5" style="color: #878787">{{ item.publisher }} · {{ item.grade }}</text>
            </view>
            <view class="flex items-center gap-1">
              <text class="text-xs" style="color: #878787">{{ formatSize(item.fileSize) }}</text>
              <yy-icon name="ri:arrow-right-s-line" size="20" color="#8B5FBF" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  import textbookData from '@/static/textbook-data.json'

  const pagingConfig = ref({
    auto: true,
    refresherEnabled: false,
    showRefresherWhenReload: false,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '教材详情',
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const detail = ref({})
  const downloadState = ref('idle')
  const downloadProgress = ref(0)

  onLoad((options) => {
    if (options.idx !== undefined) {
      const found = textbookData[Number(options.idx)]
      if (found) {
        detail.value = { ...found, viewCount: 0, downloadCount: 0 }
        pagingConfig.value.navTitle = detail.value.title
        recordView()
        loadStats()
      }
    } else if (options.title) {
      detail.value = {
        title: decodeURIComponent(options.title),
        subject: decodeURIComponent(options.subject || ''),
        publisher: decodeURIComponent(options.publisher || ''),
        grade: decodeURIComponent(options.grade || ''),
        section: decodeURIComponent(options.section || ''),
        fileSize: Number(options.fileSize) || 0,
        fileUrl: decodeURIComponent(options.fileUrl || ''),
        viewCount: 0,
        downloadCount: 0,
      }
      pagingConfig.value.navTitle = detail.value.title
      recordView()
      loadStats()
    } else if (options.id) {
      const found = textbookData.find(r => r._id === options.id)
      if (found) {
        detail.value = {
          ...found,
          viewCount: 0,
          downloadCount: 0,
        }
        pagingConfig.value.navTitle = detail.value.title
        recordView()
        loadStats()
      }
    }
  })
  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  async function queryList() {
    const sec = detail.value.section
    const subj = detail.value.subject
    if (!sec || !subj) {
      paging.value?.complete([])
      return
    }
    const related = textbookData
      .filter(r => r.section === sec && r.subject === subj && r.title !== detail.value.title)
      .slice(0, 6)
    paging.value?.complete(related)
  }

  function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function getStatsKey() {
    return [detail.value.section, detail.value.subject, detail.value.publisher, detail.value.title]
      .filter(Boolean)
      .join('#')
  }

  async function recordView() {
    const key = getStatsKey()
    if (!key) return
    try {
      await vk.callFunction({ url: 'client/pub.index.recordStat', data: { key, type: 'view', info: detail.value } })
    } catch (e) { /* 不阻塞 */ }
  }

  async function recordDownload() {
    const key = getStatsKey()
    if (!key) return
    try {
      await vk.callFunction({ url: 'client/pub.index.recordStat', data: { key, type: 'download', info: detail.value } })
      detail.value.downloadCount++
    } catch (e) { /* 不阻塞 */ }
  }

  async function loadStats() {
    const key = getStatsKey()
    if (!key) return
    try {
      const res = await vk.callFunction({ url: 'client/pub.index.getStats', data: { key } })
      if (res.code === 1 && res.data) {
        detail.value.viewCount = res.data.views || 0
        detail.value.downloadCount = res.data.downloads || 0
      }
    } catch (e) { /* 不阻塞 */ }
  }

  // 公用：获取文件 URL（优先 CDN 直链，降级云函数）
  async function getFileUrl() {
    if (detail.value.fileUrl) return detail.value.fileUrl
    if (detail.value._id) {
      const res = await vk.callFunction({ url: 'client/pub.index.getDownloadUrl', data: { id: detail.value._id } })
      if (res.code === 1 && res.data?.fileUrl) return res.data.fileUrl
    }
    return null
  }

  /** 预览：下载到临时路径 → 打开文档 */
  async function handlePreview() {
    const url = await getFileUrl()
    if (!url) {
      vk.toast('暂无文件')
      return
    }
    vk.showLoading('获取中…')
    try {
      const res = await new Promise((resolve, reject) => {
        uni.downloadFile({ url, success: resolve, fail: reject })
      })
      vk.hideLoading()
      if (res.statusCode === 200) {
        uni.openDocument({ filePath: res.tempFilePath })
      } else {
        vk.toast('预览失败')
      }
    } catch (e) {
      vk.hideLoading()
      vk.toast('预览失败')
    }
  }

  /** 下载：下载到临时路径 → 保存到本地 */
  async function handleDownload() {
    if (downloadState.value === 'downloading') return
    const url = await getFileUrl()
    if (!url) {
      vk.toast('暂无文件')
      return
    }
    downloadState.value = 'downloading'
    downloadProgress.value = 0
    try {
      const res = await new Promise((resolve, reject) => {
        const task = uni.downloadFile({ url, success: resolve, fail: reject })
        task.onProgressUpdate(r => {
          downloadProgress.value = r.progress
        })
      })
      if (res.statusCode === 200) {
        await uni.saveFile({ tempFilePath: res.tempFilePath })
        downloadState.value = 'success'
        recordDownload()
        vk.toast('已保存到本地')
      } else {
        downloadState.value = 'error'
        vk.toast('下载失败')
      }
    } catch (e) {
      downloadState.value = 'error'
      vk.toast('下载失败')
    }
  }

  function goRelated(item) {
    let idx = textbookData.indexOf(item)
    if (idx === -1) idx = textbookData.findIndex(r => r.title === item.title && r.publisher === item.publisher && r.grade === item.grade)
    vk.navigateTo(`/pages/index/detail?idx=${idx}`)
  }

  function onCoverError() {
    detail.value.cover = ''
  }
</script>

<style lang="scss" scoped></style>
