# Branding System

The FabriiQ LXP now includes a comprehensive branding system that allows system administrators to customize the appearance and branding of the platform.

## Features

### 1. System Settings - Branding Tab
- **Location**: Admin → System → Settings → Branding tab
- **Access**: System administrators only
- **Purpose**: Configure system-wide branding settings

### 2. Configurable Elements

#### System Name
- **Field**: System Name (required)
- **Description**: The name displayed throughout the system
- **Default**: "FabriiQ LXP"
- **Usage**: Appears in navigation headers, page titles, and system references

#### Logo URL
- **Field**: Logo URL (optional)
- **Description**: URL to the system logo image
- **Recommended Size**: 200x50px or similar aspect ratio
- **Usage**: Displayed in the admin sidebar header alongside the system name

#### Favicon URL
- **Field**: Favicon URL (optional)
- **Description**: URL to the system favicon
- **Recommended Format**: .ico, .png (16x16px or 32x32px)
- **Usage**: Browser tab icon and bookmarks

#### Primary Color
- **Field**: Primary Color (optional)
- **Format**: Hex color code (e.g., #3B82F6)
- **Description**: Main brand color for the system
- **Usage**: Primary buttons, active states, and brand elements

#### Secondary Color
- **Field**: Secondary Color (optional)
- **Format**: Hex color code (e.g., #64748B)
- **Description**: Secondary brand color for the system
- **Usage**: Secondary elements and accents

#### Footer Text
- **Field**: Footer Text (optional)
- **Description**: Text displayed in system footers
- **Max Length**: 500 characters
- **Default**: "© 2024 FabriiQ. All rights reserved."

## Technical Implementation

### Database Schema
- **Table**: `system_config`
- **Key Structure**: `branding.{setting}` (e.g., `branding.systemName`)
- **Storage**: JSON values with metadata

### API Endpoints
- **Router**: `systemConfig`
- **Key Methods**:
  - `getBranding()`: Retrieve all branding settings
  - `updateBranding(data)`: Update branding configuration

### Frontend Components
- **Settings Page**: `src/components/admin/branding-settings.tsx`
- **Hook**: `src/hooks/use-branding.ts`
- **Dynamic Updates**: `src/components/branding/dynamic-head.tsx`

### Real-time Updates
- Changes to branding settings are applied immediately
- Document title and favicon update dynamically
- Navigation components reflect new branding instantly

## Usage Instructions

### For System Administrators

1. **Access Branding Settings**
   - Navigate to Admin → System → Settings
   - Click on the "Branding" tab

2. **Configure System Name**
   - Enter your organization's preferred system name
   - This will appear throughout the platform

3. **Add Logo (Optional)**
   - Upload your logo to a web-accessible location
   - Enter the full URL in the Logo URL field
   - Logo will appear in the admin sidebar

4. **Set Favicon (Optional)**
   - Upload a favicon to a web-accessible location
   - Enter the full URL in the Favicon URL field
   - Favicon will appear in browser tabs

5. **Customize Colors (Optional)**
   - Use the color pickers or enter hex codes
   - Primary color affects main UI elements
   - Secondary color affects accent elements

6. **Update Footer Text (Optional)**
   - Enter custom footer text
   - Supports up to 500 characters

7. **Save Changes**
   - Click "Save Changes" to apply all settings
   - Changes take effect immediately

### For Developers

#### Using the Branding Hook
```typescript
import { useBranding } from '@/hooks/use-branding';

function MyComponent() {
  const { branding, isLoading } = useBranding();
  
  return (
    <div>
      <h1>{branding.systemName}</h1>
      {branding.logoUrl && (
        <img src={branding.logoUrl} alt={branding.systemName} />
      )}
    </div>
  );
}
```

#### Accessing Branding via API
```typescript
import { api } from '@/utils/api';

const { data: brandingData } = api.systemConfig.getBranding.useQuery();
```

## Migration from AIVY to FabriiQ

The system has been updated to use "FabriiQ" as the default branding instead of "AIVY":

- **Package Name**: Updated from `aivy-lxp` to `fabriiq-lxp`
- **Default System Name**: Changed from "AIVY LXP" to "FabriiQ LXP"
- **Metadata**: Updated page titles and descriptions
- **Navigation**: Updated sidebar branding

## Security Considerations

- Only system administrators can modify branding settings
- URL validation ensures proper format for logo and favicon URLs
- Color validation ensures proper hex format
- Input sanitization prevents XSS attacks

## Future Enhancements

Potential future improvements to the branding system:

1. **File Upload**: Direct file upload for logos and favicons
2. **Theme Presets**: Pre-configured color schemes
3. **Advanced Styling**: Custom CSS injection capabilities
4. **Multi-tenant Branding**: Different branding per institution/campus
5. **Brand Guidelines**: Built-in brand consistency checking
