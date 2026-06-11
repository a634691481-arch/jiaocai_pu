<template>
  <yy-paging v-model="state.dataList" @query="queryList" ref="paging" @scroll="scroll" v-bind="pagingConfig">
    <view class="page-wrap">
      <!-- 封面头卡 -->
      <view class="hero-card">
        <view class="hero-bg">
          <view class="hero-circle hero-circle-1" />
          <view class="hero-circle hero-circle-2" />
          <view class="hero-circle hero-circle-3" />
        </view>
        <view class="hero-icon">
          <yy-icon name="ri:shield-check-line" size="28" color="#ffffff" />
        </view>
        <text class="hero-title">隐私与协议</text>
        <text class="hero-sub">我们尊重并保护您的每一份数据</text>
        <view class="hero-date">
          <yy-icon name="ri:time-line" size="12" color="#BC9A6C" />
          <text>更新于 2025年6月</text>
        </view>
      </view>

      <!-- 目录 -->
      <view class="toc-card">
        <view class="toc-header">
          <view class="toc-ornament" />
          <text class="toc-title">目 录</text>
          <view class="toc-ornament" />
        </view>
        <view class="toc-grid">
          <view
            v-for="(s, i) in sections"
            :key="s.id"
            class="toc-item"
            @click="scrollToSection(s.id)"
          >
            <text class="toc-num">{{ ('0' + (i + 1)).slice(-2) }}</text>
            <text class="toc-label">{{ s.shortTitle }}</text>
          </view>
        </view>
      </view>

      <!-- 正文 -->
      <view class="content-card">
        <view
          v-for="(section, idx) in sections"
          :id="section.id"
          :key="section.id"
          class="section-block"
        >
          <!-- 分隔装饰 -->
          <view v-if="idx > 0" class="section-divider">
            <view class="divider-line" />
            <view class="divider-dot" />
            <view class="divider-line" />
          </view>

          <!-- 编号 + 标题 -->
          <view class="section-head">
            <view class="section-seal">
              <text class="seal-text">{{ ('0' + (idx + 1)).slice(-2) }}</text>
            </view>
            <view class="section-title-wrap">
              <text class="section-title">{{ section.title }}</text>
              <text class="section-short">{{ section.shortDesc }}</text>
            </view>
          </view>

          <!-- 正文 -->
          <text class="section-body">{{ section.body }}</text>

          <!-- 子项列表 -->
          <view v-if="section.items" class="section-items">
            <view v-for="(item, ii) in section.items" :key="ii" class="item-row">
              <view class="item-bullet" />
              <text class="item-text">{{ item }}</text>
            </view>
          </view>

          <!-- 高亮框 -->
          <view v-if="section.tip" class="section-tip">
            <yy-icon name="ri:information-line" size="14" color="#BC9A6C" />
            <text class="tip-text">{{ section.tip }}</text>
          </view>
        </view>
      </view>

      <!-- 页脚 -->
      <view class="footer-card">
        <view class="footer-ornament" />
        <text class="footer-text">本协议自发布之日起生效</text>
        <text class="footer-sub">教材铺 · 保护您的隐私是我们的承诺</text>
      </view>
    </view>
  </yy-paging>
</template>

<script setup>
  const th = uni.$u.color

  const pagingConfig = ref({
    auto: false,
    refresherEnabled: false,
    showRefresherWhenReload: false,
    showTabbar: false,
    hideNav: false,
    showNavBack: true,
    navTitle: '隐私与协议',
    color: '#8B5FBF',
  })

  const state = ref({ isScroll: false, dataList: [] })
  const paging = ref()
  const pagingTop = ref(0)

  const sections = [
    {
      id: 'general',
      shortTitle: '总则',
      title: '总 则',
      shortDesc: '基本声明与适用范围',
      body: '教材铺（以下简称"我们"）深知个人信息对您的重要性，将按照法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。本隐私协议适用于教材铺提供的所有产品与服务，包括但不限于教材查询、在线浏览、下载等核心功能。使用本应用即表示您同意本协议的全部条款。',
      items: [
        '本协议解释权归教材铺所有，我们保留随时更新本协议的权利',
        '如您不同意本协议的任何条款，应立即停止使用本应用',
        '您使用本应用即视为已充分理解并同意本协议的全部内容',
      ],
      tip: '本协议所涉"个人信息"指以电子或其他方式记录的与已识别或可识别的自然人有关的各种信息',
    },
    {
      id: 'collect',
      shortTitle: '信息收集',
      title: '信息收集范围与方式',
      shortDesc: '我们收集哪些信息，如何收集',
      body: '在您使用本应用的过程中，我们可能会收集以下类别的信息，这些信息仅用于提供和改善我们的服务：',
      items: [
        '账户信息：您通过微信授权登录时，我们获取您的微信 OpenID、昵称、头像，用于创建和管理您的账户',
        '设备信息：设备型号、操作系统版本、微信版本号等基础信息，用于兼容性适配和故障排查',
        '操作记录：您浏览、搜索、下载教材的行为记录，用于为您推荐相关内容和改进服务质量',
        '反馈信息：您主动提交的意见反馈、问题描述及联系方式（如有），用于回复和处理您的问题',
        '缓存数据：您收藏的教材、下载记录等本地存储数据，用于提供离线浏览和无缝体验',
      ],
      tip: '我们不会收集您的身份证号、银行账号、通讯录、位置信息等敏感个人信息',
    },
    {
      id: 'use',
      shortTitle: '信息使用',
      title: '信息使用目的与原则',
      shortDesc: '收集的信息将用于何处',
      body: '我们严格遵守法律法规，按照最小必要原则使用您的信息。您的信息将仅用于以下明确目的：',
      items: [
        '核心服务：识别您的身份以提供教材查看、下载等核心功能，确保服务连续性和个性化体验',
        '服务优化：分析使用趋势和用户偏好，持续改进应用界面设计、内容推荐算法和搜索精准度',
        '客户支持：回应您提交的反馈、问题或投诉，提供技术支持和人工服务',
        '合规审计：记录必要的操作日志，用于安全审计、数据分析、法律合规和纠纷处理',
        '服务通知：在必要时向您发送服务公告（如协议更新、功能变更等），不包含营销推广内容',
      ],
      tip: '我们不会将您的个人信息用于任何与产品功能无关的商业营销或广告推送',
    },
    {
      id: 'storage',
      shortTitle: '存储与安全',
      title: '信息存储与安全保障',
      shortDesc: '您的数据如何被保护',
      body: '我们采用行业领先的技术手段和管理措施，全方位保障您的数据安全：',
      items: [
        '存储位置：所有数据存储于阿里云 UniCloud 国内节点，符合国家数据安全法规要求',
        '传输加密：全链路采用 HTTPS/TLS 1.3 加密传输，防止数据在传输途中被窃取或篡改',
        '存储加密：敏感数据在数据库层采用 AES-256 算法加密存储，密钥与数据分离管理',
        '访问控制：严格的生产环境权限管理体系，仅授权运维人员可按需访问，所有操作留痕审计',
        '数据备份：实施每日增量备份和每周全量备份策略，确保数据可恢复性，备份数据同样加密存储',
        '安全认证：云服务提供商通过 ISO 27001 信息安全管理体系认证，具备完善的网络安全防护能力',
      ],
      tip: '尽管我们采取上述措施，但没有任何互联网传输或存储系统能保证100%安全，我们将持续提升安全防护水平',
    },
    {
      id: 'share',
      shortTitle: '信息共享',
      title: '信息共享与委托处理',
      shortDesc: '我们如何对待第三方',
      body: '我们高度重视您的个人信息，在共享和委托处理方面遵循以下严格规则：',
      items: [
        '未经您的明确同意，我们不会向任何第三方出售、交易或转让您的个人信息',
        '为提供服务之必要，我们可能委托云服务提供商（阿里云）处理数据，但要求其遵守同等保密义务',
        '如有以下情形，我们可能会依法披露您的信息：法律法规要求、司法机关或政府机关依法要求、为保护生命财产安全所必需',
        '我们不会将您的个人信息用于任何形式的用户画像、精准广告或商业推广活动',
        '如涉及业务合并、收购或资产转让，我们将提前告知您并要求接收方继续受本协议约束',
      ],
      tip: '我们承诺不接入任何第三方广告SDK或数据分析SDK向您推送个性化广告',
    },
    {
      id: 'rights',
      shortTitle: '用户权利',
      title: '您的权利与选择',
      shortDesc: '您对自己的数据拥有完全控制权',
      body: '依据《个人信息保护法》等法律法规，您享有以下完整的个人信息权利：',
      items: [
        '知情权：您有权了解我们收集了您的哪些信息以及如何使用，本协议即为此目的',
        '访问权：您可以在「我的」页面查看您的个人信息和使用记录',
        '更正权：如发现您的个人信息有误，您可随时通过应用内功能更正或联系我们修改',
        '删除权：您可以联系我们要求删除您的账户和相关数据，我们将在7个工作日内处理',
        '撤回同意权：您可以通过卸载应用或关闭授权的方式撤回对信息收集的同意',
        '注销权：您可联系客服注销账号，注销后我们将删除或匿名化处理您的所有数据',
        '投诉权：如您认为我们的处理侵害了您的权益，可向网信部门或公安机关投诉举报',
      ],
      tip: '删除或注销数据后，相关操作记录将不可恢复，请您谨慎操作',
    },
    {
      id: 'minor',
      shortTitle: '未成年人',
      title: '未成年人信息保护',
      shortDesc: '对未成年用户的特别保护措施',
      body: '我们高度重视未成年人的个人信息保护。如您是未满14周岁的未成年人，请在监护人陪同下使用本应用：',
      items: [
        '我们不会主动收集未成年人的个人身份信息，如姓名、家庭住址、学校等',
        '未成年人使用本应用需征得监护人同意，监护人应引导未成年人正确使用网络',
        '如监护人有证据表明未成年人向我們提供了个人信息，可联系我们删除相关数据',
        '我们设计了内容过滤机制，确保推送给未成年用户的内容健康、适龄',
        '我们不会向未成年用户推送任何形式的广告或营销内容',
      ],
      tip: '如果您是监护人，请关注未成年人的用网习惯，共同营造健康的网络学习环境',
    },
    {
      id: 'update',
      shortTitle: '政策更新',
      title: '政策更新与联系方式',
      shortDesc: '协议变更与问题咨询',
      body: '我们保留根据法律法规变化和服务发展需要适时修订本协议的权利。协议更新后，我们将通过应用内通知方式提醒您查阅。',
      items: [
        '重大变更：服务模式、信息处理目的、数据共享对象等发生重大变化时，我们将以显著方式通知',
        '修订周期：我们至少每12个月评估一次本协议的合理性，必要时及时修订',
        '生效时间：修订后的协议自发布之日起7日后生效，如您继续使用视为同意修订内容',
        '历史版本：您可联系我们索取本协议的历史版本存档',
      ],
      tip: '如您对本协议有任何疑问、意见或投诉，请在「我的」页面提交反馈，我们将在15个工作日内回复',
    },
  ]

  onLoad(() => {})
  onShow(() => {})

  function scroll(e) {
    state.value.isScroll = e.detail.scrollTop > 0
  }

  function scrollToSection(id) {
    const query = uni.createSelectorQuery().in(paging.value?.$el || this)
    query.select(`#${id}`).boundingClientRect(data => {
      if (data) {
        uni.pageScrollTo({ scrollTop: data.top + 100, duration: 300 })
      }
    }).exec()
  }

  function queryList() {
    paging.value?.complete([1])
  }
</script>

<style lang="scss" scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 24rpx;
  background: #F5F3F7;
  min-height: 100vh;
}

// --- Hero ---
.hero-card {
  position: relative;
  border-radius: 28rpx;
  padding: 48rpx 36rpx 40rpx;
  overflow: hidden;
  background: linear-gradient(145deg, #8B5FBF 0%, #61398F 50%, #8B5FBF 100%);
  box-shadow: 0 8rpx 40rpx rgba(139, 95, 191, 0.25);
}
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  background: #D6C6E1;
}
.hero-circle-1 {
  width: 280rpx; height: 280rpx;
  top: -80rpx; right: -60rpx;
}
.hero-circle-2 {
  width: 160rpx; height: 160rpx;
  bottom: -40rpx; left: -40rpx;
}
.hero-circle-3 {
  width: 100rpx; height: 100rpx;
  top: 50%; right: 80rpx;
  transform: translateY(-50%);
  background: #9A73B5;
  opacity: 0.06;
}
.hero-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #8B5FBF, #61398F);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 95, 191, 0.3);
}
.hero-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 4rpx;
}
.hero-sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 8rpx;
}
.hero-date {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: #9A73B5;
}

// --- TOC ---
.toc-card {
  border-radius: 28rpx;
  background: #FFFFFF;
  padding: 32rpx 28rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}
.toc-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.toc-ornament {
  width: 60rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #D6C6E1, transparent);
}
.toc-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #61398F;
  letter-spacing: 8rpx;
}
.toc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}
.toc-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 16rpx;
  border-radius: 14rpx;
  background: #F5F3F7;
  transition: all 0.2s ease;
}
.toc-item:active {
  transform: scale(0.96);
  background: #E9E4ED;
}
.toc-num {
  font-size: 20rpx;
  font-weight: 700;
  color: #8B5FBF;
  font-feature-settings: 'tnum';
  width: 36rpx;
}
.toc-label {
  font-size: 24rpx;
  font-weight: 500;
  color: #4A4A4A;
}

// --- Content ---
.content-card {
  border-radius: 28rpx;
  background: #FFFFFF;
  padding: 40rpx 32rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}
.section-block {
  display: flex;
  flex-direction: column;
}

// Divider
.section-divider {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 40rpx 0;
}
.divider-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, #D6C6E1, transparent);
}
.divider-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #9A73B5;
  opacity: 0.5;
}

// Section head
.section-head {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.section-seal {
  width: 60rpx;
  height: 60rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, #8B5FBF, #61398F);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(192, 57, 43, 0.2);
}
.seal-text {
  font-size: 26rpx;
  font-weight: 800;
  color: #FFFFFF;
  font-feature-settings: 'tnum';
}
.section-title-wrap {
  flex: 1;
  min-width: 0;
  padding-top: 6rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #61398F;
  letter-spacing: 2rpx;
}
.section-short {
  display: block;
  font-size: 22rpx;
  color: #9A73B5;
  margin-top: 4rpx;
}

// Body
.section-body {
  font-size: 26rpx;
  line-height: 1.8;
  color: #4A4A4A;
  padding-left: 80rpx;
}

// Items list
.section-items {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 20rpx;
  padding-left: 80rpx;
}
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}
.item-bullet {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #9A73B5;
  flex-shrink: 0;
  margin-top: 10rpx;
}
.item-text {
  font-size: 25rpx;
  line-height: 1.7;
  color: #4A4A4A;
  flex: 1;
}

// Tip box
.section-tip {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-top: 24rpx;
  margin-left: 80rpx;
  padding: 18rpx 20rpx;
  border-radius: 14rpx;
  background: #F5F3F7;
  border: 1rpx solid rgba(154, 115, 181, 0.2);
}
.tip-text {
  font-size: 23rpx;
  line-height: 1.6;
  color: #878787;
  flex: 1;
}

// --- Footer ---
.footer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0 20rpx;
  gap: 12rpx;
}
.footer-ornament {
  width: 160rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #D6C6E1, transparent);
  margin-bottom: 12rpx;
}
.footer-text {
  font-size: 22rpx;
  font-weight: 500;
  color: #878787;
}
.footer-sub {
  font-size: 20rpx;
  color: #9A73B5;
}
</style>
