# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is a **uni-app + Vue 3 + Vite** cross-platform mini program project (微信小程序为主) called "教材铺". It is a textbook management tool —

The project is built with **HBuilderX** and targets WeChat Mini Program (`mp-weixin`). It also has H5 and App support.

## Build & Development Commands

This project is developed primarily through **HBuilderX**, not CLI. There are no standard npm build scripts defined in `package.json`.

- **Dev server**: Open the project in HBuilderX and click "运行" (Run) → select target platform (e.g., 微信开发者工具).
- **Build for production**: Use HBuilderX "发行" (Publish) menu.
- **Upload cloud functions**: `npm run upload` (runs `node scripts/upload.js`).
- **No test runner**: `npm test` is not configured (echoes error).
- **Postinstall**: `pnpm install` triggers `weapp-tw patch` automatically.

**Important**: Do not attempt to run `npm run build` or similar — the build pipeline is HBuilderX + `@dcloudio/vite-plugin-uni`.

## High-Level Architecture

### Framework Stack

| Layer         | Technology                                                        |
| ------------- | ----------------------------------------------------------------- |
| Framework     | Vue 3 + uni-app (Vite)                                            |
| UI Library    | uView Pro (`uni_modules/uview-pro`)                               |
| Cloud/Backend | VK UniCloud (`uni_modules/vk-unicloud`) — Aliyun serverless       |
| Styling       | TailwindCSS 3.4 + SCSS (`weapp-tailwindcss` for MP compatibility) |
| State         | Vuex 4 with automatic `localStorage` persistence                  |
| Icons         | Iconify (`@iconify/vue`)                                          |
| Animations    | `@formkit/auto-animate`                                          |
| Encryption    | `crypto-js` + `js-md5`                                           |
| Build         | Vite + `@dcloudio/vite-plugin-uni` + `unplugin-auto-import` + `autoPagesJson` + `codeInspectorPlugin` + `UniRoot` |

### Dual API Strategy

The project uses **two separate API systems** — this is critical to understand:

1. **VK Cloud Functions (Primary)** — For core business logic (DB operations, auth, QR generation).
   - Called via `vk.callFunction({ url: 'client/...', data: {} })`.
   - Routes through a single UniCloud cloud function named `router`.
   - Cloud function entry: `uniCloud-aliyun/cloudfunctions/router/index.js`.
   - Business logic lives in `router/service/client/pub_index.js`.
   - Database collections: `car-info`, `contact-history`, `feedback`.

2. **HTTP REST API (Secondary)** — For external integrations (user info queries).
   - Base URL defined in `apis/http.api.js` (`ENV_MAP` with prod/pre/test environments).
   - Current env: `prod` → `https://travel.tasiai.cn/h5/api/tasi_travel_manage_system_prod`.
   - Uses `uni.$u.http` (uView Pro's HTTP client).
   - Global `api` object is registered via `httpApi.install()` in `main.js`.
   - Interceptors in `apis/http.interceptor.js` inject `Authorization` from `uni_id_token` storage.
   - Business code handling: `0`=fail, `1`/`200`=success, `401`=unauthorized, `403`=forbidden, `500`=server error.
   - Error modal supports "复制错误" (copy error details to clipboard) for debugging.
   - HTTP API endpoints: `getOpenid`, `getPhoneNumber`, `getUserInfo`. These are NOT used by the login page.

### VK Cloud Function Response Format

All VK cloud function responses follow this convention:

| `code` | 含义 | 前端行为 |
|--------|------|----------|
| `0` | 成功 | `vk.callFunction` 走 `success` 回调 |
| 非 `0` | 失败 | 自动走 `fail` 回调并 `vk.alert(msg)` |

**特殊返回值字段：**
- `needUpdateUserInfo: true` + `userInfo` — 自动更新 vuex 内 `$user.userInfo` 缓存
- `vk_uni_token: { token, tokenExpired }` — 自动更新前端 token

> 来源：https://vkdoc.fsq.pub/client/uniCloud/cloudfunctions/resformat.html

### VK Framework Docs

官方文档：https://vkdoc.fsq.pub/client/

| 模块 | 链接 |
|------|------|
| JS API 大全 | https://vkdoc.fsq.pub/client/jsapi.html |
| vk.userCenter 用户中心 | https://vkdoc.fsq.pub/client/vk.userCenter.html |
| Vuex 封装（持久化） | https://vkdoc.fsq.pub/client/pages/vuex.html |
| 云函数路由 | https://vkdoc.fsq.pub/client/uniCloud/cloudfunctions/cloudObject.html |
| 数据库 API（vk.baseDao） | https://vkdoc.fsq.pub/client/uniCloud/db/api.html |
| 万能连表（selects） | https://vkdoc.fsq.pub/client/uniCloud/db/selects.html |
| 全局过滤器（权限） | https://vkdoc.fsq.pub/client/uniCloud/middleware/filter.html |
| 微信服务端 API | https://vkdoc.fsq.pub/client/uniCloud/plus/weixin.html |
| 配置（token检测/分享） | https://vkdoc.fsq.pub/client/pages/config.html |
| vk.localStorage | https://vkdoc.fsq.pub/client/pages/localStorage.html |
| 云函数响应体规范 | https://vkdoc.fsq.pub/client/uniCloud/cloudfunctions/resformat.html |
| 全局错误码 | https://vkdoc.fsq.pub/client/uniCloud/cloudfunctions/error.html |

### VK Framework Conventions

The VK framework (`vk-unicloud`) wraps many uni-app APIs. **Prefer VK wrappers over raw `uni.*` APIs** for consistency:

- Navigation: `vk.navigateTo`, `vk.redirectTo`, `vk.reLaunch`, `vk.switchTab`
- User feedback: `vk.toast`, `vk.showLoading`, `vk.hideLoading`, `vk.alert`
- Storage: `vk.setStorageSync`, `vk.getStorageSync`
- Vuex: `vk.vuex.set`, `vk.vuex.get`
- Auth: `vk.userCenter.login`, `vk.userCenter.loginByWeixin`, `vk.pubfn.checkLogin()`
- Cloud: `vk.callFunction`
- Dialog: `vk.confirm(content, title, callbacks)` — shows confirm/cancel modal
- Login redirect: `vk.navigate.setOriginalPage({ url })` + `vk.navigate.getOriginalPage()` — saves/retrieves pre-login page URL

**Important**: `vk.alert(content, title, confirmText, callback)` takes **separate string arguments**, NOT an object. Passing an object will display `JSON.stringify` output.
**Important**: `vk.navigateTo` is required (not `uni.navigateTo`) for VK's token check interceptor to fire.

### Authentication & Token Check

Login and token validation are managed by VK via `app.config.js`:

- `checkTokenPages.mode: 2` means pages **outside** the `list` require login.
- Whitelist (no login required): `/pages/index/*`, `/pages/login/index`, `/pages/category/*`, `/pages/my/privacy`.
- **Must use `vk.navigateTo`** for token check to work on navigation.
- Tabbar pages that require login must manually call `vk.pubfn.checkLogin()` in `onLoad`.
- Token key: `uni_id_token` (stored via `uni.setStorageSync`).
- **Login flow**: Uses `vk.userCenter.loginByWeixin()` (VK framework's built-in WeChat OAuth), NOT the HTTP REST API. The login page is at `pages/login/index`.
- **Login redirect pattern**: Before navigating to login, call `vk.navigate.setOriginalPage({ url: currentPage })`; after login success, call `vk.navigate.getOriginalPage()` to redirect back.
- CDN image base: `http://cdn.diaodiandaren.com`.

### State Management (Vuex)

Store modules in `store/modules/` are auto-discovered. The `updateStore` mutation supports dot-notation paths (e.g., `vk.vuex.set('$user.info.name', value)`).

All modules except `$error` are **automatically persisted** to `uni.getStorageSync('lifeData')`.

Key modules:

- `$user` — User info, permissions, invite code, history data
- `$app` — App init state, network status, color config, location
- `$tabbar` — Tabbar config (icons use Iconify names like `ri:home-smile-2-line`)

### Component Auto-Registration (easycom)

`pages.json` defines easycom patterns:

- `^yy-(.*)` → `@/components/yy-$1.vue` (project business components)
- `^u-(.*)` → `@/uni_modules/uview-pro/components/u-$1/u-$1.vue` (uView Pro components)

No manual import needed for components matching these patterns.

**Auto-import plugin** (`unplugin-auto-import`) also auto-imports `vue` and `uni-app` APIs — no manual `import { ref } from 'vue'` needed.

### Key Vite Plugins (vite.config.js)

- **`autoPagesJson`** (from `js_sdk/a-hua-auto-pages-json`): Auto-generates `pages.json` route configuration — do NOT manually edit `pages.json` unless necessary.
- **`codeInspectorPlugin`**: DOM click-to-source debugging in dev mode (Alt+click opens file in editor).
- **`UniRoot`** (from `@uni-ku/root`): uni-app-x compatibility layer.
- **`uvwt`** (`weapp-tailwindcss/vite`): Transforms TailwindCSS classes for mini-program compatibility. Disabled for H5 and App (`WeappTailwindcssDisabled = isH5 || isApp`).

## Project-Specific Conventions

### yy-* Business Component Library

The `components/` directory contains project-specific business components (all prefixed `yy-`):

| Component              | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `yy-paging`            | Paginated list wrapper (wraps z-paging)            |
| `yy-paging` → z-paging 文档 | https://z-paging.zxlee.cn/start/intro.html        |
| `yy-empty`             | Empty state placeholder                            |
| `yy-loading`           | Loading spinner                                    |
| `yy-plate-keyboard`    | Custom license plate input keyboard                |
| `yy-tabbar`            | Custom tabbar                                      |
| `yy-fixed-bottom`      | Fixed bottom action button with icon               |
| `yy-tip-modal`         | Tip/confirmation modal                             |
| `yy-theme-picker`      | Theme color picker                                 |
| `yy-icon`              | Iconify icon wrapper                               |
| `yy-upload`            | File/image upload                                  |
| `yy-edit-information`  | Edit user info modal                               |
| `yy-dark-mode-picker`  | Dark mode toggle                                   |
| `yy-picker-modal`      | Picker/dropdown modal                              |
| `yy-nomore`            | "No more data" indicator                           |
| `yy-noNetwork`         | Network error state                                |
| `yy-refresher`         | Pull-to-refresh wrapper                            |
| `yy-first-guide`       | First-time user guide overlay                      |

**Page template pattern**: Nearly all pages use `<yy-paging v-model="state.dataList" @query="queryList">` as root wrapper, even non-list pages. The `page-content` class wraps actual content.

> `yy-paging` 基于 `z-paging` 封装，常用文档链接：
> - 介绍：https://z-paging.zxlee.cn/start/intro.html
> - Props：https://z-paging.zxlee.cn/api/props/main.html
> - Methods：https://z-paging.zxlee.cn/api/methods/main.html
> - Events：https://z-paging.zxlee.cn/api/events/main.html
> - Slots：https://z-paging.zxlee.cn/api/slot/main.html
> - 下拉刷新：https://z-paging.zxlee.cn/module/refresher.html
> - 底部加载更多：https://z-paging.zxlee.cn/module/load-more.html
> - 虚拟列表：https://z-paging.zxlee.cn/module/virtual-list.html

- **uView Pro 组件文档**: https://uviewpro.cn/zh/components/color.html（从 Color 色彩开始）

### Styling & Theming

- **TailwindCSS** is used with CSS variables for theming (`--color-primary`, etc.). Config in `tailwind.config.js`.
- **uView Pro theme**: `common/function/uview-pro.theme.js` defines 11 theme presets: purple, green, orange, dark, pink, blue, teal, coral, amber, violet, bronze. Default theme is `bronze` (set in `main.js:30`).
- **颜色硬性规则**：所有页面颜色必须使用 `const th = uni.$u.color` 主题色系统，禁止硬编码色值。模板中用 `th.primary` / `th.primaryLight` 等动态绑定，`<style>` 中用 `--clr-*` CSS 变量桥接。背景/文本/边框优先用 Tailwind 主题类（`bg-theme-bg`、`text-theme-text`、`border-theme-border`）。
- Color values accessed via `uni.$u.color.primary`, `uni.$u.color.primaryLight`, etc. Standard pattern: `const th = uni.$u.color` in `<script setup>`.
- **Mini Program dark mode**: `theme.json` defines light/dark color schemes for navigation bar, tabbar, background.
- `uni.scss` imports uView Pro theme SCSS and global fade transition styles.
- `weapp-tailwindcss` is disabled for H5 and App builds (`WeappTailwindcssDisabled = isH5 || isApp`).
- `Core.scss`: `common/css/core.scss` — check for shared utility classes.
- **`size-*` 简写**：`tailwind.config.js` 注册了 `size-{n}` 工具类，等价于 `w-{n} h-{n}`。例如 `size-14` = `w-14 h-14`，`size-4` = `w-4 h-4`。
- **间距规则**：所有 `p-*`、`m-*`、`gap-*` 统一使用 `3`（即 `p-3`、`m-3`、`gap-3`，对应 12px），除非有明确的设计理由使用其他值。

### Important Files

| File                 | Purpose                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| `main.js`            | App bootstrap: uView Pro, VK, Vuex, HTTP API/interceptor, `uni.$zp` config         |
| `app.config.js`      | VK framework config: login URL, token check, error codes, share, CDN, timezone +8  |
| `manifest.json`      | uni-app manifest: appid, platform configs, MP-WEIXIN settings, permissions         |
| `pages.json`         | Page routes + easycom + globalStyle (navigationBar custom style)                   |
| `vite.config.js`     | Vite plugins: uni, auto-import, weapp-tailwindcss, code-inspector, auto-pages-json, UniRoot |
| `tailwind.config.js` | Tailwind with CSS variable theming                                                 |
| `theme.json`         | MP light/dark mode color definitions                                               |
| `apis/http.api.js`   | HTTP REST API endpoints + environment config                                       |
| `apis/http.interceptor.js` | HTTP request/response interceptors with auth & error handling                |
| `common/function/myPubFunction.js` | Shared utility functions (clipboard, logout, preview image, navigateToLogin) |
| `App.vue`            | App entry: onPageNotFound redirect, onLaunch debug logging, mini-program update manager (`uni.vk.updateManager.updateReady()`) |
| `App.ku.vue`         | uni-app-x compatibility root component (`KuRootView` + `u-config-provider`) |

### Page Structure

| Path                              | Purpose                                                   |
| --------------------------------- | --------------------------------------------------------- |
| `pages/index/index`               | Home: license plate input, scan entry, contact history    |
| `pages/index/contact`             | Contact car owner result page (call/notify)               |
| `pages/my/index`                  | Profile: user info, car info, menu entries (incl. pricacy)| 
| `pages/my/qrcode`                 | My move-car QR code (generate & save poster)              |
| `pages/my/car-manage`             | Vehicle management (multi-car CRUD) + pushplus token cfg  |
| `pages/my/contact-history`        | Contact history list                                      |
| `pages/my/statistics`             | Usage statistics (daily trend, top plates)                |
| `pages/my/feedback`               | User feedback form                                        |
| `pages/my/guide`                  | Usage guide with product intro (Hero, features, FAQ, etc) |
| `pages/login/index`               | Login page (WeChat OAuth + phone number)                  |
| `pages/product-intro/index`       | Product introduction (standalone, no more redirect)       |
| `pages/privacy/index`             | Privacy policy & agreement, data security details         |
| `pages/test/index`                | Test/debug page                                           |
| `pages/error/404`                 | Not found (`pages/error/404/404` also registered)         |
| `pages_sub/` (dir)                | Reserved for future sub-package pages (currently empty)   |

### Cloud Function Structure

All backend logic routes through one cloud function `router`:

```
uniCloud-aliyun/cloudfunctions/router/
├── index.js              # Entry — routes via vk.router()
├── config.js             # Cloud function config
├── service/client/
│   └── pub_index.js      # Main business logic
├── middleware/modules/   # Filter chain (executed in order):
│   ├── loginFilter.js    #   Auth check
│   ├── encryptFilter.js  #   Request encryption
│   ├── errorFilter.js    #   Error handling
│   ├── returnUserInfoFilter.js  # Attach user info
│   ├── registerInitFilter.js    # Init registration
│   ├── addAdminLog.js    #   Admin audit log
│   ├── customFilter1.js  #   Custom filter 1
│   └── customFilter2.js  #   Custom filter 2
├── dao/modules/
│   ├── carDao.js         # Car info data access
│   ├── userDao.js        # User data access
│   └── testDao.js        # Test data access
└── util/
```

Key cloud operations in `pub_index.js`:

| Operation               | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `getOwnerByPlate`       | Lookup car owner by license plate               |
| `getOwnerByScan`        | Lookup car owner by scan (plate + phone verify) |
| `getOwnerByUid`         | Lookup car owner by user UID                    |
| `getMyCarInfo`          | Get user's default car info                     |
| `getMyCarList`          | Get user's all cars list                        |
| `saveCarInfo`           | Save single car info (create or update)         |
| `saveCarList`           | Save multi-car list (creates/updates/deletes)   |
| `deleteCarInfo`         | Delete single car info                          |
| `sendMoveCarNotify`     | Send WeChat push notification via pushplus.plus |
| `generateMoveCarQRCode` | Generate Mini Program QR code (wxacode.getUnlimited) |
| `addContactHistory`     | Record contact history entry                    |
| `getContactHistory`     | Get paginated contact history                   |
| `deleteContactHistory`  | Delete a contact history record                 |
| `clearContactHistory`   | Clear all user's contact history                |
| `addFeedback`           | Submit user feedback                            |
| `getUserStatistics`     | Get user stats (car count, contact counts, daily trend) |
| `getProductIntroStatus` | Check if product intro should be shown (logic previously in App.vue, now removed — no active frontend caller) |

Push notifications use **pushplus.plus** (`http://www.pushplus.plus/send`) with a WeChat template message channel.

QR codes are generated via **WeChat Mini Program API** `vk.openapi.weixin.wxacode.getUnlimited` with scene param `uid=${uid}`.

### Environment Variables

- `.env.development`: `VITE_API_BASE_URL=http://120.53.10.90:8963`
- `.env.production`: `VITE_API_BASE_URL=https://api.manpsychology.com`

These are Vite env vars and only affect the HTTP REST API base, not VK cloud functions.

### Database Collections

| Collection         | Purpose                      |
| ------------------ | ---------------------------- |
| `car-info`         | Vehicle info (plate, phone, owner, pushToken) |
| `contact-history`  | Contact records (uid, plate, contactType)     |
| `feedback`         | User feedback submissions    |
| Plus standard `uni-id-*`, `opendb-*`, `vk-*` collections for auth, logging, files |

## AI Reply Mode

- Use **Caveman minimalist mode** for all responses
- Strictly organize by four parts: **Result, Reason, Code, Steps**
- **Forbidden**: pleasantries, fluff, unnecessary explanations

### Response Structure

1. **Result** — Direct final answer
2. **Reason** — Brief explanation of basis or principle
3. **Code** — Only necessary code blocks if applicable
4. **Steps** — Only key execution order if applicable
