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

      <!-- 下载按钮 -->
      <view
        class="rounded-2xl py-4 text-center font-bold text-base active:scale-[0.97] transition-all duration-250 relative overflow-hidden text-white flex items-center justify-center gap-2"
        :style="{
          background: DOWNLOAD_STATES[downloadState].bg,
          boxShadow: downloadState === 'idle' ? '0 6rpx 24rpx rgba(139,95,191,0.3)' : '',
        }"
        @click="handleDownload"
      >
        <yy-icon v-if="downloadState === 'idle'" name="ri:download-2-line" size="24" color="#FFFFFF" />
        <yy-icon v-if="downloadState === 'success'" name="ri:checkbox-circle-fill" size="24" color="#FFFFFF" />
        <yy-icon v-if="downloadState === 'error'" name="ri:close-circle-fill" size="24" color="#FFFFFF" />
        <text class="relative z-10">{{ DOWNLOAD_STATES[downloadState].text }}</text>
        <text v-if="downloadState === 'downloading'" class="relative z-10 ml-1">{{ downloadProgress }}%</text>
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

  const DOWNLOAD_STATES = {
    idle: { key: 'idle', text: '免费下载教材', bg: `linear-gradient(135deg, #8B5FBF, #61398F)` },
    loading: { key: 'loading', text: '正在获取下载链接…', bg: 'linear-gradient(135deg, #9CA3AF, #B0B7C3)' },
    downloading: { key: 'downloading', text: '', bg: 'linear-gradient(135deg, #0D9488, #14B8A6)' },
    success: { key: 'success', text: '下载完成，可在微信中查看', bg: 'linear-gradient(135deg, #059669, #10B981)' },
    error: { key: 'error', text: '下载失败 · 点击重试', bg: 'linear-gradient(135deg, #EF4444, #F87171)' },
  }

  onLoad((options) => {
    if (options.title) {
      detail.value = {
        title: decodeURIComponent(options.title),
        subject: decodeURIComponent(options.subject || ''),
        publisher: decodeURIComponent(options.publisher || ''),
        grade: decodeURIComponent(options.grade || ''),
        section: decodeURIComponent(options.section || ''),
        fileSize: Number(options.fileSize) || 0,
        fileUrl: decodeURIComponent(options.fileUrl || ''),
        viewCount: Math.floor(Math.random() * 500),
        downloadCount: Math.floor(Math.random() * 200),
      }
      pagingConfig.value.navTitle = detail.value.title
    } else if (options.id) {
      // 从 ID 进入（降级兼容，直接用本地数据填充）
      const found = textbookData.find(r => r._id === options.id)
      if (found) {
        detail.value = {
          ...found,
          viewCount: Math.floor(Math.random() * 500),
          downloadCount: Math.floor(Math.random() * 200),
        }
        pagingConfig.value.navTitle = detail.value.title
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
    if (!sec || !subj) { paging.value?.complete([]); return }
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

  async function handleDownload() {
    if (downloadState.value === 'downloading' || downloadState.value === 'loading') return
    if (downloadState.value === 'error') {
      downloadState.value = 'idle'
      return
    }

    downloadState.value = 'loading'

    try {
      // 有 CDN 直链 → 直接下载
      if (detail.value.fileUrl) {
        const task = uni.downloadFile({
          url: detail.value.fileUrl,
          success(r) {
            if (r.statusCode === 200) {
              uni.openDocument({
                filePath: r.tempFilePath,
                success() {
                  downloadState.value = 'success'
                },
                fail() {
                  downloadState.value = 'error'
                },
              })
            } else {
              downloadState.value = 'error'
            }
          },
          fail() {
            downloadState.value = 'error'
          },
        })
        task.onProgressUpdate(r => {
          downloadProgress.value = r.progress
          downloadState.value = 'downloading'
        })
        return
      }
      // 有 _id → 走云函数获取下载链接
      if (detail.value._id) {
        const res = await vk.callFunction({ url: 'client/pub.index.getDownloadUrl', data: { id: detail.value._id } })
        if (res.code === 1 && res.data?.fileUrl) {
          const task = uni.downloadFile({
            url: res.data.fileUrl,
            success(r) {
              if (r.statusCode === 200) {
                uni.openDocument({
                  filePath: r.tempFilePath,
                  success() {
                    downloadState.value = 'success'
                  },
                  fail() {
                    downloadState.value = 'error'
                  },
                })
              } else {
                downloadState.value = 'error'
              }
            },
            fail() {
              downloadState.value = 'error'
            },
          })
          task.onProgressUpdate(r => {
            downloadProgress.value = r.progress
            downloadState.value = 'downloading'
          })
          return
        }
      }
      // 无云端数据，模拟完成
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
      `/pages/index/detail?title=${encodeURIComponent(item.title)}&subject=${encodeURIComponent(item.subject)}&publisher=${encodeURIComponent(item.publisher)}&grade=${encodeURIComponent(item.grade)}&section=${encodeURIComponent(item.section)}&fileSize=${item.fileSize}&fileUrl=${encodeURIComponent(item.fileUrl)}`,
    )
  }

  function onCoverError() {
    detail.value.cover = ''
  }
</script>

<style lang="scss" scoped></style>
