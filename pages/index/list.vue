<template>
  <yy-paging v-model="state.d" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig" :color="th.primary">
    <template #top>
      <view class="header-wrap">
        <view class="header-card">
          <view class="header-top">
            <view class="header-icon" :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.error})` }">
              <yy-icon name="ri:book-2-line" size="22" color="#ffffff" />
            </view>
            <view class="header-top-center">
              <text class="header-subject">{{ subject }}</text>
              <text class="header-total" :style="{ color: th.info }">共 {{ state.dataList.length }} 册</text>
            </view>
            <view class="header-grade-badge" :style="{ color: th.primary, background: th.primaryLight }">
              {{ currentGradeFilter }}
            </view>
          </view>
          <view
            class="header-publisher-btn"
            @click="showPublisherPicker = true"
            :style="{ borderColor: th.primaryLight, background: `${th.primaryLight}55` }"
          >
            <yy-icon name="ri:building-2-line" size="16" :color="th.primary" />
            <text class="header-publisher-text" :style="{ color: th.primaryDark }">{{ publisher || '全部版本' }}</text>
            <yy-icon name="ri:arrow-down-s-line" size="16" :color="th.info" />
          </view>
        </view>

        <scroll-view
          scroll-x
          class="filter-scroll"
          :show-scrollbar="false"
          :style="`--theme-primary: ${th.primary}; --theme-info: ${th.info}`"
        >
          <view class="filter-track">
            <view
              v-for="g in gradeFilters"
              :key="g"
              class="filter-pill"
              :class="{ 'filter-pill--active': currentGradeFilter === g }"
              @click="filterByGrade(g)"
            >
              {{ g }}
            </view>
          </view>
        </scroll-view>
      </view>
    </template>

    <view class="list-wrap">
      <view class="card-list">
        <view
          v-for="(item, idx) in filteredList"
          :key="idx"
          class="book-card"
          :style="{ '--card-accent': bookColor(item.title) }"
          @click="goDetail(item)"
        >
          <view class="book-spine" :style="{ background: `var(--card-accent)` }" />
          <view
            class="book-cover"
            :style="{ background: `linear-gradient(135deg, var(--card-accent), ${darken(bookColor(item.title))})` }"
          >
            <text class="book-cover-text">{{ item.title.charAt(0) }}</text>
          </view>
          <view class="book-info">
            <text class="book-title line-clamp-1">{{ item.title }}</text>
            <view class="book-tags">
              <view class="book-tag publisher-tag" :style="{ color: th.info, background: th.infoLight }">
                {{ item.publisher || '—' }}
              </view>
              <view class="book-tag grade-tag" :style="{ color: th.primary, background: th.primaryLight }">
                {{ item.grade }}
              </view>
            </view>
            <view class="book-footer">
              <text class="book-size">{{ formatSize(item.fileSize) }}</text>
              <view class="book-download" :style="{ background: th.primaryLight }" @click.stop="handleDownload(item)">
                <yy-icon name="ri:download-2-line" size="14" :color="th.primary" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <yy-empty v-if="!filteredList.length && loaded" />
    </view>

    <yy-picker-modal
      v-model="showPublisherPicker"
      title="选择版本"
      :list="publisherOptions"
      :value="publisher || '全部版本'"
      @change="onPublisherSelect"
    />
  </yy-paging>
</template>

<script setup>
  import textbookData from '@/static/textbook-data.json'
  import treeData from '@/static/textbook-tree.json'

  const COLORS = ['#a0652c', '#c44536', '#2d6a4f', '#5c4d7a', '#1e6091', '#b5838d', '#7f4f24', '#936639']

  const th = uni.$u.color

  const pagingConfig = ref({
    auto: false,
    refresherEnabled: false,
    showRefresherWhenReload: false,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '教材列表',
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const loaded = ref(false)

  const section = ref('')
  const subject = ref('')
  const publisher = ref('')
  const pageTitle = ref('')
  const d = ref([])

  const currentGradeFilter = ref('全部年级')
  const gradeFilters = ref(['全部年级'])
  const showPublisherPicker = ref(false)
  const publisherOptions = ref([])

  function bookColor(title) {
    let hash = 0
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
    return COLORS[Math.abs(hash) % COLORS.length]
  }

  function darken(hex) {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.max((num >> 16) - 40, 0)
    const g = Math.max(((num >> 8) & 0xff) - 40, 0)
    const b = Math.max((num & 0xff) - 40, 0)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  function loadPublisherOptions() {
    const secData = treeData[section.value]
    if (!secData || !secData[subject.value]) {
      publisherOptions.value = []
      return
    }
    const pubs = Object.keys(secData[subject.value])
    publisherOptions.value = ['全部版本', ...pubs]
  }

  function loadGrades() {
    const secData = treeData[section.value]
    if (!secData) {
      gradeFilters.value = ['全部年级']
      return
    }
    const gradesSet = new Set()
    Object.entries(secData).forEach(([subj, publishers]) => {
      if (subj !== subject.value) return
      Object.entries(publishers).forEach(([pub, grades]) => {
        if (publisher.value && pub !== publisher.value) return
        grades.forEach(g => gradesSet.add(g))
      })
    })
    gradeFilters.value = ['全部年级', ...gradesSet]
  }

  function loadLocalData() {
    const filtered = textbookData.filter(item => {
      if (item.section !== section.value) return false
      if (item.subject !== subject.value) return false
      if (publisher.value && item.publisher !== publisher.value) return false
      return true
    })
    state.value.dataList = filtered
    loaded.value = true
    paging.value?.complete(filtered)
  }

  const filteredList = computed(() => {
    if (currentGradeFilter.value === '全部年级') return state.value.dataList
    return state.value.dataList.filter(i => i.grade === currentGradeFilter.value)
  })

  function filterByGrade(g) {
    currentGradeFilter.value = g
  }

  function onPublisherSelect(pub) {
    showPublisherPicker.value = false
    publisher.value = pub === '全部版本' ? '' : pub
    loadGrades()
    loadLocalData()
  }

  onLoad(options => {
    section.value = options.section || ''
    subject.value = options.subject || ''
    publisher.value = decodeURIComponent(options.publisher || '')
    pageTitle.value = decodeURIComponent(options.title || '')
    if (pageTitle.value) pagingConfig.value.navTitle = pageTitle.value
    loadPublisherOptions()
    loadGrades()
    loadLocalData()
  })
  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function queryList() {
    loadLocalData()
  }

  function goDetail(item) {
    let idx = textbookData.indexOf(item)
    if (idx === -1)
      idx = textbookData.findIndex(
        r => r.title === item.title && r.publisher === item.publisher && r.grade === item.grade,
      )
    vk.navigateTo(`/pages/index/detail?idx=${idx}`)
  }

  function handleDownload(item) {
    goDetail(item)
  }
</script>

<style lang="scss" scoped>
  .header-wrap {
    background: #f7f5f0;
    padding-bottom: 8rpx;
  }

  .header-card {
    margin: 16rpx 20rpx 0;
    padding: 20rpx 24rpx 24rpx;
    background: #ffffff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 16rpx rgba(45, 35, 32, 0.04);
  }

  .header-top {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .header-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .header-top-center {
    flex: 1;
    min-width: 0;
  }

  .header-subject {
    font-size: 32rpx;
    font-weight: 700;
    color: #2d2320;
    line-height: 1.3;
    font-family: Georgia, 'Noto Serif SC', serif;
    display: block;
  }

  .header-total {
    font-size: 22rpx;
    font-weight: 400;
    margin-top: 2rpx;
    display: block;
  }

  .header-grade-badge {
    padding: 8rpx 20rpx;
    border-radius: 24rpx;
    font-size: 24rpx;
    font-weight: 600;
    flex-shrink: 0;
  }

  .header-publisher-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 16rpx;
    padding: 14rpx 20rpx;
    border-radius: 16rpx;
    border: 2rpx solid;
    transition: all 0.2s ease;
  }

  .header-publisher-btn:active {
    opacity: 0.7;
    transform: scale(0.98);
  }

  .header-publisher-text {
    flex: 1;
    min-width: 0;
    font-size: 24rpx;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .filter-scroll {
    padding: 16rpx 20rpx 12rpx;
    white-space: nowrap;
  }

  .filter-track {
    display: inline-flex;
    gap: 12rpx;
  }

  .filter-pill {
    display: inline-block;
    padding: 12rpx 28rpx;
    font-size: 24rpx;
    font-weight: 500;
    border-radius: 40rpx;
    transition: all 0.25s ease;
    position: relative;
    background: rgba(255, 255, 255, 0.7);
    color: var(--theme-info, #8c8173);
  }

  .filter-pill--active {
    color: #2d2320;
    font-weight: 700;
    background: #ffffff;
    box-shadow: 0 2rpx 12rpx rgba(45, 35, 32, 0.06);
  }

  .filter-pill--active {
    font-weight: 700;
    background: #ffffff;
    box-shadow: 0 2rpx 12rpx rgba(45, 35, 32, 0.06);
  }

  .filter-pill--active::after {
    content: '';
    position: absolute;
    bottom: 4rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 20rpx;
    height: 4rpx;
    border-radius: 2rpx;
    background: var(--theme-primary, #a0652c);
  }

  .list-wrap {
    padding: 8rpx 20rpx 20rpx;
  }

  .card-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .book-card {
    display: flex;
    background: #ffffff;
    border-radius: 20rpx;
    overflow: hidden;
    box-shadow: 0 1rpx 8rpx rgba(45, 35, 32, 0.03);
    transition: all 0.2s ease;
    position: relative;
  }

  .book-card:active {
    transform: scale(0.985);
    box-shadow: 0 1rpx 4rpx rgba(45, 35, 32, 0.02);
  }

  .book-spine {
    width: 6rpx;
    flex-shrink: 0;
  }

  .book-cover {
    width: 100rpx;
    height: 140rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20rpx 0 20rpx 20rpx;
    border-radius: 12rpx;
  }

  .book-cover-text {
    font-size: 40rpx;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.85);
    font-family: Georgia, serif;
    text-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.1);
  }

  .book-info {
    flex: 1;
    min-width: 0;
    padding: 24rpx 24rpx 24rpx 16rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8rpx;
  }

  .book-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #2d2320;
    line-height: 1.4;
  }

  .book-tags {
    display: flex;
    gap: 8rpx;
    flex-wrap: wrap;
  }

  .book-tag {
    padding: 4rpx 14rpx;
    border-radius: 16rpx;
    font-size: 20rpx;
    font-weight: 500;
  }

  .book-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4rpx;
  }

  .book-size {
    font-size: 22rpx;
    color: #b8aea4;
    font-weight: 400;
  }

  .book-download {
    width: 52rpx;
    height: 52rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .book-download:active {
    transform: scale(0.88);
  }
</style>
