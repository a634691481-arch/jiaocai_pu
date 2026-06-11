<template>
  <yy-paging ref="paging" bgColor="#F3F4F6" :showTabbar="true" navTitle="分类" @query="queryList">
    <view class="page-content px-4 pt-4">
      <!-- 学段切换 -->
      <view class="flex gap-2 mb-4">
        <view
          v-for="s in sections"
          :key="s.key"
          class="flex-1 py-3 text-center rounded-2xl text-base font-medium transition-all duration-200"
          :class="currentSection === s.key ? 'bg-primary text-white' : 'bg-white text-secondary'"
          @click="switchSection(s.key)"
        >{{ s.label }}</view>
      </view>

      <!-- 年级 Tab 横向滚动 -->
      <scroll-view scroll-x class="whitespace-nowrap mb-5">
        <view class="inline-flex gap-2 px-1">
          <view
            v-for="g in currentGrades"
            :key="g.key"
            class="inline-block px-5 py-2 rounded-full text-sm transition-all duration-200"
            :class="currentGrade === g.key ? 'bg-primary text-white scale-105' : 'bg-white text-secondary'"
            @click="currentGrade = g.key"
          >{{ g.label }}</view>
        </view>
      </scroll-view>

      <!-- 科目宫格 -->
      <view class="grid grid-cols-3 gap-4">
        <view
          v-for="s in currentSubjects"
          :key="s.key"
          class="flex flex-col items-center justify-center rounded-2xl py-5 active:scale-95 transition-transform"
          :style="{ backgroundColor: s.bg }"
          @click="goToList(s)"
        >
          <text class="text-4xl mb-1">{{ s.icon }}</text>
          <text class="text-sm font-medium" :style="{ color: s.color }">{{ s.label }}</text>
        </view>
      </view>

      <!-- 底部广告占位 -->
      <view class="h-30"></view>
    </view>
  </yy-paging>
</template>

<script setup>
const paging = ref(null)

const SUBJECT_CONFIG = {
  chinese: { label: '语文', icon: '📚', color: '#EF4444', bg: '#FEE2E2' },
  math: { label: '数学', icon: '📐', color: '#3B82F6', bg: '#DBEAFE' },
  english: { label: '英语', icon: '🌐', color: '#8B5CF6', bg: '#EDE9FE' },
  physics: { label: '物理', icon: '⚛️', color: '#F59E0B', bg: '#FEF3C7' },
  chemistry: { label: '化学', icon: '⚗️', color: '#10B981', bg: '#D1FAE5' },
  biology: { label: '生物', icon: '🧬', color: '#22C55E', bg: '#DCFCE7' },
  politics: { label: '政治', icon: '📜', color: '#EC4899', bg: '#FCE7F3' },
  history: { label: '历史', icon: '🏛️', color: '#A16207', bg: '#FEF9C3' },
  geography: { label: '地理', icon: '🌍', color: '#06B6D4', bg: '#CFFAFE' },
}

const ALL_GRADES = [
  { key: 'grade1', label: '一年级' }, { key: 'grade2', label: '二年级' },
  { key: 'grade3', label: '三年级' }, { key: 'grade4', label: '四年级' },
  { key: 'grade5', label: '五年级' }, { key: 'grade6', label: '六年级' },
  { key: 'grade7', label: '七年级' }, { key: 'grade8', label: '八年级' },
  { key: 'grade9', label: '九年级' },
]

const sections = [
  { key: 'primary', label: '小学' },
  { key: 'junior', label: '初中' },
]

const currentSection = ref('primary')
const currentGrade = ref('grade1')

const currentGrades = computed(() => {
  if (currentSection.value === 'primary') return ALL_GRADES.slice(0, 6)
  return ALL_GRADES.slice(6)
})

const currentSubjects = computed(() => {
  const keys = currentSection.value === 'primary'
    ? ['chinese', 'math', 'english']
    : ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'politics', 'history', 'geography']
  return keys.map(k => ({ key: k, ...SUBJECT_CONFIG[k] }))
})

function switchSection(key) {
  currentSection.value = key
  currentGrade.value = key === 'primary' ? 'grade1' : 'grade7'
}

function goToList(subject) {
  vk.navigateTo(`/pages/category/list?grade=${currentGrade.value}&subject=${subject.key}&title=${encodeURIComponent(currentGrade.value.replace('grade','')+'年级·'+subject.label)}`)
}

function queryList() {
  paging.value.complete([])
}
</script>
