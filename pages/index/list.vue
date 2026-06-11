<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-3 p-3">
      <!-- 顶部筛选栏 -->
      <view
        class="flex items-center gap-3 rounded-2xl p-4"
        style="background: #ffffff; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04)"
      >
        <view
          class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
          :style="{ background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})` }"
        >
          <yy-icon name="ri:book-2-line" size="20" color="#ffffff" />
        </view>
        <view class="flex-1 min-w-0">
          <text class="line-clamp-1 text-sm font-bold" style="color: #1f2937">{{ subject }}</text>
          <text class="text-xs mt-0.5" style="color: #94a3b8">{{ publisher || '全部版本' }} · {{ state.dataList.length }}册</text>
        </view>
        <view
          class="px-3 py-1.5 rounded-full text-xs font-medium"
          :style="{ background: `${th.primary}10`, color: th.primary }"
        >
          {{ currentGradeFilter || '全部年级' }}
        </view>
      </view>

      <!-- 年级快速筛选 -->
      <scroll-view scroll-x class="whitespace-nowrap" :show-scrollbar="false">
        <view class="inline-flex gap-2 px-1 py-1">
          <view
            v-for="g in gradeFilters"
            :key="g"
            class="inline-block px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200"
            :style="
              currentGradeFilter === g
                ? { background: th.primary, color: '#ffffff', boxShadow: `0 4rpx 12rpx ${th.primary}40` }
                : { background: '#f3f4f6', color: '#6b7280' }
            "
            @click="filterByGrade(g)"
          >{{ g }}</view>
        </view>
      </scroll-view>

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
          <view class="relative shrink-0 w-11 h-14 rounded-lg overflow-hidden flex flex-col items-center justify-center" style="background: linear-gradient(135deg, #ef4444, #dc2626)">
            <text class="text-[10px] font-black tracking-wider" style="color: #ffffff">PDF</text>
            <view class="absolute bottom-0 left-0 right-0 h-2" style="background: #b91c1c" />
          </view>

          <!-- 文件信息 -->
          <view class="flex-1 min-w-0">
            <text class="text-sm font-semibold line-clamp-1" style="color: #1f2937">{{ item.title }}</text>
            <view class="flex items-center gap-2 mt-1">
              <text class="text-xs" style="color: #94a3b8">{{ item.publisherShort }}</text>
              <view class="w-0.5 h-0.5 rounded-full" style="background: #d1d5db" />
              <text class="text-xs" style="color: #94a3b8">{{ item.grade }}</text>
            </view>
          </view>

          <!-- 文件大小 -->
          <view class="shrink-0 flex flex-col items-end gap-1">
            <text class="text-xs font-medium" style="color: #6b7280">{{ item.sizeDisplay }}</text>
            <view class="flex items-center gap-1">
              <view
                class="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90"
                :style="{ background: `${th.primary}10` }"
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
  import textbookTree from '@/common/mock/textbook-tree.js'

  const th = uni.$u.color

  const pagingConfig = ref({
    auto: false,
    refresherEnabled: false,
    showRefresherWhenReload: false,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '教材列表',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const loaded = ref(false)

  const section = ref('')
  const subject = ref('')
  const publisher = ref('')
  const grade = ref('')
  const pageTitle = ref('')

  const currentGradeFilter = ref('')
  const allItems = ref([])

  const gradeFilters = computed(() => {
    const grades = allItems.value.map(i => i.grade)
    return ['全部年级', ...new Set(grades)]
  })

  const filteredList = computed(() => {
    if (!currentGradeFilter.value || currentGradeFilter.value === '全部年级') return allItems.value
    return allItems.value.filter(i => i.grade === currentGradeFilter.value)
  })

  function filterByGrade(g) {
    currentGradeFilter.value = g === '全部年级' ? '' : g
  }

  onLoad(options => {
    section.value = options.section || ''
    subject.value = options.subject || ''
    publisher.value = decodeURIComponent(options.publisher || '')
    grade.value = decodeURIComponent(options.grade || '')
    pageTitle.value = decodeURIComponent(options.title || '')
    if (pageTitle.value) pagingConfig.value.navTitle = pageTitle.value
    loadTreeData()
  })
  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function loadTreeData() {
    const sectionData = textbookTree[section.value]
    if (!sectionData) { paging.value?.complete([]); loaded.value = true; return }
    const subjectData = sectionData[subject.value]
    if (!subjectData) { paging.value?.complete([]); loaded.value = true; return }

    const items = []

    if (publisher.value && subjectData[publisher.value]) {
      // 指定出版社 → 列出该出版社下所有年级
      const grades = subjectData[publisher.value]
      grades.forEach(g => {
        items.push(makeItem(g, publisher.value))
      })
    } else {
      // 未指定出版社 → 列出所有出版社的所有年级
      Object.entries(subjectData).forEach(([pub, gs]) => {
        gs.forEach(g => {
          items.push(makeItem(g, pub))
        })
      })
    }

    allItems.value = items
    totalCount.value = items.length
    loaded.value = true
    paging.value?.complete(items)
  }

  const totalCount = ref(0)

  function makeItem(gradeName, pub) {
    const title = `义务教育教科书·${subject.value}${gradeName}`
    const pubShort = pub.replace(/-.+/, '')
    const sizeBytes = mockSize(subject.value, gradeName)
    return {
      title,
      grade: gradeName,
      publisher: pub,
      publisherShort: pubShort,
      subject: subject.value,
      section: section.value,
      sizeBytes,
      sizeDisplay: formatSize(sizeBytes),
    }
  }

  function mockSize(subj, grade) {
    let hash = 0
    const str = subj + grade
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
    }
    const base = 8000 + Math.abs(hash) % 12000
    return base * 1024
  }

  function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function goDetail(item) {
    vk.navigateTo(
      `/pages/index/detail?title=${encodeURIComponent(item.title)}&subject=${encodeURIComponent(item.subject)}&publisher=${encodeURIComponent(item.publisher)}&grade=${encodeURIComponent(item.grade)}&section=${encodeURIComponent(item.section)}&fileSize=${item.sizeBytes}`,
    )
  }

  function handleDownload(item) {
    goDetail(item)
  }

  function queryList() {
    paging.value?.complete([])
  }
</script>

<style lang="scss" scoped></style>
