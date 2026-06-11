<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- Banner -->
      <view v-if="banners.length" class="rounded-2xl relative overflow-hidden" style="height: 300rpx">
        <swiper
          class="w-full h-full"
          :autoplay="true"
          :interval="3500"
          :circular="true"
          indicator-dots
          indicator-color="rgba(255,255,255,0.4)"
          :indicator-active-color="th.primary"
        >
          <swiper-item v-for="b in banners" :key="b._id" @click="onBannerTap(b)">
            <image :src="b.imageUrl" mode="aspectFill" class="w-full h-full" />
            <view
              class="absolute inset-0"
              style="background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.35) 100%)"
            />
          </swiper-item>
        </swiper>
      </view>

      <!-- 学段切换 -->
      <view>
        <scroll-view scroll-x class="whitespace-nowrap" :show-scrollbar="false">
          <view class="inline-flex gap-3 px-1 py-1">
            <view
              v-for="s in sectionKeys"
              :key="s"
              class="inline-block px-6 py-2.5 text-sm font-semibold transition-all duration-300 rounded-full"
              :style="
                currentSection === s
                  ? { background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})`, color: '#FFFFFF', boxShadow: `0 4rpx 16rpx ${th.primary}4d` }
                  : { background: '#FFFFFF', color: '#6B7280', boxShadow: '0 1rpx 4rpx rgba(0,0,0,0.04)' }
              "
              @click="currentSection = s"
            >{{ s }}</view>
          </view>
        </scroll-view>
      </view>

      <!-- 科目宫格 -->
      <view class="grid grid-cols-3 gap-3">
        <view
          v-for="subject in currentSubjects"
          :key="subject.name"
          class="flex flex-col items-center justify-center rounded-2xl py-5 active:scale-[0.95] transition-all duration-250 relative overflow-hidden"
          :style="{ backgroundColor: subject.bg }"
          @click="onSubjectClick(subject)"
        >
          <view
            class="opacity-15 absolute inset-0"
            :style="{ background: `radial-gradient(circle at 30% 20%, ${subject.color}, transparent 70%)` }"
          />
          <text class="relative z-10 text-2xl">{{ subject.icon }}</text>
          <text class="relative z-10 mt-1.5 text-xs font-semibold" :style="{ color: subject.color }">{{ subject.name }}</text>
          <text class="relative z-10 mt-0.5 text-xs" style="color: #9CA3AF">{{ subject.publisherCount }}版</text>
        </view>
      </view>
    </view>

    <!-- 出版社选择弹窗 -->
    <yy-picker-modal
      v-model="showPublisherPicker"
      title="选择版本"
      :list="publisherNames"
      @change="onPublisherSelect"
    />
  </yy-paging>
</template>

<script setup>
  import textbookTree from '@/common/mock/textbook-tree.js'

  const th = uni.$u.color

  const pagingConfig = ref({
    auto: false,
    refresherEnabled: false,
    showRefresherWhenReload: false,
    showTabbar: true,
    hideNav: false,
    showNavBack: false,
    navTitle: '教材宝',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const banners = ref([])
  const showPublisherPicker = ref(false)
  const selectedSubjectName = ref('')
  const selectedPublishers = ref({})
  const publisherNames = computed(() => Object.keys(selectedPublishers.value))

  // --- 从 tree 动态提取 ---
  const sectionKeys = Object.keys(textbookTree).filter(k => k !== '学数学最重要的刷习题在这里')
  const currentSection = ref('小学')

  const currentSubjects = computed(() => {
    const sectionData = textbookTree[currentSection.value]
    if (!sectionData) return []
    return Object.entries(sectionData).map(([name, publishers]) => ({
      name,
      icon: getSubjectIcon(name),
      color: getSubjectColor(name),
      bg: getSubjectBg(name),
      publisherCount: Array.isArray(publishers) ? 0 : Object.keys(publishers).length,
      publishers,
    }))
  })

  function onSubjectClick(subject) {
    if (!subject.publishers || Array.isArray(subject.publishers)) {
      // 无出版社层级（如刷习题），直接跳
      vk.navigateTo(`/pages/index/list?section=${currentSection.value}&subject=${subject.name}`)
      return
    }
    selectedSubjectName.value = subject.name
    const entries = Object.entries(subject.publishers)
    if (entries.length === 1) {
      // 仅一个出版社，直接跳
      const [publisher, grades] = entries[0]
      goToList(publisher, grades)
      return
    }
    // 多出版社：弹窗选择
    selectedPublishers.value = subject.publishers
    showPublisherPicker.value = true
  }

  function goToList(publisher, grades) {
    showPublisherPicker.value = false
    const firstGrade = Array.isArray(grades) ? grades[0] : ''
    vk.navigateTo(
      `/pages/index/list?section=${currentSection.value}&subject=${selectedSubjectName.value}&publisher=${encodeURIComponent(publisher)}&grade=${encodeURIComponent(firstGrade)}&title=${encodeURIComponent(selectedSubjectName.value + ' · ' + formatPublisherShort(publisher))}`
    )
  }

  function onPublisherSelect(publisher) {
    const grades = selectedPublishers.value[publisher]
    goToList(publisher, grades)
  }

  function formatPublisherShort(publisher) {
    return publisher.replace(/-.+/, '')
  }

  // --- 科目显示配置 ---
  function getSubjectIcon(name) {
    const map = {
      '语文': '📖', '数学': '📐', '英语': '🌍', '物理': '⚡', '化学': '🧪',
      '生物学': '🌿', '生物': '🌿', '历史': '📜', '地理': '🗺️', '道德与法治': '⚖️',
      '政治': '⚖️', '思想政治': '⚖️', '科学': '🔬', '体育与健康': '🏃', '音乐': '🎵',
      '美术': '🎨', '艺术': '🎭', '语文·书法练习指导': '✍️', '日语': '🗾',
      '俄语': '🇷🇺', '人文地理': '🌏', '地理图册': '🗺️', '通用技术': '🔧',
      '信息技术': '💻', '高等数学': '∫', '线性代数': '∑', '概率论与数理统计': '📊',
      '离散数学': '🔢', '初中练习题_带答案': '📝',
    }
    return map[name] || '📚'
  }

  function getSubjectColor(name) {
    const map = {
      '语文': '#DC2626', '数学': '#2563EB', '英语': '#7C3AED', '物理': '#D97706',
      '化学': '#059669', '生物学': '#16A34A', '生物': '#16A34A', '历史': '#B45309',
      '地理': '#0891B2', '道德与法治': '#DB2777', '思想政治': '#DB2777',
      '科学': '#0D9488', '体育与健康': '#EA580C', '音乐': '#9333EA', '美术': '#C026D3',
      '艺术': '#E11D48', '语文·书法练习指导': '#92400E', '日语': '#BE185D',
      '俄语': '#1D4ED8', '人文地理': '#0E7490', '地理图册': '#0369A1',
      '通用技术': '#4F46E5', '信息技术': '#2563EB', '高等数学': '#1E40AF',
      '线性代数': '#3730A3', '概率论与数理统计': '#5B21B6', '离散数学': '#312E81',
      '初中练习题_带答案': '#B45309',
    }
    return map[name] || '#6B7280'
  }

  function getSubjectBg(name) {
    const map = {
      '语文': '#FEF2F2', '数学': '#EFF6FF', '英语': '#F5F3FF', '物理': '#FFFBEB',
      '化学': '#ECFDF5', '生物学': '#F0FDF4', '生物': '#F0FDF4', '历史': '#FFFBEB',
      '地理': '#ECFEFF', '道德与法治': '#FDF2F8', '思想政治': '#FDF2F8',
      '科学': '#F0FDFA', '体育与健康': '#FFF7ED', '音乐': '#FAFAF5', '美术': '#FDF4FF',
      '艺术': '#FFF1F2', '语文·书法练习指导': '#FFFBEB', '日语': '#FDF2F8',
      '俄语': '#EFF6FF', '人文地理': '#ECFEFF', '地理图册': '#F0F9FF',
      '通用技术': '#EEF2FF', '信息技术': '#EFF6FF', '高等数学': '#EFF6FF',
      '线性代数': '#EEF2FF', '概率论与数理统计': '#F5F3FF', '离散数学': '#EEF2FF',
      '初中练习题_带答案': '#FFFBEB',
    }
    return map[name] || '#F9FAFB'
  }

  // --- 生命周期 ---
  onLoad(() => { loadBanners() })
  onShow(() => {})

  function scroll(e) { state.value.isScroll = e.detail.scrollTop > 0 }

  async function loadBanners() {
    const res = await vk.callFunction({ url: 'client/pub_index.getBanners' })
    if (res.code === 1) banners.value = res.data || []
  }

  function onBannerTap(banner) {
    if (banner.linkType === 'textbook' && banner.linkValue) {
      vk.navigateTo(`/pages/index/detail?id=${banner.linkValue}`)
    }
  }

  function queryList() { paging.value?.complete([]) }
</script>

<style lang="scss" scoped></style>
