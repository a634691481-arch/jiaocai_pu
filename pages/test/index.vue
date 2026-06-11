<template>
  <view class="min-h-screen px-4 pb-8" style="background:#F5F5F5">
    <view class="pt-2 pb-3 text-sm text-gray-400">
      批量导入测试工具 — 将本地数据一键导入数据库
    </view>

    <!-- Textbooks -->
    <view class="mb-4 p-4 bg-white rounded-xl shadow-sm">
      <view class="flex items-center justify-between mb-3">
        <view class="flex items-center gap-2">
          <view class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#E8F5E9">
            <text class="text-base">📚</text>
          </view>
          <view>
            <text class="text-sm font-semibold text-gray-800">教材数据 (textbooks)</text>
            <text class="text-xs text-gray-400 block">2002 条记录</text>
          </view>
        </view>
        <view
          class="px-4 py-1.5 text-xs font-semibold rounded-full active:opacity-80"
          :style="txtRunning ? { background:'#E5E5E5', color:'#999' } : { background:'linear-gradient(135deg,#8B5FBF,#61398F)', color:'#FFF' }"
          @click="!txtRunning && importTextbooks()">
          {{ txtRunning ? `${txtProgress.batch}/${txtProgress.totalBatches}` : '开始导入' }}
        </view>
      </view>
      <view v-if="txtProgress.msg" class="text-xs py-2 px-3 rounded-lg" :style="{ background: txtProgress.err ? '#FFF2F2' : '#F0FFF0', color: txtProgress.err ? '#E54B4B' : '#2E7D32' }">
        {{ txtProgress.msg }}
      </view>
      <view v-if="txtProgress.total > 0" class="mt-2">
        <view class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <view class="h-full rounded-full transition-all duration-300" style="background:linear-gradient(90deg,#8B5FBF,#61398F)" :style="{ width: txtProgress.total ? (txtProgress.imported / txtProgress.total * 100) + '%' : '0%' }"></view>
        </view>
        <text class="text-xs text-gray-400 mt-1 block">{{ txtProgress.imported }}/{{ txtProgress.total }}</text>
      </view>
    </view>

    <!-- Grades -->
    <view class="mb-4 p-4 bg-white rounded-xl shadow-sm">
      <view class="flex items-center justify-between mb-3">
        <view class="flex items-center gap-2">
          <view class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#FFF3E0">
            <text class="text-base">🏫</text>
          </view>
          <view>
            <text class="text-sm font-semibold text-gray-800">年级数据 (grades)</text>
            <text class="text-xs text-gray-400 block">1035 条记录</text>
          </view>
        </view>
        <view
          class="px-4 py-1.5 text-xs font-semibold rounded-full active:opacity-80"
          :style="grdRunning ? { background:'#E5E5E5', color:'#999' } : { background:'linear-gradient(135deg,#FF9800,#F57C00)', color:'#FFF' }"
          @click="!grdRunning && importGrades()">
          {{ grdRunning ? `${grdProgress.batch}/${grdProgress.totalBatches}` : '开始导入' }}
        </view>
      </view>
      <view v-if="grdProgress.msg" class="text-xs py-2 px-3 rounded-lg" :style="{ background: grdProgress.err ? '#FFF2F2' : '#F0FFF0', color: grdProgress.err ? '#E54B4B' : '#2E7D32' }">
        {{ grdProgress.msg }}
      </view>
      <view v-if="grdProgress.total > 0" class="mt-2">
        <view class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <view class="h-full rounded-full transition-all duration-300" style="background:linear-gradient(90deg,#FF9800,#F57C00)" :style="{ width: grdProgress.total ? (grdProgress.imported / grdProgress.total * 100) + '%' : '0%' }"></view>
        </view>
        <text class="text-xs text-gray-400 mt-1 block">{{ grdProgress.imported }}/{{ grdProgress.total }}</text>
      </view>
    </view>

    <!-- Banners -->
    <view class="mb-4 p-4 bg-white rounded-xl shadow-sm">
      <view class="flex items-center justify-between mb-3">
        <view class="flex items-center gap-2">
          <view class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#E3F2FD">
            <text class="text-base">🎨</text>
          </view>
          <view>
            <text class="text-sm font-semibold text-gray-800">Banner 轮播</text>
            <text class="text-xs text-gray-400 block">3 条默认数据</text>
          </view>
        </view>
        <view
          class="px-4 py-1.5 text-xs font-semibold rounded-full active:opacity-80"
          :style="bnrRunning ? { background:'#E5E5E5', color:'#999' } : { background:'linear-gradient(135deg,#2196F3,#1565C0)', color:'#FFF' }"
          @click="!bnrRunning && importBanners()">
          {{ bnrRunning ? '导入中…' : '一键导入' }}
        </view>
      </view>
      <view v-if="bnrMsg" class="text-xs py-2 px-3 rounded-lg" :style="{ background: bnrErr ? '#FFF2F2' : '#F0FFF0', color: bnrErr ? '#E54B4B' : '#2E7D32' }">
        {{ bnrMsg }}
      </view>
    </view>
  </view>
</template>

<script setup>
  const txtRunning = ref(false)
  const txtProgress = ref({ msg: '', err: false, batch: 0, totalBatches: 0, total: 0, imported: 0 })

  const grdRunning = ref(false)
  const grdProgress = ref({ msg: '', err: false, batch: 0, totalBatches: 0, total: 0, imported: 0 })

  const bnrRunning = ref(false)
  const bnrMsg = ref('')
  const bnrErr = ref(false)

  onLoad(() => {
    vk.showLoading('加载中…')
    vk.hideLoading()
  })

  async function importTextbooks() {
    txtRunning.value = true
    txtProgress.value = { msg: '⏳ 开始导入…', err: false, batch: 0, totalBatches: 0, total: 0, imported: 0 }

    try {
      let batch = 0
      while (true) {
        let res = await vk.callFunction({
          url: 'client/pub.index.importTextbooks',
          data: { batch },
        })
        if (res.code === 1) {
          let tp = res
          txtProgress.value = {
            msg: `✅ ${tp.msg} (成功${tp.success}条)`,
            err: false,
            batch: tp.batch + 1,
            totalBatches: Math.ceil(tp.total / 100),
            total: tp.total,
            imported: tp.imported,
          }
          if (!tp.hasMore) break
          batch++
        } else {
          txtProgress.value = { ...txtProgress.value, msg: '❌ 导入失败: ' + (res.msg || '未知'), err: true }
          break
        }
      }
    } catch (e) {
      txtProgress.value = { ...txtProgress.value, msg: '❌ 网络错误: ' + (e.message || ''), err: true }
    }

    txtRunning.value = false
  }

  async function importGrades() {
    grdRunning.value = true
    grdProgress.value = { msg: '⏳ 开始导入…', err: false, batch: 0, totalBatches: 0, total: 0, imported: 0 }

    try {
      let batch = 0
      while (true) {
        let res = await vk.callFunction({
          url: 'client/pub.index.importGrades',
          data: { batch },
        })
        if (res.code === 1) {
          let gp = res
          grdProgress.value = {
            msg: `✅ ${gp.msg} (成功${gp.success}条)`,
            err: false,
            batch: gp.batch + 1,
            totalBatches: Math.ceil(gp.total / 100),
            total: gp.total,
            imported: gp.imported,
          }
          if (!gp.hasMore) break
          batch++
        } else {
          grdProgress.value = { ...grdProgress.value, msg: '❌ 导入失败: ' + (res.msg || '未知'), err: true }
          break
        }
      }
    } catch (e) {
      grdProgress.value = { ...grdProgress.value, msg: '❌ 网络错误: ' + (e.message || ''), err: true }
    }

    grdRunning.value = false
  }

  async function importBanners() {
    bnrRunning.value = true
    bnrMsg.value = ''
    bnrErr.value = false

    try {
      let res = await vk.callFunction({
        url: 'client/pub.index.importBanners',
      })
      if (res.code === 1) {
        bnrMsg.value = '✅ ' + res.msg
        bnrErr.value = false
      } else {
        bnrMsg.value = '❌ ' + (res.msg || '导入失败')
        bnrErr.value = true
      }
    } catch (e) {
      bnrMsg.value = '❌ 网络错误: ' + (e.message || '')
      bnrErr.value = true
    }

    bnrRunning.value = false
  }
</script>

<style lang="scss" scoped></style>
