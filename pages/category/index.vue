<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex-col gap-4 p-4">
      <!-- 学段切换 -->
      <view class="flex p-1 rounded-2xl relative overflow-hidden">
        <view class="absolute inset-0 opacity-6" :style="{ backgroundColor: th.primary }" />
        <view
          v-for="s in sections"
          :key="s.key"
          class="flex-1 py-2.5 text-center rounded-xl text-sm font-semibold transition-all duration-300 relative z-10"
          :style="currentSection === s.key
            ? { background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})`, color: '#FFFFFF', boxShadow: `0 4rpx 16rpx ${th.primary}4d` }
            : { color: th.primaryDark, background: 'transparent' }"
          @click="switchSection(s.key)"
        >{{ s.label }}</view>
      </view>

      <!-- 年级标签 -->
      <scroll-view scroll-x class="whitespace-nowrap" :show-scrollbar="false">
        <view class="inline-flex gap-2 px-1 py-1">
          <view
            v-for="g in currentGrades"
            :key="g.key"
            class="inline-block px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
            :class="currentGrade === g.key ? 'scale-105' : ''"
            :style="currentGrade === g.key
              ? { background: `linear-gradient(135deg, ${th.primary}, ${th.primaryDark})`, color: '#FFFFFF', boxShadow: `0 2rpx 12rpx ${th.primary}40` }
              : { background: '#FFFFFF', color: '#6B7280', boxShadow: '0 1rpx 4rpx rgba(0,0,0,0.04)' }"
            @click="currentGrade = g.key"
          >{{ g.label }}</view>
        </view>
      </scroll-view>

      <!-- 科目宫格 -->
      <view class="grid grid-cols-3 gap-3">
        <view
          v-for="s in currentSubjects"
          :key="s.key"
          class="flex flex-col items-center justify-center rounded-2xl py-6 active:scale-[0.95] transition-all duration-250 relative overflow-hidden"
          :style="{ backgroundColor: s.bg }"
          @click="goToList(s)"
        >
          <view class="absolute inset-0 opacity-20" :style="{ background: `radial-gradient(circle at 30% 20%, ${s.color}, transparent 70%)` }" />
          <text class="text-3xl relative z-10">{{ s.icon }}</text>
          <text class="text-xs font-semibold mt-2 relative z-10" :style="{ color: s.color }">{{ s.label }}</text>
        </view>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  const th = uni.$u.color

  const pagingConfig = ref({
    auto: false,
    refresherEnabled: true,
    showRefresherWhenReload: true,
    showTabbar: true,
    hideNav: false,
    showNavBack: false,
    navTitle: '分类',
    color: th.primary,
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()

  const SUBJECT_CONFIG = {
    chinese: { label: '语文', icon: '📖', color: '#DC2626', bg: '#FEF2F2' },
    math: { label: '数学', icon: '📐', color: '#2563EB', bg: '#EFF6FF' },
    english: { label: '英语', icon: '🌍', color: '#7C3AED', bg: '#F5F3FF' },
    physics: { label: '物理', icon: '⚡', color: '#D97706', bg: '#FFFBEB' },
    chemistry: { label: '化学', icon: '🧪', color: '#059669', bg: '#ECFDF5' },
    biology: { label: '生物', icon: '🌿', color: '#16A34A', bg: '#F0FDF4' },
    politics: { label: '政治', icon: '⚖️', color: '#DB2777', bg: '#FDF2F8' },
    history: { label: '历史', icon: '📜', color: '#B45309', bg: '#FFFBEB' },
    geography: { label: '地理', icon: '🗺️', color: '#0891B2', bg: '#ECFEFF' },
  }

  const ALL_GRADES = [
    { key: 'grade1', label: '一年级' }, { key: 'grade2', label: '二年级' },
    { key: 'grade3', label: '三年级' }, { key: 'grade4', label: '四年级' },
    { key: 'grade5', label: '五年级' }, { key: 'grade6', label: '六年级' },
    { key: 'grade7', label: '七年级' }, { key: 'grade8', label: '八年级' },
    { key: 'grade9', label: '九年级' },
  ]

  const sections = [
    { key: 'primary', label: '🏫 小学' },
    { key: 'junior', label: '🎓 初中' },
  ]

  const currentSection = ref('primary')
  const currentGrade = ref('grade1')

  const currentGrades = computed(() =>
    currentSection.value === 'primary' ? ALL_GRADES.slice(0, 6) : ALL_GRADES.slice(6)
  )

  const currentSubjects = computed(() => {
    const keys = currentSection.value === 'primary'
      ? ['chinese', 'math', 'english']
      : ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'politics', 'history', 'geography']
    return keys.map(k => ({ key: k, ...SUBJECT_CONFIG[k] }))
  })

  onLoad(() => {})
  onShow(() => {})

  function scroll(e) { state.value.isScroll = e.detail.scrollTop > 0 }

  function switchSection(key) {
    currentSection.value = key
    currentGrade.value = key === 'primary' ? 'grade1' : 'grade7'
  }

  function goToList(subject) {
    vk.navigateTo(`/pages/category/list?grade=${currentGrade.value}&subject=${subject.key}&title=${encodeURIComponent(currentGrade.value.replace('grade','')+'年级·'+subject.label)}`)
  }

  function queryList() { paging.value?.complete([]) }
</script>

<style lang="scss" scoped></style>
