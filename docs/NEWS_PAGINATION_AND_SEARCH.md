# Hướng Dẫn: Phân Trang & Tìm Kiếm Tin Tức

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Backend - API Phân Trang](#backend---api-phân-trang)
3. [Backend - API Tìm Kiếm](#backend---api-tìm-kiếm)
4. [Frontend - Provider (State Management)](#frontend---provider-state-management)
5. [Frontend - Service (Gọi API)](#frontend---service-gọi-api)
6. [Frontend - UI (AllNewsScreen)](#frontend---ui-allnewsscreen)
7. [Cách Hoạt Động Toàn Bộ](#cách-hoạt-động-toàn-bộ)

---

## Tổng Quan

Ứng dụng có 3 phần chính:

```
┌─────────────────────────────────────────────────────┐
│  Frontend UI (AllNewsScreen)                        │
│  - Thanh tìm kiếm                                   │
│  - Danh sách tin tức                                │
│  - Infinite scroll load thêm                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Frontend Provider & Service                        │
│  - Quản lý state (_paginatedNews)                   │
│  - Gọi API với tham số                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Backend API                                        │
│  - GET /api/news/allnews?page=1&pageSize=6&search=keyword
│  - Tìm kiếm, phân trang, trả dữ liệu                │
└─────────────────────────────────────────────────────┘
```

---

## Backend - API Phân Trang

### 📂 File: `backend/src/controllers/newsController.js`

**Trước:**
```javascript
export const getNews = async (req, res) => {
  const { page = 1, pageSize = 6 } = req.query;
  // Không có search
};
```

**Sau:**
```javascript
export const getNews = async (req, res) => {
  const { page = 1, pageSize = 6, search } = req.query;  // ← Thêm search param
  
  const { news, total } = await newsService.getPaginatedNews(
    pageNum, 
    pageSizeNum, 
    search  // ← Truyền search xuống service
  );
};
```

**Giải thích:**
- `page`: Trang số mấy (ví dụ: 1, 2, 3...)
- `pageSize`: Bao nhiêu tin trên 1 trang (mặc định 6)
- `search`: Từ khóa tìm kiếm (tuỳ chọn)

### 📂 File: `backend/src/services/newsService.js`

**Trước:**
```javascript
async getPaginatedNews(page = 1, pageSize = 6) {
  const offset = (page - 1) * pageSize;
  // Chỉ lấy tin tức active
  const { rows, count } = await NewsArticle.findAndCountAll({
    where: { is_active: true },
    limit: pageSize,
    offset: offset,
  });
}
```

**Sau:**
```javascript
async getPaginatedNews(page = 1, pageSize = 6, search = null) {
  const offset = (page - 1) * pageSize;
  
  // Xây dựng điều kiện WHERE
  const whereClause = { is_active: true };
  
  // Nếu có search, thêm điều kiện tìm kiếm
  if (search && search.trim()) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },      // Tìm trong tiêu đề
      { summary: { [Op.like]: `%${search}%` } },    // Tìm trong tóm tắt
      { content: { [Op.like]: `%${search}%` } },    // Tìm trong nội dung
    ];
  }
  
  const { rows, count } = await NewsArticle.findAndCountAll({
    where: whereClause,
    limit: pageSize,
    offset: offset,
  });
}
```

**Giải thích:**
- `offset = (page - 1) * pageSize`: Tính vị trí bắt đầu
  - Page 1: offset = 0 (bắt đầu từ tin 0)
  - Page 2: offset = 6 (bắt đầu từ tin 6)
  - Page 3: offset = 12 (bắt đầu từ tin 12)

- `%${search}%`: Tìm kiếm chứa từ khóa (SQL LIKE)
  - `%hello%` = tìm bất kỳ đâu có chữ "hello"

- `Op.or`: Tìm kiếm OR logic
  - Trả về kết quả nếu TITLE có chứa OR SUMMARY có chứa OR CONTENT có chứa

---

## Backend - API Tìm Kiếm

**URL API:**
```
GET http://localhost:5001/api/news/allnews?page=1&pageSize=6&search=phim
```

**Response (JSON):**
```json
{
  "news": [
    {
      "id": 1,
      "title": "Phim Mới Ra Mắt",
      "summary": "Phim hay nhất năm",
      "imageUrl": "...",
      "createdAt": "2025-12-10"
    }
    // ... thêm 5 tin khác (total 6 tin)
  ],
  "pagination": {
    "page": 1,
    "pageSize": 6,
    "total": 25,        // Tổng cộng có 25 tin chứa từ "phim"
    "totalPages": 5     // 25 ÷ 6 = 4.17 → 5 trang
  }
}
```

---

## Frontend - Provider (State Management)

### 📂 File: `frontend/lib/providers/news_provider.dart`

**Thêm biến state:**
```dart
class NewsProvider extends ChangeNotifier {
  List<NewsModel> _paginatedNews = [];  // Danh sách tin tức
  bool _isLoading = false;              // Đang tải?
  String? _error;                       // Lỗi?
}
```

**Method: `loadPaginatedNews()` - Tải trang 1**

```dart
Future<void> loadPaginatedNews({
  int page = 1, 
  int pageSize = 6, 
  String? search
}) async {
  try {
    _isLoading = true;
    _error = null;
    _paginatedNews = [];  // ← Reset danh sách cũ
    notifyListeners();    // ← Báo UI render lại
    
    // Gọi API với tham số
    final result = await newsService.getPaginatedNews(
      page: page, 
      pageSize: pageSize, 
      search: search
    );
    
    _paginatedNews = result['news'] ?? [];
    _isLoading = false;
    notifyListeners();  // ← Báo UI render với dữ liệu mới
  } catch (e) {
    _error = e.toString();
    _isLoading = false;
    notifyListeners();
  }
}
```

**Giải thích:**
- `notifyListeners()`: Báo cho UI biết state đã thay đổi → UI render lại
- `_paginatedNews = []`: Reset dữ liệu cũ khi load trang mới (tránh flash 8 tin lúc trước)
- `search` parameter: Từ khóa tìm kiếm (nếu có)

**Method: `loadMorePaginatedNews()` - Tải thêm trang tiếp**

```dart
Future<void> loadMorePaginatedNews({
  int page = 2, 
  int pageSize = 6,
  String? search
}) async {
  try {
    _isLoading = true;
    notifyListeners();
    
    // Gọi API trang tiếp
    final result = await newsService.getPaginatedNews(
      page: page, 
      pageSize: pageSize, 
      search: search
    );
    
    final moreNews = result['news'] ?? [];
    
    _paginatedNews.addAll(moreNews);  // ← APPEND thêm vào danh sách
    _isLoading = false;
    notifyListeners();
  } catch (e) {
    _error = e.toString();
    _isLoading = false;
    notifyListeners();
  }
}
```

**Giải thích:**
- `addAll()`: Thêm tin mới vào danh sách cũ (không xóa)
- Ví dụ:
  - Trang 1: `_paginatedNews = [tin1, tin2, ..., tin6]`
  - Load trang 2: `_paginatedNews.addAll([tin7, ..., tin12])` 
  - Kết quả: `[tin1, ..., tin6, tin7, ..., tin12]`

---

## Frontend - Service (Gọi API)

### 📂 File: `frontend/lib/services/news_service.dart`

```dart
Future<Map<String, dynamic>> getPaginatedNews({
  int page = 1, 
  int pageSize = 6, 
  String? search
}) async {
  try {
    // Xây dựng URL
    final url = Uri.parse(
      '${ApiConfig.baseURL}${ApiConfig.allNews}'
      '?page=$page'
      '&pageSize=$pageSize'
      '${search != null && search.isNotEmpty ? '&search=$search' : ''}'
    );
    
    // Ví dụ URL:
    // http://10.0.2.2:5001/api/news/allnews?page=1&pageSize=6&search=phim
    
    // Gọi API
    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Bearer ${authProvider.accessToken}',
      },
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      
      // Parse từ JSON thành NewsModel objects
      final newsList = (data['news'] as List)
          .map((json) => NewsModel.fromJson(json))
          .toList();
      
      return {
        'news': newsList,
        'pagination': data['pagination'],
      };
    } else {
      throw Exception('Lỗi API');
    }
  } catch (e) {
    throw Exception('Lỗi getPaginatedNews: $e');
  }
}
```

**Giải thích:**
- URL builder: Ghép query params vào URL
- `search != null && search.isNotEmpty`: Chỉ thêm `&search=...` nếu có từ khóa
- Parse JSON: Chuyển JSON response thành Dart objects

---

## Frontend - UI (AllNewsScreen)

### 📂 File: `frontend/lib/screens/all_news_screen.dart`

**1. Thêm TextField Tìm Kiếm:**

```dart
TextField(
  controller: _searchController,
  onChanged: (value) {
    _performSearch(value);  // ← Gọi khi user gõ
  },
  decoration: InputDecoration(
    hintText: 'Tìm kiếm tin tức...',
    prefixIcon: Icon(Icons.search),
    suffixIcon: _searchQuery.isNotEmpty
        ? IconButton(
            icon: Icon(Icons.clear),
            onPressed: () {
              _searchController.clear();
              _performSearch('');  // ← Xóa tìm kiếm
            },
          )
        : null,
  ),
)
```

**Giải thích:**
- `onChanged`: Gọi function khi text thay đổi
- `suffixIcon`: Icon clear (x) hiển thị khi có text

**2. Function Tìm Kiếm:**

```dart
void _performSearch(String query) {
  setState(() {
    _searchQuery = query;
    _currentPage = 1;  // ← Reset về trang 1
  });
  
  // Gọi Provider để search
  context.read<NewsProvider>().loadPaginatedNews(
    page: 1, 
    pageSize: _pageSize,
    search: query.isNotEmpty ? query : null,
  );
}
```

**Giải thích:**
- Reset `_currentPage = 1` khi search mới
- Pass `search` param nếu user gõ gì đó
- Pass `null` nếu search trống (hiển thị tất cả)

**3. Load More Khi Scroll:**

```dart
void _loadMoreNews() {
  context.read<NewsProvider>().loadMorePaginatedNews(
    page: _currentPage + 1,
    pageSize: _pageSize,
    search: _searchQuery.isNotEmpty ? _searchQuery : null,  // ← Giữ search term
  ).then((_) {
    _currentPage++;  // ← Tăng page số
  });
}
```

**Giải thích:**
- Pass `_searchQuery` để load trang tiếp của kết quả search
- Ví dụ: User search "phim", scroll xuống → load trang 2 của kết quả "phim"

**4. UI Hiển Thị:**

```dart
body: Column(
  children: [
    // Thanh tìm kiếm
    Padding(
      padding: EdgeInsets.all(16),
      child: TextField(...),
    ),
    // Danh sách tin tức
    Expanded(
      child: Consumer<NewsProvider>(
        builder: (context, newsProvider, child) {
          final allNews = newsProvider.paginatedNews;
          
          if (allNews.isEmpty && !newsProvider.isLoading) {
            return Center(
              child: Text(
                _searchQuery.isNotEmpty 
                    ? 'Không tìm thấy kết quả' 
                    : 'Chưa có tin tức'
              ),
            );
          }
          
          return ListView.builder(
            itemCount: allNews.length + (newsProvider.isLoading ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == allNews.length) {
                // Loading spinner ở cuối danh sách
                return CircularProgressIndicator();
              }
              return NewsCard(allNews[index]);
            },
          );
        },
      ),
    ),
  ],
)
```

**Giải thích:**
- `Column`: Xếp thanh search ở trên, danh sách ở dưới
- `Consumer<NewsProvider>`: Lắng nghe thay đổi từ Provider
- `ListView.builder`: Hiển thị danh sách, thêm loading spinner ở cuối

---

## Cách Hoạt Động Toàn Bộ

### Scenario 1: User Mở Tin Tức Screen

```
1. initState() gọi:
   loadPaginatedNews(page: 1, pageSize: 6)
   
2. Provider:
   - _paginatedNews = []
   - notifyListeners() → UI show loading
   - newsService.getPaginatedNews(1, 6, null)
   
3. Service:
   - Gọi API: GET /api/news/allnews?page=1&pageSize=6
   
4. Backend:
   - offset = 0
   - Lấy 6 tin từ vị trí 0
   - Trả {news: [tin1..tin6], pagination: {page: 1, pageSize: 6, total: 150, totalPages: 25}}
   
5. UI Render:
   - Hiển thị [tin1, tin2, tin3, tin4, tin5, tin6]
```

### Scenario 2: User Scroll Xuống Gần Cuối

```
1. ScrollController phát hiện scroll gần cuối (800px)
   
2. Gọi _loadMoreNews():
   - _currentPage = 1 + 1 = 2
   - loadMorePaginatedNews(page: 2)
   
3. Provider:
   - newsService.getPaginatedNews(2, 6, null)
   
4. Backend:
   - offset = 6
   - Lấy 6 tin từ vị trí 6 (tin7 đến tin12)
   - Trả {news: [tin7..tin12], pagination: {...}}
   
5. Provider:
   - _paginatedNews.addAll([tin7..tin12])
   - Kết quả: [tin1..tin6, tin7..tin12]
   
6. UI Render:
   - Hiển thị 12 tin
```

### Scenario 3: User Tìm Kiếm "Phim"

```
1. User gõ "phim" vào search box
   
2. onChanged() gọi _performSearch("phim"):
   - _searchQuery = "phim"
   - _currentPage = 1
   - loadPaginatedNews(page: 1, search: "phim")
   
3. Provider:
   - _paginatedNews = [] (reset)
   - notifyListeners() → UI show loading
   - newsService.getPaginatedNews(1, 6, "phim")
   
4. Service:
   - URL: ?page=1&pageSize=6&search=phim
   
5. Backend:
   - WHERE: is_active=true AND (title LIKE %phim% OR summary LIKE %phim% OR content LIKE %phim%)
   - Lấy 6 tin đầu tiên từ kết quả tìm kiếm
   - Trả {news: [result1..result6], pagination: {total: 45, totalPages: 8}}
   
6. UI Render:
   - Hiển thị 6 kết quả tìm kiếm
```

### Scenario 4: User Scroll Khi Đang Search

```
1. User đang xem kết quả search "phim" (6 tin)
   
2. User scroll xuống
   
3. Gọi _loadMoreNews():
   - _currentPage = 1 + 1 = 2
   - _searchQuery = "phim" (vẫn giữ)
   - loadMorePaginatedNews(page: 2, search: "phim")
   
4. Backend:
   - WHERE: is_active=true AND (title LIKE %phim% OR ...)
   - offset = 6 (lấy từ tin 6)
   - Trả 6 tin tiếp theo từ kết quả search
   
5. UI:
   - Append 6 tin mới vào danh sách
   - Tổng: 12 tin search
```

---

## 🎯 Tổng Kết Thay Đổi

| Phần | Thay Đổi | Lý Do |
|------|---------|-------|
| **Backend Controller** | Thêm `search` param | Hỗ trợ tìm kiếm |
| **Backend Service** | Xây dựng WHERE clause động | Tìm kiếm trong title/summary/content |
| **Frontend Service** | Thêm `search` param vào URL | Gửi từ khóa lên API |
| **Frontend Provider** | `loadPaginatedNews()`, `loadMorePaginatedNews()` hỗ trợ search | Quản lý state search |
| **Frontend UI** | Thêm TextField + logic search | Cho user tìm kiếm |
| **Frontend UI** | Reset `_paginatedNews = []` khi search | Tránh flash dữ liệu cũ |
| **Frontend UI** | Thanh search + danh sách layout | Better UX |

---

## 📱 Sơ Đồ Luồng Dữ Liệu

```
┌──────────────────┐
│  User gõ search  │
└────────┬─────────┘
         ↓
┌──────────────────────────────────┐
│ TextField.onChanged()            │
│ → _performSearch(query)          │
│ → setState(_searchQuery)         │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ NewsProvider.loadPaginatedNews() │
│ → _paginatedNews = []            │
│ → notifyListeners()              │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ NewsService.getPaginatedNews()   │
│ → Build URL với search param     │
│ → http.get(url)                  │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ Backend API                      │
│ → Build WHERE with LIKE %search% │
│ → Query database                 │
│ → Return JSON                    │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ Frontend Provider               │
│ → _paginatedNews = result['news']│
│ → notifyListeners()              │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ UI (Consumer<NewsProvider>)       │
│ → Rebuild with new data          │
│ → Display search results         │
└──────────────────────────────────┘
```

---

## ✅ Điểm Chính

1. **Phân Trang**: Dữ liệu được chia thành các trang, user scroll → load trang tiếp
2. **Tìm Kiếm**: Backend lọc dữ liệu, frontend gửi keyword lên
3. **Infinite Scroll**: Tự động load khi scroll gần cuối
4. **State Management**: Provider giữ danh sách tin tức, UI lắng nghe thay đổi
5. **Reset Logic**: Khi search mới, reset danh sách cũ để tránh confusing

