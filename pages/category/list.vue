<template>
  <yy-paging ref="paging" bgColor="#F3F4F6" :navTitle="navTitle" showNavBack @query="queryList">
    <view class="page-content px-3 pt-3">
      <view class="grid grid-cols-3 gap-3">
        <view
          v-for="item in state.dataList"
          :key="item._id"
          class="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform"
          @click="goDetail(item)"
        >
          <image :src="item.cover" mode="aspectFill" class="w-full bg-gray-100" style="aspect-ratio: 3/4" @error="onCoverError(item)" />
          <view class="p-2">
            <text class="text-sm font-medium line-clamp-1">{{ item.title }}</text>
            <text class="text-xs text-muted">{{ item.publisher || '' }}</text>
          </view>
        </view>
      </view>
      <view class="h-8"></view>
    </view>
  </yy-paging>
</template>

<script setup>
const paging = ref(null)

const navTitle = ref('教材列表')
const grade = ref('')
const subject = ref('')
const state = reactive({ dataList: [] })

onLoad((options) => {
  grade.value = options.grade || ''
  subject.value = options.subject || ''
  navTitle.value = decodeURIComponent(options.title || '教材列表')
})

async function queryList(pageIndex, pageSize) {
  const res = await vk.callFunction({
    url: 'client/pub_index.getTextbookList',
    data: { grade: grade.value, subject: subject.value, pageIndex, pageSize },
  })
  if (res.code === 1) {
    paging.value.complete(res.data || [])
  } else {
    paging.value.complete(false)
  }
}

function goDetail(item) {
  vk.navigateTo(`/pages/category/detail?id=${item._id}`)
}

function onCoverError(item) {
  item.cover = ''
}
</script>
