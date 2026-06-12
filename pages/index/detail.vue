<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="detail-page">
      <!-- Hero 区 -->
      <view class="hero-section">
        <view class="hero-bg" />
        <view class="hero-deco-circle hero-deco-1" />
        <view class="hero-deco-circle hero-deco-2" />
        <view class="hero-content">
          <view class="hero-cover-wrap">
            <image v-if="detail.cover" :src="detail.cover" mode="aspectFill" class="hero-cover" @error="onCoverError" />
            <view
              v-else
              class="hero-cover hero-cover--fallback"
              :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }"
            >
              <text class="hero-cover-letter">{{ (detail.title || '?').charAt(0) }}</text>
              <view class="hero-cover-label">{{ detail.section || '' }}</view>
            </view>
          </view>
          <view class="hero-info">
            <view class="hero-breadcrumb">
              <text class="hero-breadcrumb-text">{{ detail.section }} · {{ detail.subject }}</text>
            </view>
            <text class="hero-title">{{ detail.title || '加载中…' }}</text>
            <text class="hero-publisher">{{ detail.publisher || '未知出版社' }}</text>
            <view class="hero-grade-row">
              <view class="hero-grade-pill">{{ detail.grade }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <view class="action-btn action-btn--preview" @click="handlePreview">
          <view class="action-btn-icon" :style="{ background: th.primaryLight }">
            <yy-icon name="ri:book-open-line" size="22" :color="th.primary" />
          </view>
          <view class="action-btn-text">
            <text class="action-btn-label">预览</text>
            <text class="action-btn-hint" :style="{ color: th.info }">在线查看</text>
          </view>
        </view>
        <view
          class="action-btn"
          :class="{
            'action-btn--download': downloadState !== 'success' && downloadState !== 'downloading',
            'action-btn--saved': downloadState === 'success',
            'action-btn--loading': downloadState === 'downloading',
          }"
          @click="handleDownload"
        >
          <view class="action-btn-icon">
            <yy-icon
              :name="downloadState === 'success' ? 'ri:checkbox-circle-fill' : 'ri:file-download-line'"
              size="22"
              :color="downloadState === 'success' ? '#ffffff' : '#ffffff'"
            />
          </view>
          <view class="action-btn-text">
            <text class="action-btn-label">
              {{ downloadState === 'success' ? '已保存' : downloadState === 'downloading' ? '下载中' : '下载' }}
            </text>
            <text class="action-btn-hint">
              {{
                downloadState === 'success'
                  ? '点击重新下载'
                  : downloadState === 'downloading'
                    ? downloadProgress + '%'
                    : '保存到本地'
              }}
            </text>
          </view>
        </view>
      </view>

      <!-- 统计面板 -->
      <view class="stats-panel">
        <view class="stat-item">
          <view class="stat-icon-box" :style="{ background: `${th.errorLight}` }">
            <yy-icon name="ri:file-pdf-line" size="26" :color="th.error" />
          </view>
          <view class="stat-body">
            <text class="stat-value">{{ formatSize(detail.fileSize) }}</text>
            <text class="stat-label">文件大小</text>
          </view>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <view class="stat-icon-box" :style="{ background: `${th.infoLight}` }">
            <yy-icon name="ri:eye-2-line" size="26" :color="th.info" />
          </view>
          <view class="stat-body">
            <text class="stat-value">{{ detail.viewCount || 0 }}</text>
            <text class="stat-label">浏览</text>
          </view>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <view class="stat-icon-box" :style="{ background: `${th.successLight}` }">
            <yy-icon name="ri:download-cloud-2-line" size="26" :color="th.success" />
          </view>
          <view class="stat-body">
            <text class="stat-value">{{ detail.downloadCount || 0 }}</text>
            <text class="stat-label">下载</text>
          </view>
        </view>
      </view>

      <!-- 教材信息 -->
      <view class="info-section">
        <view class="section-header">
          <view
            class="section-header-line"
            :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.error})` }"
          />
          <text class="section-header-text">教材信息</text>
        </view>
        <view class="info-table">
          <view class="info-row">
            <text class="info-label">教材名称</text>
            <text class="info-value">{{ detail.title }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">出版社</text>
            <text class="info-value">{{ detail.publisher || '—' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">适用年级</text>
            <text class="info-value">{{ detail.grade || '—' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">所属科目</text>
            <text class="info-value">{{ detail.subject || '—' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">学段</text>
            <text class="info-value">{{ detail.section || '—' }}</text>
          </view>
          <view class="info-row info-row--last">
            <text class="info-label">文件格式</text>
            <text class="info-value">PDF</text>
          </view>
        </view>
      </view>

      <!-- 相关推荐 -->
      <view v-if="state.dataList.length" class="related-section">
        <view class="section-header">
          <view
            class="section-header-line"
            :style="{ background: `linear-gradient(180deg, ${th.primary}, ${th.error})` }"
          />
          <text class="section-header-text">相关推荐</text>
        </view>
        <view class="related-track">
          <view v-for="(item, idx) in state.dataList" :key="idx" class="related-card" @click="goRelated(item)">
            <view
              class="related-cover"
              :style="{
                background: `linear-gradient(135deg, ${bookColor(item.title)}, ${darken(bookColor(item.title))})`,
              }"
            >
              <text class="related-cover-letter">{{ item.title.charAt(0) }}</text>
            </view>
            <view class="related-info">
              <text class="related-title line-clamp-2">{{ item.title }}</text>
              <text class="related-meta">{{ item.publisher }} · {{ item.grade }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="page-bottom" />
    </view>
  </yy-paging>
</template>

<script setup>
  import textbookData from '@/static/textbook-data.json'
  import myfn from '@/common/function/myPubFunction.js'

  const th = uni.$u.color

  const COLORS = ['#a0652c', '#c44536', '#2d6a4f', '#5c4d7a', '#1e6091', '#b5838d', '#7f4f24', '#936639']

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

  function bookColor(title) {
    let hash = 0
    for (let i = 0; i < (title || '').length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
    return COLORS[Math.abs(hash) % COLORS.length]
  }

  function darken(hex) {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.max((num >> 16) - 40, 0)
    const g = Math.max(((num >> 8) & 0xff) - 40, 0)
    const b = Math.max((num & 0xff) - 40, 0)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  onLoad(options => {
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
    } catch (e) {
      /* 不阻塞 */
    }
  }

  async function recordDownload() {
    const key = getStatsKey()
    if (!key) return
    detail.value.downloadCount++
    const idx = textbookData.findIndex(
      r => r.title === detail.value.title && r.publisher === detail.value.publisher && r.grade === detail.value.grade,
    )
    myfn.saveDownloadHistory({
      idx,
      title: detail.value.title,
      publisher: detail.value.publisher,
      grade: detail.value.grade,
      subject: detail.value.subject,
      section: detail.value.section,
      fileSize: detail.value.fileSize,
      cover: detail.value.cover || '',
    })
    try {
      await vk.callFunction({ url: 'client/pub.index.recordStat', data: { key, type: 'download', info: detail.value } })
    } catch (e) {
      /* 不阻塞 */
    }
  }

  async function loadStats() {
    const key = getStatsKey()
    if (!key) return
    try {
      const res = await vk.callFunction({ url: 'client/pub.index.getStats', data: { key } })
      if (res.code === 0 && res.data) {
        detail.value.viewCount = res.data.views || 0
        detail.value.downloadCount = res.data.downloads || 0
      }
    } catch (e) {
      /* 不阻塞 */
    }
  }

  async function getFileUrl() {
    if (detail.value.fileUrl) return detail.value.fileUrl
    if (detail.value._id) {
      const res = await vk.callFunction({ url: 'client/pub.index.getDownloadUrl', data: { id: detail.value._id } })
      if (res.code === 0 && res.data?.fileUrl) return res.data.fileUrl
    }
    return null
  }

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
    if (idx === -1)
      idx = textbookData.findIndex(
        r => r.title === item.title && r.publisher === item.publisher && r.grade === item.grade,
      )
    vk.navigateTo(`/pages/index/detail?idx=${idx}`)
  }

  function onCoverError() {
    detail.value.cover = ''
  }
</script>

<style lang="scss" scoped>
  .detail-page {
    background: #f7f5f0;
    min-height: 100vh;
  }

  /* ===== Hero ===== */
  .hero-section {
    position: relative;
    padding: 40rpx 32rpx 48rpx;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(165deg, #2d2320 0%, #4a3728 40%, #6b4f38 100%);
  }

  .hero-deco-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.06;
    background: #d4a373;
  }

  .hero-deco-1 {
    width: 400rpx;
    height: 400rpx;
    top: -120rpx;
    right: -80rpx;
  }

  .hero-deco-2 {
    width: 240rpx;
    height: 240rpx;
    bottom: -60rpx;
    left: -60rpx;
  }

  .hero-content {
    position: relative;
    display: flex;
    gap: 28rpx;
    align-items: flex-start;
  }

  .hero-cover-wrap {
    width: 220rpx;
    height: 300rpx;
    flex-shrink: 0;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.25);
  }

  .hero-cover {
    width: 100%;
    height: 100%;
  }

  .hero-cover--fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
  }

  .hero-cover-letter {
    font-size: 72rpx;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.85);
    font-family: Georgia, serif;
    text-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.15);
  }

  .hero-cover-label {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  .hero-info {
    flex: 1;
    min-width: 0;
    padding-top: 12rpx;
  }

  .hero-breadcrumb {
    margin-bottom: 12rpx;
  }

  .hero-breadcrumb-text {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
    letter-spacing: 1rpx;
  }

  .hero-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
    font-family: Georgia, 'Noto Serif SC', serif;
    display: block;
  }

  .hero-publisher {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.65);
    margin-top: 12rpx;
    display: block;
  }

  .hero-grade-row {
    margin-top: 16rpx;
  }

  .hero-grade-pill {
    display: inline-block;
    padding: 6rpx 22rpx;
    border-radius: 24rpx;
    font-size: 22rpx;
    font-weight: 600;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4rpx);
  }

  /* ===== Action Bar ===== */
  .action-bar {
    display: flex;
    gap: 16rpx;
    padding: 0 32rpx;
    margin-top: -20rpx;
    position: relative;
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 14rpx;
    padding: 20rpx 24rpx;
    border-radius: 16rpx;
    transition: all 0.2s ease;
  }

  .action-btn:active {
    transform: scale(0.97);
  }

  .action-btn--preview {
    background: #ffffff;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }

  .action-btn--download {
    background: #2d2320;
    box-shadow: 0 4rpx 20rpx rgba(45, 35, 32, 0.2);
  }

  .action-btn--saved {
    background: #2d6a4f;
    box-shadow: 0 4rpx 20rpx rgba(45, 106, 79, 0.25);
  }

  .action-btn--loading {
    background: #8c8173;
  }

  .action-btn-icon {
    width: 56rpx;
    height: 56rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .action-btn--download .action-btn-icon,
  .action-btn--loading .action-btn-icon {
    background: rgba(255, 255, 255, 0.12);
  }

  .action-btn--saved .action-btn-icon {
    background: rgba(255, 255, 255, 0.15);
  }

  .action-btn-text {
    display: flex;
    flex-direction: column;
    gap: 2rpx;
  }

  .action-btn-label {
    font-size: 26rpx;
    font-weight: 700;
    line-height: 1.2;
  }

  .action-btn--preview .action-btn-label {
    color: #2d2320;
  }

  .action-btn--download .action-btn-label,
  .action-btn--loading .action-btn-label,
  .action-btn--saved .action-btn-label {
    color: #ffffff;
  }

  .action-btn-hint {
    font-size: 20rpx;
    font-weight: 400;
    line-height: 1.2;
  }

  .action-btn--download .action-btn-hint,
  .action-btn--loading .action-btn-hint,
  .action-btn--saved .action-btn-hint {
    color: rgba(255, 255, 255, 0.5);
  }

  /* ===== Stats Panel ===== */
  .stats-panel {
    display: flex;
    align-items: center;
    margin: 28rpx 32rpx 0;
    padding: 20rpx 16rpx;
    background: #ffffff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 16rpx rgba(45, 35, 32, 0.03);
  }

  .stat-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
  }

  .stat-icon-box {
    width: 60rpx;
    height: 60rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-body {
    display: flex;
    flex-direction: column;
    gap: 2rpx;
  }

  .stat-value {
    font-size: 30rpx;
    font-weight: 700;
    color: #2d2320;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 20rpx;
    color: #8c8173;
    line-height: 1.2;
  }

  .stat-divider {
    width: 1px;
    height: 40rpx;
    background: #edeae4;
    flex-shrink: 0;
  }

  /* ===== Sections ===== */
  .section-header {
    display: flex;
    align-items: center;
    gap: 14rpx;
    margin-bottom: 20rpx;
  }

  .section-header-line {
    width: 4rpx;
    height: 28rpx;
    border-radius: 2rpx;
  }

  .section-header-text {
    font-size: 28rpx;
    font-weight: 700;
    color: #2d2320;
    font-family: Georgia, 'Noto Serif SC', serif;
  }

  /* ===== Info ===== */
  .info-section {
    margin: 28rpx 32rpx 0;
  }

  .info-table {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 8rpx 0;
    box-shadow: 0 2rpx 16rpx rgba(45, 35, 32, 0.03);
  }

  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22rpx 28rpx;
    border-bottom: 1px solid #f0ede8;
  }

  .info-row--last {
    border-bottom: none;
  }

  .info-label {
    font-size: 24rpx;
    color: #8c8173;
    font-weight: 400;
  }

  .info-value {
    font-size: 24rpx;
    color: #2d2320;
    font-weight: 600;
    text-align: right;
    max-width: 60%;
  }

  /* ===== Related ===== */
  .related-section {
    margin: 32rpx 32rpx 0;
  }

  .related-track {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .related-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 20rpx;
    background: #ffffff;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 12rpx rgba(45, 35, 32, 0.04);
    transition: all 0.2s ease;
  }

  .related-card:active {
    transform: scale(0.97);
  }

  .related-cover {
    width: 80rpx;
    height: 80rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .related-cover-letter {
    font-size: 32rpx;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.8);
    font-family: Georgia, serif;
    text-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.1);
  }

  .related-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  .related-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #2d2320;
    line-height: 1.4;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .related-meta {
    font-size: 22rpx;
    color: #8c8173;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .page-bottom {
    height: 40rpx;
  }
</style>
