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
        <!-- 年级切换条（固定顶部） -->
        <scroll-view
          ref="tabScrollRef"
          scroll-x
          class="whitespace-nowrap tab-scroll-view"
          :show-scrollbar="false"
          :scroll-left="tabScrollLeft"
          scroll-with-animation
          style="position: sticky; top: 0; z-index: 10; background: #f5f3f7; padding: 12rpx 0"
        >
          <view class="inline-flex gap-2">
            <view
              v-for="sec in sectionList"
              :key="sec"
              :id="'section-' + sec"
              class="inline-block px-5 py-2 text-sm font-semibold transition-all duration-300 rounded-full"
              :style="
                currentSection === sec
                  ? {
                      background: `linear-gradient(135deg, #8B5FBF, #61398F)`,
                      color: '#FFFFFF',
                      boxShadow: '0 4rpx 16rpx rgba(139,95,191,0.3)',
                    }
                  : { background: '#FFFFFF', color: '#878787', boxShadow: '0 1rpx 4rpx rgba(0,0,0,0.04)' }
              "
              @click="onSectionClick(sec)"
            >
              {{ sec }}
            </view>
          </view>
        </scroll-view>

        <!-- 科目列表 -->
        <view v-if="currentSubjects.length" class="flex flex-col gap-2">
          <view
            v-for="sub in currentSubjects"
            :key="sub.name"
            class="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-all duration-150"
            style="background: #ffffff; box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.03)"
            @click="onSubjectClick(sub)"
          >
            <view
              class="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-xl"
              :style="{ background: sub.color + '18' }"
            >
              <text>{{ sub.icon }}</text>
            </view>
            <view class="flex-1 min-w-0">
              <text class="line-clamp-1 text-sm font-semibold" style="color: #4a4a4a">{{ sub.name }}</text>
              <text class="text-xs mt-0.5" style="color: #878787">{{ sub.publisherCount }}个版本</text>
            </view>
            <yy-icon name="ri:arrow-right-s-line" size="20" :color="th.primary" />
          </view>
        </view>

        <!-- 无数据 -->
        <view v-if="!currentSubjects.length" class="py-10 text-center">
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
    navTitle: '教材铺',
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

  // ===== treeData 的顶级键即学段列表，按小学→初中→高中优先排序 =====
  const SECTION_ORDER = { 小学: 1, '小学（五•四学制）': 2, 初中: 3, '初中（五•四学制）': 4, 高中: 5 }
  const sectionList = Object.keys(treeData).sort((a, b) => (SECTION_ORDER[a] || 99) - (SECTION_ORDER[b] || 99))
  const currentSection = ref(sectionList[0] || '')

  // ===== 当前学段下的科目列表 =====
  const currentSubjects = computed(() => {
    const sec = currentSection.value
    if (!sec || !treeData[sec]) return []
    return Object.entries(treeData[sec]).map(([name, publishers]) => ({
      name,
      icon: getSubjectIcon(name),
      color: getSubjectColor(name),
      publisherCount: Object.keys(publishers).length,
      publishers: Object.keys(publishers),
    }))
  })

  // ===== 学段切换自动居中 =====
  watch(currentSection, () => {
    nextTick(() => {
      const query = uni.createSelectorQuery().in(tabScrollRef.value)
      query
        .select('.tab-scroll-view')
        .fields({ rect: true, scrollOffset: true }, sv => {
          if (!sv) return
          uni
            .createSelectorQuery()
            .in(tabScrollRef.value)
            .select('#section-' + currentSection.value)
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

  function onSectionClick(name) {
    currentSection.value = name
  }

  function onSubjectClick(subject) {
    if (!subject.publishers || subject.publishers.length === 0) {
      vk.navigateTo(`/pages/index/list?section=${currentSection.value}&subject=${subject.name}`)
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
    const sec = currentSection.value
    const subj = selectedSubjectName.value
    vk.navigateTo(
      `/pages/index/list?section=${sec}&subject=${subj}&publisher=${encodeURIComponent(publisher)}&title=${encodeURIComponent(subj + ' · ' + formatPublisherShort(publisher))}`,
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
      语文: '📖',
      数学: '📐',
      英语: '🌍',
      物理: '⚡',
      化学: '🧪',
      生物学: '🌿',
      生物: '🌿',
      历史: '📜',
      地理: '🗺️',
      道德与法治: '⚖️',
      政治: '⚖️',
      思想政治: '⚖️',
      科学: '🔬',
      体育与健康: '🏃',
      音乐: '🎵',
      美术: '🎨',
      艺术: '🎭',
      '语文·书法练习指导': '✍️',
      日语: '🗾',
      俄语: '🇷🇺',
      人文地理: '🌏',
      地理图册: '🗺️',
      通用技术: '🔧',
      信息技术: '💻',
      高等数学: '∫',
      线性代数: '∑',
      概率论与数理统计: '📊',
      离散数学: '🔢',
    }
    return map[name] || '📚'
  }

  function getSubjectColor(name) {
    const map = {
      语文: '#DC2626',
      数学: '#2563EB',
      英语: '#7C3AED',
      物理: '#D97706',
      化学: '#059669',
      生物学: '#16A34A',
      生物: '#16A34A',
      历史: '#B45309',
      地理: '#0891B2',
      道德与法治: '#DB2777',
      思想政治: '#DB2777',
      科学: '#0D9488',
      体育与健康: '#EA580C',
      音乐: '#9333EA',
      美术: '#C026D3',
      艺术: '#E11D48',
      '语文·书法练习指导': '#92400E',
      日语: '#BE185D',
      俄语: '#1D4ED8',
      人文地理: '#0E7490',
      地理图册: '#0369A1',
      通用技术: '#4F46E5',
      信息技术: '#2563EB',
      高等数学: '#1E40AF',
      线性代数: '#3730A3',
      概率论与数理统计: '#5B21B6',
      离散数学: '#312E81',
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
