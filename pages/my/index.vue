<template>
  <yy-paging ref="paging" bgColor="#F3F4F6" :showTabbar="true" navTitle="我的" @query="queryList">
    <view class="page-content px-4 pt-4">
      <!-- 用户信息区 -->
      <view
        class="bg-white rounded-2xl p-5 mb-5 shadow-sm flex items-center gap-4"
        @click="handleLoginClick"
      >
        <view class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          <image v-if="userInfo.avatar" :src="userInfo.avatar" class="w-full h-full" mode="aspectFill" />
          <u-icon v-else name="account" size="28" color="#9CA3AF" />
        </view>
        <view class="flex-1">
          <text class="text-lg font-semibold">{{ userInfo.name || '未登录' }}</text>
          <text class="text-sm text-muted">点击{{ userInfo.name ? '查看' : '登录解锁更多功能' }}</text>
        </view>
        <u-icon name="arrow-right" size="16" color="#9CA3AF" />
      </view>

      <!-- 下载历史 -->
      <text class="text-base font-medium mb-3">📥 下载历史</text>

      <view v-if="state.dataList.length">
        <view
          v-for="item in state.dataList"
          :key="item._id"
          class="bg-white rounded-xl px-4 py-3 mb-2 flex items-center gap-3 shadow-sm"
        >
          <text class="text-lg">📄</text>
          <view class="flex-1">
            <text class="text-sm font-medium line-clamp-1">{{ item.title }}</text>
            <text class="text-xs text-muted">{{ formatTime(item.downloadTime) }}</text>
          </view>
          <u-icon name="arrow-right" size="14" color="#9CA3AF" />
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!state.dataList.length && isLogin" class="flex flex-col items-center py-12">
        <text class="text-4xl mb-2">📭</text>
        <text class="text-sm text-muted">暂无下载记录</text>
        <text class="text-xs text-muted">去首页浏览教材吧~</text>
      </view>

      <!-- 未登录提示 -->
      <view v-if="!isLogin" class="flex flex-col items-center py-12">
        <text class="text-4xl mb-2">🔒</text>
        <text class="text-sm text-muted mb-3">登录后查看下载记录</text>
        <view class="px-6 py-2 bg-primary text-white rounded-full text-sm" @click="goLogin">立即登录</view>
      </view>

      <view class="h-8"></view>
    </view>
  </yy-paging>
</template>

<script>
export default {
  data() {
    return {
      isLogin: false,
      userInfo: {},
      state: { dataList: [] },
    }
  },
  onShow() {
    this.checkLogin()
  },
  methods: {
    checkLogin() {
      const user = vk.pubfn.getUserInfo()
      this.isLogin = !!user.uid
      this.userInfo = {
        name: user.nickname || user.username || '',
        avatar: user.avatar || user.avatar_file?.url || '',
      }
      if (this.isLogin) {
        this.$refs.paging?.reload()
      }
    },
    handleLoginClick() {
      if (this.isLogin) return
      this.goLogin()
    },
    goLogin() {
      vk.navigateTo('/pages/login/index')
    },
    async queryList(pageIndex, pageSize) {
      if (!this.isLogin) {
        this.$refs.paging?.complete([])
        return
      }
      const res = await vk.callFunction({
        url: 'client/pub_index.getMyDownloads',
        data: { pageIndex, pageSize },
      })
      if (res.code === 1) {
        this.$refs.paging?.complete(res.data || [])
      } else {
        this.$refs.paging?.complete(false)
      }
    },
    formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    },
  },
}
</script>
