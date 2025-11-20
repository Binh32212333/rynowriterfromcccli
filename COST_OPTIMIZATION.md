# 💰 Cost Optimization Guide

## Quick Cost Comparison

| Mode | Cost/Post | Features | Quality |
|------|-----------|----------|---------|
| **PREMIUM** | $0.22-0.33 | 5 images, Grok-4, Smart agent, Enhanced workflow | ⭐⭐⭐⭐⭐ |
| **STANDARD** | $0.06 | 1 image, Grok-4, No enhanced | ⭐⭐⭐⭐ |
| **BUDGET** | $0.045 | 1 image, Grok-3-mini, No agent | ⭐⭐⭐ |

---

## 🎯 Target: $0.05 per post

### Configuration Options

Edit `.env.local` to set these variables:

#### Option 1: Recommended ($0.06/post)
```env
BUDGET_MODE=false
IMAGE_COUNT=1
USE_CHEAPER_MODEL=false
SKIP_ENHANCED_IMAGES=true
```
**Cost Breakdown:**
- Content (Grok-4): $0.02
- Agent decision: $0.001 (skipped if SKIP_ENHANCED_IMAGES=true)
- 1 Image: $0.04
- **Total: ~$0.06**

#### Option 2: Ultra Budget ($0.045/post)
```env
BUDGET_MODE=true
IMAGE_COUNT=1
USE_CHEAPER_MODEL=true
SKIP_ENHANCED_IMAGES=true
```
**Cost Breakdown:**
- Content (Grok-3-mini): $0.005
- Agent decision: $0 (disabled)
- 1 Image: $0.04
- **Total: ~$0.045**

#### Option 3: Premium Quality ($0.22-0.33/post)
```env
BUDGET_MODE=false
IMAGE_COUNT=5
USE_CHEAPER_MODEL=false
SKIP_ENHANCED_IMAGES=false
```
**Cost Breakdown:**
- Content (Grok-4): $0.02
- Agent decision: $0.001
- Enhanced workflow (when needed): $0.05-0.15
- 5 Images: $0.20
- **Total: ~$0.22-0.33**

---

## 📊 Environment Variables Explained

### `BUDGET_MODE`
- `true`: Enables cost-saving optimizations
  - Shorter content (800 words instead of 1000)
  - Skips agent decision-making
  - Forces standard workflow
- `false`: Full-featured mode
- **Impact**: Saves ~$0.01 per post

### `IMAGE_COUNT`
- `1`: Featured image only ($0.04/post)
- `2-3`: Some variety ($0.08-0.12/post)
- `5`: Full gallery ($0.20/post)
- **Impact**: $0.04 per image

### `USE_CHEAPER_MODEL`
- `true`: Uses Grok-3-mini for content ($0.005/post)
- `false`: Uses Grok-4 for content ($0.02/post)
- **Impact**: Saves ~$0.015 per post
- **Trade-off**: Slightly lower content quality

### `SKIP_ENHANCED_IMAGES`
- `true`: Always uses standard image generation
- `false`: Uses AI agent to decide
- **Impact**: Saves $0.05-0.15 on niche keywords
- **Trade-off**: Niche topics get generic images

---

## 🚀 How to Switch Modes

### Switch to Budget Mode ($0.045/post)
```bash
# Edit .env.local
BUDGET_MODE=true
IMAGE_COUNT=1
USE_CHEAPER_MODEL=true
SKIP_ENHANCED_IMAGES=true

# Restart server
# The server will auto-reload
```

### Switch to Standard Mode ($0.06/post)
```bash
# Edit .env.local
BUDGET_MODE=false
IMAGE_COUNT=1
USE_CHEAPER_MODEL=false
SKIP_ENHANCED_IMAGES=true
```

### Switch to Premium Mode ($0.22-0.33/post)
```bash
# Edit .env.local
BUDGET_MODE=false
IMAGE_COUNT=5
USE_CHEAPER_MODEL=false
SKIP_ENHANCED_IMAGES=false
```

---

## 💡 Recommendations by Use Case

### Blog with High Volume (1000+ posts/month)
→ **BUDGET MODE** ($45/month for 1000 posts)
```env
BUDGET_MODE=true
IMAGE_COUNT=1
USE_CHEAPER_MODEL=true
SKIP_ENHANCED_IMAGES=true
```

### Quality-Focused Blog (100 posts/month)
→ **STANDARD MODE** ($6/month for 100 posts)
```env
BUDGET_MODE=false
IMAGE_COUNT=1
USE_CHEAPER_MODEL=false
SKIP_ENHANCED_IMAGES=true
```

### Premium Content (10-50 posts/month)
→ **PREMIUM MODE** ($2-16/month)
```env
BUDGET_MODE=false
IMAGE_COUNT=5
USE_CHEAPER_MODEL=false
SKIP_ENHANCED_IMAGES=false
```

### E-commerce Product Reviews
→ **PREMIUM with Enhanced** ($0.33/post)
```env
BUDGET_MODE=false
IMAGE_COUNT=5
USE_CHEAPER_MODEL=false
SKIP_ENHANCED_IMAGES=false
```
*Niche product names trigger enhanced workflow for accurate images*

---

## 📈 Cost at Scale

| Posts/Month | Budget | Standard | Premium |
|-------------|--------|----------|---------|
| 10 | $0.45 | $0.60 | $2.20-3.30 |
| 100 | $4.50 | $6.00 | $22-33 |
| 1,000 | $45 | $60 | $220-330 |
| 10,000 | $450 | $600 | $2,200-3,300 |

---

## ⚠️ Trade-offs

### Budget Mode Limitations:
- ❌ No AI agent decision-making
- ❌ No enhanced image workflow
- ❌ Slightly shorter content (800 vs 1000 words)
- ❌ Lower quality content (Grok-3-mini vs Grok-4)
- ❌ Only 1 image per post

### Budget Mode Strengths:
- ✅ 95% cost savings
- ✅ Still SEO-optimized
- ✅ Professional AI-generated images
- ✅ Fast generation
- ✅ Scalable to thousands of posts

---

## 🎯 Current Configuration

Your current settings:
```env
BUDGET_MODE=true
IMAGE_COUNT=1
USE_CHEAPER_MODEL=true
SKIP_ENHANCED_IMAGES=true
```

**Estimated cost: ~$0.045 per post** ✅ Target achieved!

---

## 📝 Notes

1. **Image quality remains high** even in budget mode (using Grok-2-image-1212)
2. **Content SEO** is maintained in all modes
3. **WordPress upload** has no API cost
4. **Bright Data** only used in enhanced mode
5. **Vision analysis** only used in enhanced mode

---

## 🔄 Dynamic Switching (Advanced)

You can create different modes per content type by modifying the code:

```typescript
// Example: Auto-switch based on keywords
const isProductReview = keywords.includes('review') || keywords.includes('product')
const budgetMode = isProductReview ? false : process.env.BUDGET_MODE === 'true'
```

This allows:
- Budget mode for general content
- Premium mode for product reviews
- Custom rules per use case
