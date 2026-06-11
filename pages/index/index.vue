<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="flex flex-col p-0" style="background-color: #f5f3f7">
      <!-- Banner -->
      <!-- <view v-if="banners.length" class="relative overflow-hidden" style="height: 300rpx">
        <swiper
          class="w-full h-full"
          :autoplay="true"
          :interval="3500"
          :circular="true"
          indicator-dots
          indicator-color="rgba(255,255,255,0.3)"
          :indicator-active-color="'#8B5FBF'"
        >
          <swiper-item v-for="b in banners" :key="b._id" @click="onBannerTap(b)">
            <image :src="b.imageUrl" mode="aspectFill" class="w-full h-full" />
            <view
              class="absolute inset-0"
              style="background: linear-gradient(180deg, transparent 30%, rgba(0, 0, 0, 0.4) 100%)"
            />
          </swiper-item>
        </swiper>
      </view> -->

      <!-- 内容区 -->
      <view class="flex flex-col gap-4 px-4 pt-4 pb-6">
        <!-- 年级切换条 -->
        <scroll-view
          ref="tabScrollRef"
          scroll-x
          class="whitespace-nowrap tab-scroll-view"
          :show-scrollbar="false"
          :scroll-left="tabScrollLeft"
          scroll-with-animation
        >
          <view class="inline-flex gap-2">
            <view
              v-for="g in gradeList"
              :key="g.name"
              :id="'tab-' + g.name"
              class="inline-block px-5 py-2 text-sm font-semibold transition-all duration-300 rounded-full"
              :style="
                currentGrade === g.name
                  ? {
                      background: `linear-gradient(135deg, #8B5FBF, #61398F)`,
                      color: '#FFFFFF',
                      boxShadow: '0 4rpx 16rpx rgba(139,95,191,0.3)',
                    }
                  : { background: '#FFFFFF', color: '#878787', boxShadow: '0 1rpx 4rpx rgba(0,0,0,0.04)' }
              "
              @click="onGradeClick(g.name)"
            >
              {{ g.name }}
            </view>
          </view>
        </scroll-view>

        <!-- 加载中 -->
        <view v-if="loadingGrade" class="py-10 text-center">
          <text class="text-sm" style="color: #878787">加载中...</text>
        </view>

        <!-- 科目列表 -->
        <view class="rounded-2xl overflow-hidden bg-white" style="box-shadow: 0 2rpx 12rpx rgba(139, 95, 191, 0.04)">
          <view
            v-for="(subject, idx) in currentSubjects"
            :key="subject.name"
            class="flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity duration-150"
            :style="{ borderBottom: idx < currentSubjects.length - 1 ? '0.5px solid #E9E4ED' : 'none' }"
            @click="onSubjectClick(subject)"
          >
            <!-- 色点 + emoji -->
            <view class="shrink-0 relative flex items-center justify-center" style="width: 52rpx; height: 52rpx">
              <view class="rounded-xl opacity-15 absolute inset-0" :style="{ background: subject.color }" />
              <text style="font-size: 26rpx">{{ subject.icon }}</text>
            </view>
            <!-- 名称 -->
            <text class="flex-1 text-sm font-medium" style="color: #4a4a4a">{{ subject.name }}</text>
            <!-- 版本数 -->
            <text class="text-xs" style="color: #878787">{{ subject.publisherCount }}个版本</text>
            <!-- 箭头 -->
            <text class="ml-1 text-base" style="color: #d6c6e1">›</text>
          </view>
        </view>

        <!-- 无数据 -->
        <view v-if="!currentSubjects.length && !loadingGrade" class="py-10 text-center">
          <text class="text-sm" style="color: #878787">暂无科目数据</text>
        </view>
      </view>
    </view>

    <!-- 出版社选择弹窗 -->
    <yy-picker-modal v-model="showPublisherPicker" title="选择版本" :list="publisherNames" @change="onPublisherSelect" />
  </yy-paging>
</template>

<script setup>
  import treeData from '@/static/textbook-tree.json'

  const th = uni.$u.color

  const pagingConfig = ref({
    auto: false,
    refresherEnabled: false,
    showRefresherWhenReload: false,
    showTabbar: true,
    hideNav: false,
    showNavBack: false,
    navTitle: '教材宝',
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const banners = ref([])
  const tabScrollRef = ref(null)
  const tabScrollLeft = ref(0)
  const showPublisherPicker = ref(false)
  const selectedSubjectName = ref('')
  const selectedPublishers = ref([])
  const publisherNames = computed(() => selectedPublishers.value)

  // ===== 从 treeData 提取年级列表 =====
  const allGrades = (() => {
    const seen = new Set()
    Object.values(treeData).forEach(section => {
      Object.values(section).forEach(subject => {
        Object.values(subject).forEach(grades => {
          grades.forEach(g => seen.add(g))
        })
      })
    })
    // 按 GRADE_PRIORITY 排序
    const order = {
      '小学低年级':1,'小学高年级':2,'全一册':10,'上册':11,'下册':12,
      '一年级':20,'二年级':30,'三年级':40,'四年级':50,'五年级':60,'六年级':70,
      '七年级':80,'八年级':90,'九年级':100,
      '必修':201,'必修第一册':211,'必修第二册':212,'必修第三册':213,'必修第四册':214,
      '选择性必修第一册':241,'选择性必修第二册':242,'选择性必修第三册':243,
    }
    return [...seen].sort((a, b) => (order[a] || 999) - (order[b] || 999))
  })()

  const gradeList = ref(allGrades.map(name => ({ name })))
  const currentGrade = ref(allGrades.length > 0 ? allGrades[0] : '')
  const loadingGrade = ref(false)

  // ===== 当前年级的科目列表 =====
  const currentSubjects = computed(() => {
    const g = currentGrade.value
    if (!g) return []
    const subjectMap = {}
    Object.entries(treeData).forEach(([section, subjects]) => {
      Object.entries(subjects).forEach(([subject, publishers]) => {
        Object.entries(publishers).forEach(([publisher, grades]) => {
          if (grades.includes(g)) {
            if (!subjectMap[subject]) subjectMap[subject] = { publishers: [], publisherCount: 0 }
            if (!subjectMap[subject].publishers.includes(publisher)) {
              subjectMap[subject].publishers.push(publisher)
              subjectMap[subject].publisherCount++
            }
          }
        })
      })
    })
    return Object.entries(subjectMap).map(([name, info]) => ({
      name,
      icon: getSubjectIcon(name),
      color: getSubjectColor(name),
      publisherCount: info.publisherCount,
      publishers: info.publishers,
    }))
  })

  // ===== 年级切换自动居中 =====
  watch(currentGrade, () => {
    nextTick(() => {
      const query = uni.createSelectorQuery().in(tabScrollRef.value)
      query
        .select('.tab-scroll-view')
        .fields({ rect: true, scrollOffset: true }, sv => {
          if (!sv) return
          query
            .select('#tab-' + currentGrade.value)
            .fields({ rect: true }, tab => {
              if (!tab) return
              const targetLeft = tab.left - sv.left + sv.scrollLeft
              const offset = targetLeft - sv.width / 2 + tab.width / 2
              tabScrollLeft.value = Math.max(0, offset)
            })
            .exec()
        })
        .exec()
    })
  })

  function onGradeClick(name) {
    currentGrade.value = name
  }

  function onSubjectClick(subject) {
    if (!subject.publishers || subject.publishers.length === 0) {
      vk.navigateTo(`/pages/index/list?grade=${currentGrade.value}&subject=${subject.name}`)
      return
    }
    selectedSubjectName.value = subject.name
    if (subject.publishers.length === 1) {
      goToList(subject.publishers[0])
      return
    }
    selectedPublishers.value = subject.publishers
    showPublisherPicker.value = true
  }

  function goToList(publisher) {
    showPublisherPicker.value = false
    vk.navigateTo(
      `/pages/index/list?grade=${currentGrade.value}&subject=${selectedSubjectName.value}&publisher=${encodeURIComponent(publisher)}&title=${encodeURIComponent(selectedSubjectName.value + ' · ' + formatPublisherShort(publisher))}`,
    )
  }

  function onPublisherSelect(publisher) {
    goToList(publisher)
  }

  function formatPublisherShort(publisher) {
    return publisher.replace(/-.+/, '')
  }

  // --- 科目显示配置 ---
  function getSubjectIcon(name) {
    const map = {
      语文:'📖',数学:'📐',英语:'🌍',物理:'⚡',化学:'🧪',生物学:'🌿',生物:'🌿',
      历史:'📜',地理:'🗺️',道德与法治:'⚖️',政治:'⚖️',思想政治:'⚖️',
      科学:'🔬',体育与健康:'🏃',音乐:'🎵',美术:'🎨',艺术:'🎭',
      '语文·书法练习指导':'✍️',日语:'🗾',俄语:'🇷🇺',人文地理:'🌏',
      地理图册:'🗺️',通用技术:'🔧',信息技术:'💻',高等数学:'∫',
      线性代数:'∑',概率论与数理统计:'📊',离散数学:'🔢',
    }
    return map[name] || '📚'
  }

  function getSubjectColor(name) {
    const map = {
      语文:'#DC2626',数学:'#2563EB',英语:'#7C3AED',物理:'#D97706',
      化学:'#059669',生物学:'#16A34A',生物:'#16A34A',历史:'#B45309',
      地理:'#0891B2',道德与法治:'#DB2777',思想政治:'#DB2777',
      科学:'#0D9488',体育与健康:'#EA580C',音乐:'#9333EA',美术:'#C026D3',
      艺术:'#E11D48','语文·书法练习指导':'#92400E',日语:'#BE185D',
      俄语:'#1D4ED8',人文地理:'#0E7490',地理图册:'#0369A1',
      通用技术:'#4F46E5',信息技术:'#2563EB',高等数学:'#1E40AF',
      线性代数:'#3730A3',概率论与数理统计:'#5B21B6',离散数学:'#312E81',
    }
    return map[name] || '#6B7280'
  }

  // --- 生命周期 ---
  onLoad(() => {
    loadBanners()
  })

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  async function loadBanners() {
    const res = await vk.callFunction({ url: 'client/pub.index.getBanners' })
    if (res.code === 0) banners.value = res.data || []
  }

  function onBannerTap(banner) {
    if (banner.linkType === 'textbook' && banner.linkValue) {
      vk.navigateTo(`/pages/index/detail?id=${banner.linkValue}`)
    }
  }

  function queryList() {
    paging.value?.complete([3])
  }
</script>

<style lang="scss" scoped></style>
