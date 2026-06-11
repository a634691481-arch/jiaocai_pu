<template>
  <yy-paging
    v-model="state.dataList"
    @query="queryList"
    ref="paging"
    @scroll="scroll"
    v-bind="pagingConfig"
    :color="th.primary"
  >
    <view class="flex-col gap-3 p-3">
      <!-- 固定顶部 -->
      <view style="position: sticky; top: 0; z-index: 10; background: #f5f3f7">
        <!-- 顶部筛选栏 -->
        <view
          class="rounded-2xl flex items-center gap-3 p-4"
          style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04)"
        >
          <view
            class="rounded-xl shrink-0 flex items-center justify-center w-10 h-10"
            :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }"
          >
            <yy-icon name="ri:book-2-line" size="20" color="#ffffff" />
          </view>
          <view class="flex-1 min-w-0">
            <text class="line-clamp-1 text-sm font-bold" style="color: #4a4a4a">{{ subject }}</text>
            <text class="text-xs mt-0.5" style="color: #878787">
              {{ publisher || '全部版本' }} · {{ state.dataList.length }}册
            </text>
          </view>
          <view
            class="px-3 py-1.5 rounded-full text-xs font-medium"
            :style="{ background: `rgba(139, 95, 191, 0.08)`, color: '#8B5FBF' }"
          >
            {{ currentGradeFilter || '全部年级' }}
          </view>
        </view>

        <!-- 年级快速筛选 -->
        <scroll-view scroll-x class="whitespace-nowrap" :show-scrollbar="false" style="padding-bottom: 12rpx">
          <view class="inline-flex gap-2 px-1 py-1">
            <view
              v-for="g in gradeFilters"
              :key="g"
              class="inline-block px-4 py-2 text-xs font-semibold transition-all duration-200 rounded-full"
              :style="
                currentGradeFilter === g
                  ? { background: '#8B5FBF', color: '#ffffff', boxShadow: '0 4rpx 12rpx rgba(139, 95, 191, 0.25)' }
                  : { background: '#f3f4f6', color: '#878787' }
              "
              @click="filterByGrade(g)"
            >
              {{ g }}
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 教材文件列表 -->
      <view class="flex-col gap-1.5 pb-4">
        <view
          v-for="(item, idx) in filteredList"
          :key="idx"
          class="flex items-center gap-3.5 rounded-2xl p-3.5 active:scale-[0.98] transition-all duration-150"
          style="background: #ffffff; box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.03)"
          @click="goDetail(item)"
        >
          <!-- PDF 图标 -->
          <view
            class="shrink-0 w-11 h-14 relative flex flex-col items-center justify-center overflow-hidden rounded-lg"
            style="background: linear-gradient(135deg, #ef4444, #dc2626)"
          >
            <text class="text-[10px] font-black tracking-wider" style="color: #ffffff">PDF</text>
            <view class="absolute bottom-0 left-0 right-0 h-2" style="background: #b91c1c" />
          </view>

          <!-- 文件信息 -->
          <view class="flex-1 min-w-0">
            <text class="line-clamp-1 text-sm font-semibold" style="color: #4a4a4a">{{ item.title }}</text>
            <view class="flex items-center gap-2 mt-1">
              <text class="text-xs" style="color: #878787">{{ item.publisher || '' }}</text>
              <view class="w-0.5 h-0.5 rounded-full" style="background: #d6c6e1" />
              <text class="text-xs" style="color: #878787">{{ item.grade }}</text>
            </view>
          </view>

          <!-- 文件大小 -->
          <view class="shrink-0 flex flex-col items-end gap-1">
            <text class="text-xs font-medium" style="color: #878787">{{ formatSize(item.fileSize) }}</text>
            <view class="flex items-center gap-1">
              <view
                class="w-7 h-7 active:scale-90 flex items-center justify-center rounded-lg"
                :style="{ background: `rgba(139, 95, 191, 0.08)` }"
                @click.stop="handleDownload(item)"
              >
                <yy-icon name="ri:download-2-line" size="14" :color="th.primary" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <yy-empty v-if="!filteredList.length && loaded" />
    </view>
  </yy-paging>
</template>

<script setup>
  import textbookData from '@/static/textbook-data.json'
  import treeData from '@/static/textbook-tree.json'

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

  const currentGradeFilter = ref('')
  const gradeFilters = ref(['全部年级'])

  // 从 treeData 提取当前学段下当前科目+出版社的所有年级
  function loadGrades() {
    const secData = treeData[section.value]
    if (!secData) { gradeFilters.value = ['全部年级']; return }
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

  // 本地过滤教材数据（学段 + 科目 ± 出版社）
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
    if (!currentGradeFilter.value || currentGradeFilter.value === '全部年级') return state.value.dataList
    return state.value.dataList.filter(i => i.grade === currentGradeFilter.value)
  })

  function filterByGrade(g) {
    currentGradeFilter.value = g === '全部年级' ? '' : g
  }

  onLoad(options => {
    section.value = options.section || ''
    subject.value = options.subject || ''
    publisher.value = decodeURIComponent(options.publisher || '')
    pageTitle.value = decodeURIComponent(options.title || '')
    if (pageTitle.value) pagingConfig.value.navTitle = pageTitle.value
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
    vk.navigateTo(
      `/pages/index/detail?title=${encodeURIComponent(item.title)}&subject=${encodeURIComponent(item.subject)}&publisher=${encodeURIComponent(item.publisher)}&grade=${encodeURIComponent(item.grade)}&section=${encodeURIComponent(item.section)}&fileSize=${item.fileSize}&fileUrl=${encodeURIComponent(item.fileUrl)}`,
    )
  }

  function handleDownload(item) {
    goDetail(item)
  }
</script>

<style lang="scss" scoped></style>
