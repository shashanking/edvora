# Image Upload Implementation for Course Management

## ✅ Implementation Complete

### 1. Image Upload Component Created
**File**: `src/components/admin/ImageUpload.tsx`

**Features**:
- Drag-and-drop style upload interface
- Image preview with hover-to-remove functionality
- File validation (image types only, max 5MB)
- Upload to Supabase Storage (assets bucket)
- Automatic public URL generation
- Loading states and error handling
- Cleanup of old images when removed

**Usage**:
```tsx
<ImageUpload
  value={thumbnailUrl}
  onChange={(url) => setThumbnailUrl(url)}
  bucket="assets"
  folder="courses"
/>
```

### 2. Course Create Page Updated
**File**: `src/app/dashboard/admin/courses/create/page.tsx`

**Changes**:
- Imported `ImageUpload` component
- Replaced text input for `thumbnail_url` with `ImageUpload` component
- Images are uploaded to `assets/courses/` folder in Supabase Storage
- Public URLs are automatically stored in the database

### 3. Course Edit Page Created
**File**: `src/app/dashboard/admin/courses/[id]/edit/page.tsx`

**Features**:
- Full course editing functionality
- Image upload/replace capability
- Pre-loads existing course data including current thumbnail
- Updates teacher assignments
- Same validation and UI as create page

### 4. Home Page Already Connected to LMS
**File**: `src/app/page.tsx`

**Current Implementation**:
- Already fetches courses from Supabase LMS database
- Uses `buildYoungCourseCatalog()` and `buildAdultCourseCatalog()` helpers
- Displays courses by audience (young/adult) and landing category
- Shows uploaded thumbnails in course cards
- Preserves existing landing page UI

**Query**:
```typescript
const { data } = await supabase
  .from("courses")
  .select("title, description, duration, thumbnail_url, rating, audience, landing_category")
  .eq("status", "published")
  .order("display_order", { ascending: true })
  .order("created_at", { ascending: false });
```

### 5. Course Display Components
**Files**:
- `src/components/Home/ProgrammeOverviewSection.tsx` - Young learners courses
- `src/components/Home/AdultLearnersSection.tsx` - Adult learners courses

**Image Display**:
```tsx
<div className="w-full h-[240px] bg-[#E2E2E2] rounded-[12px] overflow-hidden relative">
  <img src={item.image} alt={item.program} className="w-full h-full object-cover" />
</div>
```

### 6. Supabase Storage Configuration
**Bucket**: `assets` (already exists)
- **Public**: Yes
- **Folder Structure**: `courses/` for course thumbnails
- **File Naming**: `{timestamp}-{random}.{ext}`

## 🎯 How It Works

### Upload Flow
1. Admin selects image in course create/edit page
2. Image is validated (type and size)
3. File is uploaded to `assets/courses/` in Supabase Storage
4. Public URL is generated automatically
5. URL is stored in `courses.thumbnail_url` field
6. Image appears in:
   - Admin courses list
   - Student course catalog
   - Home page course cards

### Display Flow
1. Course is marked as "published"
2. Home page fetches published courses from database
3. Courses are grouped by audience and landing_category
4. Thumbnail URLs are displayed in course cards
5. Fallback images used if no thumbnail uploaded

## 📁 File Structure
```
src/
├── components/
│   └── admin/
│       └── ImageUpload.tsx          # Reusable image upload component
├── app/
│   ├── page.tsx                      # Home page (already using LMS)
│   └── dashboard/
│       └── admin/
│           └── courses/
│               ├── page.tsx          # Course list
│               ├── create/
│               │   └── page.tsx      # Create course with image upload
│               └── [id]/
│                   └── edit/
│                       └── page.tsx  # Edit course with image upload
└── lib/
    └── course-catalog.ts             # Course grouping helpers
```

## 🔧 Configuration

### Environment Variables
Already configured in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://owndrcgsmvwerzzjcrcm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Storage Bucket Permissions
The `assets` bucket is public, allowing:
- Authenticated users (admin) can upload
- Anyone can view uploaded images via public URL

## 🎨 UI/UX Features

### Image Upload Component
- **Empty State**: Shows upload icon with "Click to upload" message
- **Uploading State**: Displays spinner with "Uploading..." text
- **Preview State**: Shows uploaded image with hover overlay
- **Remove Action**: Red button appears on hover to remove image
- **Error Handling**: Displays error messages below upload area

### Course Cards (Home Page)
- **Responsive**: Adapts to all screen sizes
- **Image Display**: 240px height, object-cover for proper aspect ratio
- **Fallback**: Uses default images if no thumbnail uploaded
- **Preserved UI**: Landing page design unchanged

## 📊 Database Schema

### courses table
```sql
thumbnail_url: text (nullable)
-- Stores the public URL from Supabase Storage
-- Example: https://owndrcgsmvwerzzjcrcm.supabase.co/storage/v1/object/public/assets/courses/1234567890-abc123.jpg
```

## ✨ Benefits

1. **No External Dependencies**: Uses Supabase Storage (already in stack)
2. **Automatic CDN**: Supabase provides CDN for fast image delivery
3. **Secure**: Only admins can upload, everyone can view
4. **Organized**: Images stored in structured folders
5. **Reusable**: ImageUpload component can be used elsewhere
6. **Clean URLs**: Direct public URLs, no signed URLs needed
7. **Responsive**: Images display correctly on all devices

## 🚀 Next Steps for Admin

1. **Create/Edit Courses**: Use the image upload in admin dashboard
2. **Publish Courses**: Set status to "published" for home page display
3. **Set Categories**: Choose correct audience and landing_category
4. **Order Courses**: Use display_order to control sequence

## 📝 Notes

- Maximum image size: 5MB
- Supported formats: All image types (PNG, JPG, GIF, WebP, etc.)
- Old images are automatically removed when replaced
- Images are stored with unique filenames to prevent conflicts
- Landing page UI is completely preserved - only data source changed
