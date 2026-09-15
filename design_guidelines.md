# Design Guidelines: B2B Plastic Products Order Management App

## Architecture Decisions

### Authentication
This app requires full authentication with role-based access (Admin and Wholesaler).

**Implementation:**
- Dual login paths: Wholesaler login and Admin login
- Use Apple Sign-In for iOS and Google Sign-In for Android as primary options
- Email/password as fallback option
- JWT token storage with secure persistence
- Login screen must include:
  - Role selection toggle (Wholesaler/Admin)
  - SSO buttons (Apple/Google for wholesalers)
  - Email/password fields
  - "Forgot Password" link
  - Privacy policy & terms of service links
- Account management:
  - Logout with confirmation alert
  - Profile editing (company name, contact info for wholesalers)
  - Delete account option (Settings > Account > Delete with double confirmation)

### Navigation Architecture

**Wholesaler App (Tab Navigation):**
- 4-tab structure with floating action button:
  1. **Home** (Catalog icon) - Product browsing
  2. **Orders** (List icon) - Order history
  3. **Cart** (Shopping bag icon) - Current cart items
  4. **Profile** (User icon) - Account settings

- Floating Action Button (FAB):
  - Positioned bottom-right when cart has items
  - Shows cart item count badge
  - Tapping navigates to Cart tab

**Admin App (Drawer Navigation):**
- Hamburger menu with sections:
  - Dashboard (default)
  - Orders Management
  - Product Management
  - Wholesalers List
  - Settings
  - Logout

### Screen Specifications

#### WHOLESALER SCREENS

**1. Product Catalog (Home Tab)**
- **Purpose:** Browse and search products
- **Layout:**
  - Transparent header with search bar and filter icon (right)
  - Scrollable grid layout (2 columns)
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - Search bar in header (debounced search)
  - Category filter chips (horizontal scroll below search)
  - Product cards with: image, name, price per unit, category tag
  - Each card has "Add to Cart" button overlay

**2. Product Detail (Modal)**
- **Purpose:** View product details and add to cart
- **Layout:**
  - Custom header with close button (left) and share icon (right)
  - Scrollable content
  - Fixed bottom action bar
- **Components:**
  - Large product image (carousel if multiple images)
  - Product name, category, price
  - Description text
  - Specifications list
  - Quantity stepper (+/- buttons with number input)
  - "Add to Cart" button in bottom bar (full-width, primary color)

**3. Cart Tab**
- **Purpose:** Review and modify cart before checkout
- **Layout:**
  - Default header with "Cart" title, clear all button (right)
  - Scrollable list
  - Fixed bottom summary bar
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl + 80 (for summary bar)
- **Components:**
  - Empty state when cart is empty (icon + message)
  - Cart item cards: product image, name, price, quantity stepper, remove icon
  - Bottom summary: subtotal, "Place Order" button (full-width, primary)

**4. Checkout Screen (Modal)**
- **Purpose:** Confirm order details
- **Layout:**
  - Custom header with "Review Order" title, back button (left)
  - Scrollable form
  - Submit button in header (right) - "Place Order"
- **Components:**
  - Delivery address form (pre-filled from profile)
  - Order summary (collapsed list of items with total)
  - Special instructions text area
  - Payment note: "Cash on Delivery"
  - Terms acceptance checkbox

**5. Orders Tab**
- **Purpose:** View order history
- **Layout:**
  - Default header with "My Orders" title
  - Scrollable list with pull-to-refresh
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - Status filter chips (All, Pending, Shipped, Delivered)
  - Order cards: order number, date, status badge, total, item count
  - Tap card to view details

**6. Order Detail (Stack)**
- **Purpose:** View single order details
- **Layout:**
  - Default header with back button, order number as title
  - Scrollable content
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - Status timeline (visual progress indicator)
  - Order info: date, order number, status
  - Items list (product name, quantity, price)
  - Total summary
  - Delivery address
  - Contact support button (bottom)

**7. Profile Tab**
- **Purpose:** Manage account settings
- **Layout:**
  - Transparent header with "Profile" title
  - Scrollable form
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - User avatar (editable, generate 3 preset avatars with industrial/professional aesthetic)
  - Company name field
  - Contact information (phone, email)
  - Address fields
  - App preferences section (notifications, language)
  - Logout button (destructive style)

#### ADMIN SCREENS

**8. Admin Dashboard (Drawer Default)**
- **Purpose:** Overview of orders and stats
- **Layout:**
  - Default header with menu icon (left), "Dashboard" title
  - Scrollable content
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components:**
  - Stats cards (Total Orders, Pending, This Month)
  - Recent orders list (last 10)
  - Quick actions (Add Product, View All Orders)

**9. Orders Management (Drawer)**
- **Purpose:** View and manage all orders
- **Layout:**
  - Default header with menu icon (left), "Orders" title, filter icon (right)
  - Scrollable list with pull-to-refresh
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components:**
  - Status filter chips
  - Sort dropdown (newest first default)
  - Order cards with wholesaler name, status, total, date
  - Tap to view details

**10. Admin Order Detail (Stack)**
- **Purpose:** Manage single order
- **Layout:**
  - Default header with back button, order number
  - Scrollable content with fixed action bar
  - Bottom action bar for status update
- **Components:**
  - Wholesaler info card (name, company, phone)
  - Order items list
  - Total and payment method
  - Status update dropdown (in bottom bar)
  - "Update Status" button

**11. Product Management (Drawer)**
- **Purpose:** CRUD operations for products
- **Layout:**
  - Default header with menu icon (left), "Products" title, add icon (right)
  - Scrollable list
  - FAB for "Add Product" (bottom-right with shadow)
- **Components:**
  - Search bar
  - Product cards with edit/delete icons
  - Swipe actions (edit, delete with confirmation)

**12. Add/Edit Product (Modal)**
- **Purpose:** Create or update product
- **Layout:**
  - Custom header with close (left), "Add Product" / "Edit Product" title, save (right)
  - Scrollable form
- **Components:**
  - Image picker (tap to upload, show preview)
  - Product name field
  - Category dropdown
  - Price input (numeric)
  - Description text area
  - Specifications fields (dynamic add/remove)
  - Active toggle switch

## Design System

### Color Palette
- **Primary:** Deep Blue (#2563EB) - Professional, trustworthy for B2B
- **Secondary:** Slate Gray (#475569) - Text and icons
- **Accent:** Amber (#F59E0B) - Status highlights, CTAs
- **Success:** Green (#10B981) - Delivered, confirmed states
- **Warning:** Orange (#F97316) - Processing, pending states
- **Danger:** Red (#EF4444) - Delete, cancel actions
- **Background:** White (#FFFFFF)
- **Surface:** Light Gray (#F8FAFC) - Cards, sections
- **Border:** Gray (#E2E8F0)

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto (Android), Bold, 24-28pt
- **Subheaders:** SF Pro Text / Roboto, Semibold, 18-20pt
- **Body:** SF Pro Text / Roboto, Regular, 16pt
- **Caption:** SF Pro Text / Roboto, Regular, 14pt
- **Labels:** SF Pro Text / Roboto, Medium, 14pt

### Visual Design
- Product cards: Use clean white cards with subtle border, no drop shadow
- Status badges: Rounded pills with colored background and white text
- Buttons: Rounded corners (8px), primary uses solid primary color, secondary uses outline
- FAB for cart: Use drop shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)
- Images: Rounded corners (4px) for product images
- Use Feather icons from @expo/vector-icons for all UI icons
- No emojis anywhere in the app

### Critical Assets
1. **Product Placeholder Image:** Generic gray box with package icon when no product image uploaded
2. **Empty State Illustrations:**
   - Empty cart: Simple shopping bag outline
   - No orders: Document/list icon
   - No products: Box icon
3. **User Avatars (3 presets):** Professional, industrial-themed avatar options using geometric shapes and professional color palette
4. **Logo Placeholder:** Simple "B2B Orders" text logo for login screen

### Interaction Design
- All buttons show pressed state (slight opacity change 0.7)
- Cart badge animates when items added (scale bounce)
- Pull-to-refresh on order lists
- Swipe-to-delete on cart items (with confirmation)
- Loading states for all async operations (spinner + disabled state)
- Success/error toast notifications for actions (top of screen, 3 second duration)
- Form validation with inline error messages below fields

### Accessibility
- Minimum touch target: 44x44 points
- Color contrast ratio: 4.5:1 for text
- Status badges use both color and text
- Form inputs have labels and placeholders
- Error states have both visual and text indicators
- Support for system text sizing
- VoiceOver/TalkBack labels on all interactive elements