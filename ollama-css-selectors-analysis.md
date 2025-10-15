# Ollama Search Page CSS Selectors Analysis

## HTML Structure Overview

The Ollama search page uses a clean, structured layout with specific CSS selectors and test attributes that make scraping reliable.

## Main Container Structure

```html
<ul role="list" class="grid grid-cols-1">
  <li x-test-model class="flex items-baseline border-b border-neutral-200 py-6">
    <!-- Model content here -->
  </li>
</ul>
```

## Individual Model Structure

Each model is contained in an `<li>` element with the following structure:

### Primary Selectors

| Data | CSS Selector | Test Attribute | Example Value |
|------|-------------|----------------|---------------|
| **Model Container** | `li[x-test-model]` | `x-test-model` | - |
| **Model Link** | `a[href^="/library/"]` | - | `/library/gpt-oss` |
| **Model Name** | `span[x-test-search-response-title]` | `x-test-search-response-title` | `gpt-oss` |
| **Description** | `p.max-w-lg.break-words.text-neutral-800.text-md` | - | `OpenAI's open-weight models...` |
| **Capabilities/Tags** | `span[x-test-capability]` | `x-test-capability` | `tools`, `thinking` |
| **Cloud Tag** | `span.bg-cyan-50` | - | `cloud` |
| **Model Sizes** | `span[x-test-size]` | `x-test-size` | `20b`, `120b` |
| **Pull Count** | `span[x-test-pull-count]` | `x-test-pull-count` | `3.5M` |
| **Tag Count** | `span[x-test-tag-count]` | `x-test-tag-count` | `5` |
| **Last Updated** | `span[x-test-updated]` | `x-test-updated` | `5 days ago` |

### Detailed CSS Selectors

#### Model Container
```css
li[x-test-model]
```

#### Model Name
```css
li[x-test-model] span[x-test-search-response-title]
```

#### Model Description
```css
li[x-test-model] p.max-w-lg.break-words.text-neutral-800.text-md
```

#### Model URL
```css
li[x-test-model] a[href^="/library/"]
```
- Extract `href` attribute and prepend `https://ollama.com`

#### Capabilities (Tools, Thinking, etc.)
```css
li[x-test-model] span[x-test-capability]
```

#### Cloud Models
```css
li[x-test-model] span.bg-cyan-50
```

#### Model Sizes
```css
li[x-test-model] span[x-test-size]
```

#### Pull Count
```css
li[x-test-model] span[x-test-pull-count]
```

#### Last Updated
```css
li[x-test-model] span[x-test-updated]
```

## Tag Color Coding

| Tag Type | Background Class | Text Color | Example |
|----------|------------------|------------|---------|
| **Capabilities** | `bg-indigo-50` | `text-indigo-600` | tools, thinking |
| **Cloud** | `bg-cyan-50` | `text-cyan-500` | cloud |
| **Sizes** | `bg-[#ddf4ff]` | `text-blue-600` | 20b, 120b |

## Cheerio Implementation Strategy

### Main Parsing Function
```javascript
function parseOllamaSearchPage(html) {
  const $ = cheerio.load(html);
  const models = [];

  $('li[x-test-model]').each((index, element) => {
    const $model = $(element);
    
    const name = $model.find('span[x-test-search-response-title]').text().trim();
    const description = $model.find('p.max-w-lg.break-words.text-neutral-800.text-md').text().trim();
    const url = 'https://ollama.com' + $model.find('a[href^="/library/"]').attr('href');
    
    // Extract capabilities
    const capabilities = $model.find('span[x-test-capability]').map((i, el) => $(el).text().trim()).get();
    
    // Check for cloud tag
    const isCloud = $model.find('span.bg-cyan-50').length > 0;
    if (isCloud) capabilities.push('cloud');
    
    // Extract sizes
    const sizes = $model.find('span[x-test-size]').map((i, el) => $(el).text().trim()).get();
    
    // Extract pull count
    const pullCount = $model.find('span[x-test-pull-count]').text().trim();
    
    // Extract update time
    const lastUpdated = $model.find('span[x-test-updated]').text().trim();
    
    if (name) {
      models.push({
        name,
        description,
        url,
        capabilities,
        sizes,
        pullCount,
        lastUpdated,
        // Transform to match existing format
        tags: capabilities,
        modifiedAt: parseUpdateTime(lastUpdated),
        digest: 'sha256:' + Math.random().toString(36).substring(2),
        isInstalled: false
      });
    }
  });

  return models;
}
```

## Reliability Notes

1. **Test Attributes**: Ollama uses `x-test-*` attributes which are specifically for testing and less likely to change
2. **Consistent Structure**: The HTML structure is very consistent across all models
3. **Semantic Classes**: Classes like `bg-indigo-50` for capabilities are semantic and stable
4. **Fallback Strategy**: Can fall back to class-based selectors if test attributes are removed

## Search Parameters

The search page supports these URL parameters:
- `q` - Search query
- `sort` - Sort order (popular/newest)
- `c` - Category filter (cloud, embedding, vision, tools, thinking)

Example: `https://ollama.com/search?q=llama&sort=newest&c=tools`
