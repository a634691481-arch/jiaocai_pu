<template>
  <u-popup v-model="show" mode="bottom" border-radius="24" :safe-area-inset-bottom="true" @close="onClose">
    <view class="picker-modal" :style="`--accent: ${activeColor}`">
      <!-- Header -->
      <view class="picker-header">
        <view class="picker-header-left">
          <text class="picker-title">{{ title }}</text>
          <text v-if="multiple && selectedLabels.length" class="picker-badge">{{ selectedLabels.length }}</text>
        </view>
        <view class="picker-header-actions">
          <text v-if="multiple && selectedLabels.length" class="picker-clear" @click="clearAll">清除</text>
          <view class="picker-close" @click="show = false">
            <yy-icon name="ri:close-line" size="20" :color="th.info" />
          </view>
        </view>
      </view>

      <!-- Search -->
      <view v-if="searchable" class="picker-search">
        <yy-icon name="ri:search-line" size="16" :color="th.info" class="picker-search-icon" />
        <input
          v-model="keyword"
          class="picker-search-input"
          :placeholder="searchPlaceholder"
          placeholder-class="picker-search-placeholder"
          @input="onSearchInput"
        />
        <view v-if="keyword" class="picker-search-clear" @click="keyword = ''">
          <yy-icon name="ri:close-circle-fill" size="16" :color="th.info" />
        </view>
      </view>

      <!-- List -->
      <view class="picker-body">
        <view class="picker-list">
          <template v-for="(section, si) in displayList" :key="si">
            <!-- Section header -->
            <view v-if="section.group" class="picker-section-header">
              <text class="picker-section-label">{{ section.group }}</text>
              <text class="picker-section-count">{{ section.items.length }}</text>
            </view>

            <!-- Items -->
            <view
              v-for="(item, ii) in section.items"
              :id="`pi-${si}-${ii}`"
              :key="ii"
              class="picker-item"
              :class="{ 'picker-item--active': isSelected(item), 'picker-item--first': ii === 0 }"
              :style="{ '--idx': ii + si * 10, '--item-accent': activeColor }"
              @click="onToggle(item)"
            >
              <!-- Icon -->
              <view v-if="itemIcon(item)" class="picker-item-icon" :style="{ background: itemBg(item) }">
                <yy-icon :name="itemIcon(item)" size="18" :color="activeColor" />
              </view>

              <!-- Content -->
              <view class="picker-item-body">
                <text class="picker-item-label" :class="{ 'picker-item-label--active': isSelected(item) }">
                  {{ itemLabel(item) }}
                </text>
                <text v-if="itemDesc(item)" class="picker-item-desc">{{ itemDesc(item) }}</text>
              </view>

              <!-- Checkmark / Radio -->
              <view class="picker-item-check">
                <view
                  v-if="multiple"
                  class="picker-checkbox"
                  :class="{ 'picker-checkbox--checked': isSelected(item) }"
                  :style="isSelected(item) ? { background: activeColor, borderColor: activeColor } : {}"
                >
                  <yy-icon v-if="isSelected(item)" name="ri:check-line" size="12" color="#ffffff" />
                </view>
                <yy-icon v-else-if="isSelected(item)" name="ri:check-line" size="20" :color="activeColor" />
              </view>
            </view>

            <!-- Empty -->
            <view v-if="!section.items.length" class="picker-empty">
              <yy-icon name="ri:inbox-2-line" size="40" :color="th.info" />
              <text class="picker-empty-text" :style="{ color: th.info }">{{ emptyText }}</text>
            </view>
          </template>
        </view>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
  const th = uni.$u.color

  function hexToRgb(hex) {
    const c = hex.replace('#', '')
    return `${parseInt(c.substring(0, 2), 16)}, ${parseInt(c.substring(2, 4), 16)}, ${parseInt(c.substring(4, 6), 16)}`
  }

  const accentRgb = computed(() => hexToRgb(props.activeColor))

  const props = defineProps({
    modelValue: Boolean,
    title: { type: String, default: '请选择' },
    list: { type: Array, default: () => [] },
    value: { type: [String, Number, Array], default: '' },
    activeColor: { type: String, default: uni.$u.color.primary },
    searchable: { type: Boolean, default: false },
    searchPlaceholder: { type: String, default: '搜索…' },
    multiple: { type: Boolean, default: false },
    emptyText: { type: String, default: '暂无选项' },
  })

  const emit = defineEmits(['update:modelValue', 'change', 'clear'])

  const show = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val),
  })

  const keyword = ref('')
  const scrollToId = ref('')
  const openCount = ref(0)

  // Normalize item to { label, value, icon?, desc? }
  function normalize(item) {
    if (item === null || item === undefined) return null
    if (typeof item === 'string' || typeof item === 'number') {
      return { label: String(item), value: item }
    }
    return {
      label: item.label ?? String(item.value ?? ''),
      value: item.value ?? item.label ?? '',
      icon: item.icon || '',
      desc: item.desc || '',
      bg: item.bg || '',
    }
  }

  function itemLabel(item) { return normalize(item)?.label ?? '' }
  function itemValue(item) { return normalize(item)?.value ?? '' }
  function itemIcon(item) { return normalize(item)?.icon ?? '' }
  function itemDesc(item) { return normalize(item)?.desc ?? '' }
  function itemBg(item) { return normalize(item)?.bg ?? `${th.primaryLight}` }

  // Grouped display list
  const displayList = computed(() => {
    const raw = props.list
    const kw = keyword.value.trim().toLowerCase()

    // Already grouped
    if (raw.length && raw[0]?.group !== undefined) {
      return raw.map(s => ({
        group: s.group,
        items: (s.items || []).filter(i => {
          if (!kw) return true
          const n = normalize(i)
          return n.label.toLowerCase().includes(kw) || n.desc.toLowerCase().includes(kw)
        }),
      }))
    }

    // Flat list
    let items = raw.map(i => normalize(i)).filter(Boolean)
    if (kw) {
      items = items.filter(i => i.label.toLowerCase().includes(kw) || i.desc.toLowerCase().includes(kw))
    }
    return [{ group: '', items }]
  })

  // Selected state
  const selectedValues = computed(() => {
    if (props.multiple) {
      return Array.isArray(props.value) ? props.value.map(v => itemValue(normalize(v))) : []
    }
    return []
  })

  const selectedLabels = computed(() => {
    if (!props.multiple) return []
    const vals = selectedValues.value
    return displayList.value.flatMap(s => s.items).filter(i => vals.includes(itemValue(i))).map(itemLabel)
  })

  function isSelected(item) {
    const val = itemValue(item)
    if (props.multiple) return selectedValues.value.includes(val)
    return props.value !== '' && props.value !== undefined && props.value !== null && String(props.value) === String(val)
  }

  function onToggle(item) {
    const val = itemValue(item)
    if (props.multiple) {
      const arr = Array.isArray(props.value) ? [...props.value] : []
      const idx = arr.findIndex(v => String(v) === String(val))
      if (idx > -1) arr.splice(idx, 1)
      else arr.push(val)
      emit('change', arr)
    } else {
      emit('change', val)
      show.value = false
    }
  }

  function clearAll() {
    emit('change', props.multiple ? [] : '')
    emit('clear')
  }

  function onClose() {
    keyword.value = ''
  }

  function onSearchInput() {
    scrollToId.value = ''
    nextTick(() => { scrollToId.value = 'pi-0-0' })
  }

  // Scroll to selected on open
  watch(show, (v) => {
    if (v) {
      openCount.value++
      keyword.value = ''
      nextTick(() => {
        const sections = displayList.value
        for (let si = 0; si < sections.length; si++) {
          for (let ii = 0; ii < sections[si].items.length; ii++) {
            if (isSelected(sections[si].items[ii])) {
              scrollToId.value = `pi-${si}-${ii}`
              return
            }
          }
        }
      })
    }
  })
</script>

<style lang="scss" scoped>
.picker-modal {
  display: flex;
  flex-direction: column;
  max-height: 75vh;
}

/* ===== Header ===== */
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx 12rpx;
  flex-shrink: 0;
  z-index: 2;
}

.picker-header-left {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.picker-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.5rpx;
}

.picker-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: var(--accent);
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1;
}

.picker-header-actions {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.picker-clear {
  font-size: 22rpx;
  color: var(--accent);
  font-weight: 500;
  padding: 6rpx 10rpx;
  border-radius: 8rpx;
}

.picker-clear:active {
  opacity: 0.6;
}

.picker-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
}

.picker-close:active {
  background: #ebebeb;
}

/* ===== Search ===== */
.picker-search {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin: 0 32rpx 12rpx;
  padding: 12rpx 16rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  flex-shrink: 0;
  z-index: 2;
}

.picker-search-icon {
  flex-shrink: 0;
}

.picker-search-input {
  flex: 1;
  font-size: 26rpx;
  color: #1a1a1a;
  height: 36rpx;
  line-height: 36rpx;
}

.picker-search-placeholder {
  color: #b0b0b0;
  font-size: 26rpx;
}

.picker-search-clear {
  flex-shrink: 0;
  padding: 4rpx;
}

/* ===== Body ===== */
.picker-body {
  flex: 1;
  min-height: 0;
  overflow-y: scroll;
  padding: 0 32rpx 16rpx;
  -webkit-overflow-scrolling: touch;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

/* ===== Section ===== */
.picker-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 8rpx 8rpx;
  margin-top: 4rpx;
}

.picker-section-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #8c8c8c;
  letter-spacing: 1rpx;
  text-transform: uppercase;
}

.picker-section-count {
  font-size: 22rpx;
  color: #bfbfbf;
  font-weight: 500;
}

/* ===== Item ===== */
.picker-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 16rpx;
  border-radius: 12rpx;
  transition: all 0.2s ease;
  animation: pickerItemIn 0.3s ease both;
  animation-delay: calc(var(--idx) * 20ms);
}

.picker-item--first {
  margin-top: 0;
}

.picker-item:active {
  transform: scale(0.98);
}

.picker-item--active {
  background: rgba(var(--accent-rgb, 160, 101, 44), 0.06);
}

@keyframes pickerItemIn {
  from {
    opacity: 0;
    transform: translateY(12rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.picker-item-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.picker-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.picker-item-label {
  font-size: 26rpx;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
  transition: all 0.2s ease;
}

.picker-item-label--active {
  font-weight: 700;
  color: var(--accent);
}

.picker-item-desc {
  font-size: 20rpx;
  color: #a0a0a0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== Checkbox ===== */
.picker-item-check {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  border: 2rpx solid #d4d4d4;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.picker-checkbox--checked {
  border-color: var(--accent);
}

/* ===== Empty ===== */
.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 80rpx 0;
}

.picker-empty-text {
  font-size: 24rpx;
}
</style>
