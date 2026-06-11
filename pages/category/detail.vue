<template>
  <yy-paging ref="paging" bgColor="#F3F4F6" navTitle="教材详情" showNavBack>
    <view class="page-content px-4 pt-6" v-if="info">
      <view class="flex justify-center mb-6">
        <image :src="info.cover" mode="aspectFill" class="rounded-2xl shadow-lg bg-gray-100" style="width: 400rpx; height: 533rpx" />
      </view>
      <text class="block text-xl font-bold text-center mb-1">{{ info.title }}</text>
      <text class="block text-sm text-secondary text-center mb-5">{{ info.publisher || '' }}</text>
      <view class="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <view class="flex items-center justify-between text-sm text-secondary">
          <text>{{ formatFileSize(info.fileSize) }}</text>
          <text>👀 {{ info.views || 0 }}</text>
          <text>📥 {{ info.downloads || 0 }}</text>
        </view>
      </view>
      <view
        class="w-full rounded-full py-4 text-center text-white text-lg font-semibold shadow-md transition-all duration-200 active:scale-95"
        :style="{ backgroundColor: downloadState.bg }"
        @click="handleDownload"
      >
        <text v-if="downloadState.key === 'downloading'">下载中 {{ downloadProgress }}%</text>
        <text v-else>{{ downloadState.text }}</text>
      </view>
      <view class="mt-8" v-if="related.length">
        <text class="text-base font-medium mb-3 block">相关推荐</text>
        <scroll-view scroll-x class="whitespace-nowrap">
          <view v-for="r in related" :key="r._id" class="inline-block mr-3 bg-white rounded-xl overflow-hidden shadow-sm" style="width: 180rpx" @click="goDetail(r._id)">
            <image :src="r.cover" mode="aspectFill" class="w-full bg-gray-100" style="aspect-ratio: 3/4" />
            <view class="p-2"><text class="text-xs line-clamp-1">{{ r.title }}</text></view>
          </view>
        </scroll-view>
      </view>
      <view class="h-8"></view>
    </view>
  </yy-paging>
</template>

<script setup>
const paging = ref(null)

const DOWNLOAD_STATES = {
  idle: { key: 'idle', text: '📥 下载教材', bg: '#10B981' },
  loading: { key: 'loading', text: '正在获取下载链接...', bg: '#9CA3AF' },
  downloading: { key: 'downloading', text: '', bg: '#2563EB' },
  success: { key: 'success', text: '✅ 下载完成', bg: '#10B981' },
  error: { key: 'error', text: '❌ 下载失败，点击重试', bg: '#EF4444' },
}

const info = ref(null)
const related = ref([])
const downloadState = ref(DOWNLOAD_STATES.idle)
const downloadProgress = ref(0)
const rewardedVideoAd = ref(null)

onLoad((options) => {
  loadDetail(options.id)
  createRewardedVideoAd()
})

onUnload(() => {
  if (rewardedVideoAd.value) {
    rewardedVideoAd.value.destroy()
  }
})

async function loadDetail(id) {
  const res = await vk.callFunction({
    url: 'client/pub_index.getTextbookDetail',
    data: { id },
  })
  if (res.code === 1) {
    info.value = res.data
    loadRelated()
    vk.callFunction({
      url: 'client/pub_index.incrementViewCount',
      data: { id, type: 'view' },
    })
  } else {
    vk.toast(res.msg || '加载失败')
  }
}

async function loadRelated() {
  const res = await vk.callFunction({
    url: 'client/pub_index.getTextbookList',
    data: {
      grade: info.value.grade,
      subject: info.value.subject,
      pageIndex: 1,
      pageSize: 6,
    },
  })
  if (res.code === 1) {
    related.value = (res.data || []).filter(i => i._id !== info.value._id)
  }
}

function createRewardedVideoAd() {
  // #ifdef MP-WEIXIN
  if (wx.createRewardedVideoAd) {
    rewardedVideoAd.value = wx.createRewardedVideoAd({ adUnitId: '' })
    rewardedVideoAd.value.onClose((res) => {
      if (res && res.isEnded) {
        doDownload()
      } else {
        vk.toast('观看完整广告才能下载哦~')
      }
    })
    rewardedVideoAd.value.onError(() => {
      vk.toast('广告加载失败，请稍后重试')
      downloadState.value = DOWNLOAD_STATES.idle
    })
  }
  // #endif
}

function handleDownload() {
  if (
    downloadState.value.key === 'downloading' ||
    downloadState.value.key === 'loading' ||
    downloadState.value.key === 'success'
  ) return

  if (downloadState.value.key === 'error') {
    downloadState.value = DOWNLOAD_STATES.idle
    return
  }

  if (!vk.pubfn.checkLogin()) {
    vk.navigateTo('/pages/login/index')
    return
  }

  // #ifdef MP-WEIXIN
  if (rewardedVideoAd.value) {
    rewardedVideoAd.value
      .show()
      .catch(() =>
        rewardedVideoAd.value.load().then(() => rewardedVideoAd.value.show()),
      )
    return
  }
  // #endif

  doDownload()
}

async function doDownload() {
  downloadState.value = DOWNLOAD_STATES.loading
  const res = await vk.callFunction({
    url: 'client/pub_index.getDownloadUrl',
    data: { id: info.value._id },
  })
  if (res.code !== 1) {
    vk.toast(res.msg || '获取失败')
    downloadState.value = DOWNLOAD_STATES.error
    return
  }
  downloadFile(res.data.fileUrl)
}

function downloadFile(url) {
  downloadState.value = DOWNLOAD_STATES.downloading
  const dt = uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode === 200) {
        downloadState.value = DOWNLOAD_STATES.success
        uni.openDocument({ filePath: res.tempFilePath, showMenu: true })
      } else {
        downloadState.value = DOWNLOAD_STATES.error
      }
    },
    fail: () => {
      downloadState.value = DOWNLOAD_STATES.error
    },
  })
  dt.onProgressUpdate((res) => {
    downloadProgress.value = res.progress
  })
}

function formatFileSize(bytes) {
  if (!bytes) return '未知大小'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

function goDetail(id) {
  vk.redirectTo(`/pages/category/detail?id=${id}`)
}
</script>
