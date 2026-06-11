<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4" v-if="info">
      <!-- 封面图 — 投影层次 -->
      <view class="flex justify-center">
        <view class="relative">
          <image
            :src="info.cover"
            mode="aspectFill"
            class="rounded-2xl relative z-10"
            style="width: 360rpx; height: 480rpx; box-shadow: 0 8rpx 32rpx rgba(217,119,6,0.2), 0 2rpx 8rpx rgba(0,0,0,0.08)"
          />
          <view class="absolute top-3 -left-3 w-16 h-16 rounded-2xl opacity-30 z-0" style="background: linear-gradient(135deg, #FEF3C7, #D97706)" />
          <view class="absolute -bottom-2 -right-2 w-12 h-12 rounded-full opacity-20 z-0" style="background: linear-gradient(135deg, #0D9488, #14B8A6)" />
        </view>
      </view>

      <!-- 标题 + 出版社 -->
      <view class="text-center">
        <text class="block text-xl font-bold" style="color: #1F2937">{{ info.title }}</text>
        <text class="block text-sm mt-1" style="color: #9CA3AF">{{ info.publisher || '' }}</text>
      </view>

      <!-- 信息统计卡片 -->
      <view class="flex gap-2">
        <view class="flex-1 rounded-2xl p-3 flex flex-col items-center" style="background: linear-gradient(135deg, #FFFBEB, #FEF3C7)">
          <text class="text-xs" style="color: #B45309">文件大小</text>
          <text class="text-sm font-bold mt-1" style="color: #92400E">{{ formatFileSize(info.fileSize) }}</text>
        </view>
        <view class="flex-1 rounded-2xl p-3 flex flex-col items-center" style="background: linear-gradient(135deg, #F0FDFA, #CCFBF1)">
          <text class="text-xs" style="color: #0D9488">浏览</text>
          <text class="text-sm font-bold mt-1" style="color: #0F766E">{{ info.views || 0 }}</text>
        </view>
        <view class="flex-1 rounded-2xl p-3 flex flex-col items-center" style="background: linear-gradient(135deg, #EFF6FF, #DBEAFE)">
          <text class="text-xs" style="color: #2563EB">下载</text>
          <text class="text-sm font-bold mt-1" style="color: #1D4ED8">{{ info.downloads || 0 }}</text>
        </view>
      </view>

      <!-- 下载按钮 -->
      <view class="relative">
        <view
          class="w-full rounded-2xl py-4 text-center text-white text-base font-bold transition-all duration-300 active:scale-[0.97] relative overflow-hidden"
          :style="{ background: downloadState.bg }"
          @click="handleDownload"
        >
          <view v-if="downloadState.key === 'downloading'" class="relative z-10 flex items-center justify-center gap-2">
            <text>下载中 {{ downloadProgress }}%</text>
          </view>
          <text v-else class="relative z-10">{{ downloadState.text }}</text>
          <view v-if="downloadState.key !== 'downloading'" class="absolute inset-0 opacity-20" style="background: linear-gradient(180deg, rgba(255,255,255,0.3), transparent)" />
        </view>
      </view>

      <!-- 相关推荐 -->
      <view v-if="related.length">
        <view class="flex items-center gap-2 mb-3">
          <view class="w-1 h-4 rounded-full" style="background: linear-gradient(180deg, #0D9488, #14B8A6)" />
          <text class="text-base font-bold" style="color: #1F2937">相关推荐</text>
        </view>
        <scroll-view scroll-x class="whitespace-nowrap" :show-scrollbar="false">
          <view
            v-for="r in related"
            :key="r._id"
            class="inline-block mr-3 rounded-xl overflow-hidden active:scale-[0.96] transition-all duration-200"
            style="width: 170rpx; background: #FFFFFF; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.04)"
            @click="goDetail(r._id)"
          >
            <image :src="r.cover" mode="aspectFill" class="w-full" style="aspect-ratio: 3/4; background: linear-gradient(135deg, #FEF3C7, #F0FDFA)" />
            <view class="p-2">
              <text class="text-xs font-medium line-clamp-1" style="color: #374151">{{ r.title }}</text>
            </view>
          </view>
        </scroll-view>
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
    navTitle: '教材详情',
    color: '#D97706',
  })

  const state = ref({
    isScroll: false,
    dataList: [],
  })

  const paging = ref()

  const DOWNLOAD_STATES = {
    idle: { key: 'idle', text: '📥 免费下载教材', bg: 'linear-gradient(135deg, #D97706, #F59E0B)' },
    loading: { key: 'loading', text: '正在获取下载链接…', bg: 'linear-gradient(135deg, #9CA3AF, #B0B7C3)' },
    downloading: { key: 'downloading', text: '', bg: 'linear-gradient(135deg, #0D9488, #14B8A6)' },
    success: { key: 'success', text: '✅ 下载完成，可在微信中查看', bg: 'linear-gradient(135deg, #059669, #10B981)' },
    error: { key: 'error', text: '❌ 下载失败 · 点击重试', bg: 'linear-gradient(135deg, #EF4444, #F87171)' },
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

  onShow(() => {})

  onUnload(() => {
    if (rewardedVideoAd.value) {
      rewardedVideoAd.value.destroy()
    }
  })

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function queryList() {
    paging.value?.complete([])
  }

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

<style lang="scss" scoped></style>
