# 电商后端 · NestJS 实战需求文档

> 学习用需求清单：从简单到难，逐个实现即可覆盖 NestJS 核心知识面。
> 难度分级：**L1** 单模块基础 CRUD（练手）→ **L2** 跨模块业务规则（状态机/事务/鉴权）→ **L3** 并发与性能（新依赖）→ **L4** 外部支付对接（沙箱环境）。

## 项目现状盘点（已完成）

| 模块 | 能力 |
|---|---|
| Auth / Users | 注册登录（JWT+bcrypt）、`@CurrentUser`、JwtAuthGuard、RolesGuard |
| Categories | 分类 CRUD |
| Products | 列表（搜索/筛选/排序/分页）、详情、软删除（isActive）、admin 管理 |
| Cart | 加购/改数量/删项/清空 |
| Orders | 购物车结算下单（事务+行锁防超卖）、列表、详情、模拟支付、admin 改状态 |
| Favorites | 收藏/取消/分页列表 |
| 公共设施 | ValidationPipe、TransformInterceptor（`{code,message,data}`）、HttpExceptionFilter、PaginationDto、Swagger+Apifox 导出、seed 脚本 |

**无新依赖实现 L1、L2（仅"定时任务"需 `@nestjs/schedule`）；L3 需要 Redis 等；L4 需要支付 SDK + 沙箱账号 + 内网穿透工具。**

---

## L1 · 单模块基础 CRUD（★☆☆）

> 目的：把"照 cart/favorites 模块抄"练到闭眼能写。每个需求都是一次完整的 实体→DTO→Service→Controller→Module→Swagger 循环。

### R1 收货地址簿（AddressBook）

- **业务**：用户维护多个收货地址，可设默认地址。
- **接口**：
  - `POST /addresses`（姓名/电话/省市区/详细地址/是否默认）
  - `GET /addresses`（列表，默认地址排前）
  - `PUT /addresses/:id`、`DELETE /addresses/:id`
- **表**：`addresses`（user_id 外键 + `@Column` 明细字段 + `isDefault` 布尔）。默认地址唯一：新设默认时把旧的 `isDefault` 置 false（一个 service 方法里完成，先体会"非事务的多写"问题，R6 会再讲事务）。
- **学习要点**：完整模块搭建、`@ManyToOne` 反向关联、ValidationPipe 校验字符串长度、DTO 更新与创建分离。
- **验收**：新地址默认地址置灰原默认；删除默认地址后系统自动把最新一条设为默认；Swagger 文档完整。

### R2 个人资料与修改密码（Profile）

- **业务**：查看/修改昵称、头像 URL；修改密码需校验旧密码。
- **接口**：`GET /users/me`、`PUT /users/me`（昵称/头像）、`PUT /users/me/password`（oldPassword/newPassword）
- **学习要点**：`@CurrentUser` 复用、bcrypt.compare 校验旧密码、`@Body` 与路径 DTO 分离、敏感字段 `select: false`（项目里 password_hash 已是）。
- **验收**：旧密码错误返回 400；修改成功后用新密码可登录；返回体不含任何密码字段。

### R3 商品评价（简单版：任何登录用户可评）

- **业务**：对商品发表评价（评分 1-5 + 文字），按商品查列表。
- **接口**：
  - `POST /reviews`（productId/rating/comment）
  - `GET /products/:id/reviews`（分页，最新在前，带评价人昵称）
- **表**：`reviews`（user_id + product_id + rating int + comment text）。先不做唯一约束（R6 升级为"购买后可评"）。
- **学习要点**：跨表联查带用户昵称（`leftJoinAndSelect`）、rating 的 `@Min(1) @Max(5)` 校验、列表分页复用 `PaginationDto`。
- **验收**：同一商品可查多条评价；rating 传 0/6 被全局校验拦截。

### R4 站内通知（Message）

- **业务**：管理员给用户发通知；用户查通知列表、单条已读、全部已读。
- **接口**：`POST /admin/messages`（发给某用户/全体）、`GET /messages`、`PUT /messages/:id/read`、`PUT /messages/read-all`
- **表**：`messages`（user_id nullable 表示全体、title、content、isRead、readAt）
- **学习要点**：`isRead` 状态更新用 `@UpdateDateColumn`/手动 `readAt`、批量更新（`update()` 一次更新多行）、admin 与用户端同一实体的两个 Controller 视角。
- **验收**：全体通知所有用户可见；已读后 readAt 有值；重复已读幂等。

---

## L2 · 跨模块业务规则（★★☆）

> 目的：学会让模块协作——事务、状态机、跨模块依赖、可选鉴权。这里是 NestJS 主战场。

### R5 订单取消与库存回滚（状态机 + 事务）

- **业务**：待支付订单可取消，取消后回滚库存；已支付订单不可取消（走退款流程，本期不做）。
- **接口**：`POST /orders/:id/cancel`
- **规则**：仅 `pending` 可取消 → `cancelled`；已支付/已发货/已完成/已取消均拒绝。
- **学习要点**：状态机校验（枚举白名单）、`@Transactional`（项目用 QueryRunner 手写事务，对照 orders.service.create 的写法）、库存回滚 `increment` 原子操作、取消时把订单明细的 productId 反查回滚。
- **验收**：取消后 stock 恢复；对已支付订单取消返回 400；并发"支付 vs 取消"只会成功一个（行锁）。

### R6 评价升级：购买后才可评 + 商品平均分

- **业务**：只有购买过该商品的用户才能评价（订单状态 ≥ confirmed）；同一用户同一商品只能评一次；商品详情/列表带平均分。
- **改动**：reviews 表加 `@Unique('uk_user_product', ['userId','productId'])`；`POST /reviews` 前调 `OrdersService` 校验购买记录；products 表加 `ratingAvg`/`ratingCount`（下单评价后更新，或查询时聚合）。
- **学习要点**：**跨模块 Service 注入**（FavoritesModule import ProductsModule 的现成模式）、唯一约束兜底并发重复评价、`QueryBuilder` 聚合 `AVG()`/`COUNT()`、商品详情响应结构扩展。
- **验收**：未购买用户评价返回 403；重复评价返回 400；商品详情出现 ratingAvg/ratingCount。

### R7 收藏标记 isFavorited（可选鉴权）

- **业务**：登录用户请求商品列表/详情时，响应带 `isFavorited` 标记；游客请求不带。
- **实现**：自定义 `OptionalJwtAuthGuard`（继承 JwtAuthGuard，`handleRequest` 里 token 无效返回 null 不抛错）——只挂在商品接口上；列表批量查收藏：`IN` 查询一次拿全部 `productId` 集合。
- **学习要点**：**自定义守卫/装饰器原理**（项目现守卫的源码级理解）、可选鉴权范式、N+1 查询规避（批量 `in` 代替循环查）。
- **验收**：带 token 请求列表每项有 isFavorited；无 token 正常返回且无该字段；收藏后立即请求标记为 true。

### R8 优惠券（表设计 + 幂等领取）

- **业务**：管理员创建券模板（面额/最低消费门槛/总量/有效期）；用户领取；下单时勾选使用（订单金额门槛校验、一人限领一张）。
- **接口**：`POST /admin/coupons`、`POST /coupons/:id/claim`、`GET /coupons/my`、下单 DTO 加 `couponId?`。
- **表**：`coupon_templates`（规则）+ `user_coupons`（userId/templateId/状态 used/unused/expired）。
- **学习要点**：一对多两表设计、**幂等领取**（唯一约束 + 先查后插 + 并发兜底，对照 FavoritesService 的幂等写法）、订单金额计算注入优惠券折扣、有效期校验。
- **验收**：超总量不可领；一人重复领被拦；订单金额低于门槛不可用；用过的券不可再用。

### R9 超时未支付自动取消（定时任务）

- **业务**：订单支付超时（如 30 分钟）自动取消并回滚库存。
- **实现**：`@nestjs/schedule` 的 `@Cron`（每 5 分钟扫 `paidAt IS NULL AND createdAt < 阈值 AND status = pending`），复用 R5 的取消逻辑。
- **学习要点**：**@nestjs/schedule 定时任务**（本项目唯一 L2 新依赖）、批量扫描与单条处理边界、任务幂等（重复执行不重复回滚）、`@Interval` 与 `@Cron` 对比。
- **验收**：造一条超时 pending 订单，任务运行后自动变 cancelled 且库存恢复；正常订单不受影响。

### R10 商品图片上传（文件处理）

- **业务**：admin 上传商品图片，返回可访问 URL，回填商品 imageUrl。
- **实现**：`FileInterceptor`（@nestjs/platform-express 自带 multer，**无新依赖**）+ `ServeStaticModule`（静态目录 `/uploads`）+ 类型/大小校验（仅 jpg/png/webp，≤2MB）+ 文件名随机化防覆盖。
- **学习要点**：**文件上传管道**、静态资源托管、`@UseInterceptors` AOP 心智、文件类型伪装防护、与现有 `imageUrl` 字段打通。
- **验收**：上传后浏览器可直接访问图片 URL；非图片类型返回 400；上传目录不可被路径穿越。

---

## L3 · 并发与性能（★★★）

> 目的：贴近真实电商的工程化问题。引入 Redis 等外部依赖，先读官方文档再动手。

### R11 商品列表缓存

- **业务**：热商品列表接口缓存 60s，库存/价格变动即时失效。
- **实现**：`@nestjs/cache-manager`（内存起步，进阶 Redis）对 `GET /products` 分页结果缓存，key 含查询参数哈希；后台改商品时 `cacheManager.del` 主动失效。
- **学习要点**：**CacheInterceptor vs 手动 cache-manager**、TTL 与缓存一致性取舍、缓存穿透/击穿/雪崩概念及应对（空值缓存/布隆过滤器/加锁重建）。
- **验收**：压测列表接口 QPS 显著提升；改价后首次请求即为新数据。

### R12 接口限流（防爆破）

- **业务**：全局限流 + 登录接口单独收紧（如 1 分钟 5 次），防暴力破解。
- **实现**：`@nestjs/throttler` 全局 `ThrottlerGuard` + 登录路由 `@Throttle` 覆盖。
- **学习要点**：**守卫执行顺序与全局注册**（项目目前守卫都是手动的，这正好对比 APP_GUARD 全局注册）、限流算法（固定窗口 vs 滑动窗口）、`@SkipThrottle` 白名单。
- **验收**：登录连续失败 6 次触发 429；正常接口 1 分钟 100 次内不受影响。

### R13 秒杀活动（Redis 预扣库存 + 限购）

- **业务**：活动商品限量抢购，每人限购 N 件，先到先得、不超卖。
- **实现**：Redis `DECR` 原子预扣库存 + `SADD` 记录已购用户限购；落库与 Redis 对账（最终一致）；超卖兜底沿用现有行锁。
- **学习要点**：**Redis 原子操作**与 MySQL 行锁的对比与配合、缓存一致性（先更 DB 还是先更 Redis）、请求风暴下的降级策略、性能压测。
- **验收**：并发 1000 请求抢 100 件库存，最终销量 ≤100 且无负数；同一用户超限购被拒。

### R14 管理端数据看板（SQL 聚合）

- **业务**：admin 首页看板：今日 GMV、订单数、新增用户、TOP 商品（销量/销售额）、近 7 日趋势折线数据。
- **实现**：`QueryBuilder` 聚合（`SUM`/`COUNT`/`GROUP BY DATE(createdAt)`）+ `DataSource.query` 原生 SQL 兜底复杂统计。
- **学习要点**：**复杂聚合查询**（这是 TypeORM 文档讲得最少、面试常考的部分）、时间分组与时区（项目 timezone `+08:00`）、报表接口的响应结构设计。
- **验收**：造数据后各指标与手工核对一致；近 7 日无数据日期返回 0 而非缺行。

### R15 单元测试与 E2E 测试补全

- **业务**：为已有核心链路补测试：订单流程（加购→下单→支付→取消）E2E、auth 单测、防超卖并发用例。
- **实现**：`@nestjs/testing` + supertest（依赖已在 devDependencies）；`test/app.e2e-spec.ts` 全链路；`products.service.spec.ts` 用 `MockRepository` 隔离 DB。
- **学习要点**：**Test 模块与依赖覆写**（`overrideProvider`）、隔离 DB 的取舍（真库 vs SQLite vs mock）、异步断言与超时处理、CI 里跑测试的姿势。
- **验收**：`npm test` 全绿；并发防超卖用例稳定通过（跑 3 次不 flaky）。

---

## L4 · 外部支付对接（★★★）

> 目的：把"模拟支付"升级成真实支付链路。支付宝沙箱免费免资质，先做；微信支付需要商户号（没有可用沙箱或先 mock 回调练逻辑）。两者做完可抽象出统一支付层（策略模式）。

### R16 支付宝支付（沙箱环境）

- **业务**：`POST /orders/:id/pay` 从"直接置为已支付"升级为真实支付宝沙箱支付：后端调支付宝统一下单 → 返回支付链接/二维码 → 用户支付后支付宝**异步通知**后端 → 验签成功才把订单置为已支付；支持退款。需先到支付宝开放平台申请**沙箱应用**（免费，含沙箱买家账号）。
- **接口**：
  - `POST /orders/:id/pay`（升级：body 传 `mode: 'alipay' | 'mock'`，mock 保留现有模拟支付供本地调试）
  - `POST /api/payments/alipay/notify`（支付宝异步通知回调，**无鉴权、公开路由**，验签后处理）
  - `POST /orders/:id/refund`（退款，可选加分项）
- **表**：`payment_transactions`（order_id、渠道 alipay/wechat、第三方流水号 tradeNo、金额、状态 pending/success/failed/refunded、回调原始报文快照——用于排查与对账）
- **学习要点**：
  - SDK 集成（`alipay-sdk`）与 **RSA2 签名/验签原理**（防伪造回调的关键，理解"为什么必须验签"）
  - **回调幂等**：支付宝会重复回调、乱序回调，已成功必须直接 ACK 不再处理；与 R9 超时取消**并发竞争**（支付回调成功 vs 定时任务取消同时发生，需要状态机加锁保护，只允许一个生效）
  - 金额精度：元/分转换、浮点陷阱（用整数分或 decimal）
  - **本地联调**：回调地址需要公网可达 → 内网穿透工具（ngrok / cpolar）把本地 3000 端口暴露成临时公网 URL
  - 回调路由不能用 JwtAuthGuard（支付宝服务器没有你的 token），会逼你重新理解**路由级鉴权边界**
- **验收**：沙箱扫码支付后订单**自动**变 paid（无需手动模拟）；重复/乱序回调不重复处理；伪造回调（篡改金额后不重新签名）被验签拦截；退款后订单状态与库存一致。

### R17 微信支付（Native 扫码 / JSAPI）

- **业务**：在 R16 基础上增加微信支付渠道。Native 支付：统一下单 → 返回 `code_url` → 前端生成二维码；用户扫码支付后微信异步通知回调 → **平台证书验签** → 订单置已支付；支持退款。
- **接口**：
  - `POST /orders/:id/pay`（body 传 `mode: 'wechat'`）
  - `POST /api/payments/wechat/notify`（微信回调，公开路由）
- **表**：复用 `payment_transactions`（渠道字段区分）
- **学习要点**：
  - 微信支付 **v3 API**（APIv3 密钥、平台证书、请求签名与回调验签）与 v2 的差异；对接前先读官方"接入指引"
  - **金额单位是"分"**：wxpay 全链路传整数分，传元会差 100 倍——经典踩坑，建议单独写一个金额转换工具函数并单测
  - 回调重放防护：用微信回调报文里的通知 ID / 商户订单号去重
  - 与 R16 对比后抽象**统一支付层**（策略模式：`PaymentService` 按渠道路由 Alipay/Wechat/Mock），这是 L4 的终极目标
- **验收**：Native 下单返回 code_url；模拟微信回调（正确签名）通过后订单 paid；金额分元转换单测覆盖 0.01 元 / 1.23 元边界；重复回调不重复处理；商户号缺失时 mock 模式仍可跑通全流程。

---

## 学习路线建议

```
L1: R1 → R2 → R3 → R4        （建立"模块五件套"肌肉记忆）
L2: R5 → R6 → R7 → R10        （事务/跨模块/守卫/文件，性价比最高）
    R8 → R9                    （表设计 + 定时任务）
L3: R11 → R12 → R14 → R15     （缓存/限流/聚合/测试，可并行练习）
    R13                         （最后一个，综合大魔王）
L4: R16 → R17                  （支付宝先做——沙箱免资质；微信后做——理解 v3 验签与统一支付层）
```

**每个需求做完的自检**：
1. `npm run build` 无错误，Swagger 文档完整（Apifox 能同步到）
2. 用 curl 把正常流 + 异常流各跑一遍（参考本仓库 favorites 的验证方式）
3. 给模块写 2-3 个边界用例并解释为什么选它们

**遇到报错时的查错顺序**：编译错看 `nest build` → 运行错看服务日志 → 数据错直接 `SHOW CREATE TABLE` 看表结构 → 还不懂就带着日志问人。
