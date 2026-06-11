let myfn = {}

// 单张图片预览
myfn.previewImage = url => {
  uni.previewImage({
    urls: [url],
    current: url,
  })
}
// 多张图片预览
myfn.previewImages = urls => {
  uni.previewImage({
    urls,
    current: urls[0],
  })
}

// 复制到剪贴板（兼容微信小程序 & H5）
myfn.copyToClipboard = text => {
  // #ifdef H5
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        vk.toast('已复制')
      })
      .catch(() => {
        vk.toast('复制失败')
      })
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    vk.toast('已复制')
  }
  // #endif
  // #ifdef MP-WEIXIN
  wx.setClipboardData({
    data: text,
    success: () => vk.toast('已复制'),
    fail: e => {
      console.log('e==> ', e)
      vk.toast('复制失败')
    },
  })
  // #endif
}

// 构建错误摘要
myfn.buildErrorSummary = res => {
  const config = res.config || {}
  const parts = [
    `URL: ${config.url || config.baseURL || 'N/A'}`,
    `Method: ${(config.method || 'N/A').toUpperCase()}`,
    `Params: ${JSON.stringify(config.params || config.data || {}, null, 2)}`,
    `Response: ${JSON.stringify(res.data || res, null, 2)}`,
  ]
  return parts.join('\n\n')
}

// 退出登录
myfn.logout = async () => {
  vk.showLoading('退出登录中...')
  vk.setStorageSync('uni_id_token_expired', {})
  vk.setStorageSync('uni_id_token', '')
  vk.setVuex('$user', {})
  await new Promise(resolve => setTimeout(resolve, 1000))
  vk.hideLoading()
  vk.reLaunch('/pages/index/index')
}

// 下载历史：保存
myfn.saveDownloadHistory = (item) => {
  const key = 'download_history'
  let list = vk.getStorageSync(key) || []
  const idx = list.findIndex(r => r.title === item.title && r.publisher === item.publisher && r.grade === item.grade)
  const record = { ...item, downloadTime: Date.now() }
  if (idx > -1) {
    list[idx] = record
  } else {
    list.unshift(record)
  }
  if (list.length > 100) list = list.slice(0, 100)
  vk.setStorageSync(key, list)
}

// 下载历史：读取（分页）
myfn.getDownloadHistory = (pageIndex = 1, pageSize = 20) => {
  const key = 'download_history'
  const list = vk.getStorageSync(key) || []
  const start = (pageIndex - 1) * pageSize
  return { code: 1, data: list.slice(start, start + pageSize), total: list.length }
}

// 跳转登录页面
myfn.navigateToLogin = (url) => {
  vk.navigate.setOriginalPage({ url })
}

export default myfn
