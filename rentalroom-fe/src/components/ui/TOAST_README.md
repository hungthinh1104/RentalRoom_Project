# Toast Notification Component

A beautiful, reusable toast notification component built with Sonner, Framer Motion, and your design system colors.

## Features

✨ **Beautiful Animations** - Smooth entrance/exit animations using Framer Motion
🎨 **Design System Integration** - Automatically uses your CSS variables (no hard-coded colors)
🌓 **Dark Mode Support** - Seamlessly adapts to light/dark themes
📱 **Responsive** - Works perfectly on all screen sizes
♿ **Accessible** - Includes ARIA labels and keyboard support
🔧 **Customizable** - Support for actions, descriptions, and custom durations

## Installation

The component is already installed and ready to use! It's located at:
```
src/components/ui/toast-notification.tsx
```

## Basic Usage

### Simple Notifications

```tsx
import { showSuccess, showError, showWarning, showInfo } from "@/components/ui/toast-notification";

// Success
showSuccess("Operation completed!");

// Error
showError("Something went wrong!");

// Warning
showWarning("Please review your changes");

// Info
showInfo("New update available");
```

### With Description

```tsx
showSuccess(
  "Room created successfully!",
  "The room has been added to your property listing"
);

showError(
  "Failed to delete room",
  "This room is currently occupied"
);
```

## Advanced Usage

### With Action Button

```tsx
import { toast } from "@/components/ui/toast-notification";

toast.success({
  title: "Room updated!",
  description: "All changes have been saved",
  duration: 5000,
  action: {
    label: "View Room",
    onClick: () => {
      router.push(`/rooms/${roomId}`);
    },
  },
});
```

### Custom Duration

```tsx
toast.warning({
  title: "Session expiring soon",
  description: "Your session will expire in 5 minutes",
  duration: 10000, // 10 seconds
});
```

## API Reference

### Simple Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `showSuccess` | `(message: string, description?: string)` | Shows a success toast |
| `showError` | `(message: string, description?: string)` | Shows an error toast |
| `showWarning` | `(message: string, description?: string)` | Shows a warning toast |
| `showInfo` | `(message: string, description?: string)` | Shows an info toast |

### Advanced API

```tsx
toast.success(options: ToastOptions)
toast.error(options: ToastOptions)
toast.warning(options: ToastOptions)
toast.info(options: ToastOptions)
```

### ToastOptions Interface

```typescript
interface ToastOptions {
  title: string;           // Required: Main message
  description?: string;    // Optional: Additional details
  duration?: number;       // Optional: Duration in ms (default: 4000)
  action?: {              // Optional: Action button
    label: string;
    onClick: () => void;
  };
}
```

## Design System Colors

The component automatically uses your design system colors from `globals.css`:

| Type | Colors Used |
|------|-------------|
| Success | `--success`, `--success-light`, `--success-foreground` |
| Error | `--destructive`, `--destructive-light`, `--destructive-foreground` |
| Warning | `--warning`, `--warning-light`, `--warning-foreground` |
| Info | `--info`, `--info-light`, `--info-foreground` |

These colors automatically adapt to light/dark mode! 🌓

## Real-World Examples

### Form Submission

```tsx
const handleSubmit = async (data: FormData) => {
  try {
    await api.post("/rooms", data);
    showSuccess("Room created successfully!");
    router.push("/rooms");
  } catch (error) {
    showError(
      "Failed to create room",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};
```

### Delete with Undo

```tsx
const handleDelete = async (id: string) => {
  try {
    await api.delete(`/rooms/${id}`);
    toast.success({
      title: "Room deleted",
      description: "The room has been removed",
      action: {
        label: "Undo",
        onClick: async () => {
          await restoreRoom(id);
          showSuccess("Room restored!");
        },
      },
    });
  } catch (error) {
    showError("Failed to delete room");
  }
};
```

### File Upload

```tsx
const handleUpload = async (file: File) => {
  showInfo("Uploading...", "Please wait");
  
  try {
    await uploadFile(file);
    showSuccess("Upload complete!");
  } catch (error) {
    toast.error({
      title: "Upload failed",
      description: "Please try again",
      action: {
        label: "Retry",
        onClick: () => handleUpload(file),
      },
    });
  }
};
```

## Migration from Sonner

If you're currently using Sonner's `toast` directly, you can easily migrate:

### Before
```tsx
import { toast } from "sonner";

toast.success("Success!");
toast.error("Error!");
```

### After
```tsx
import { showSuccess, showError } from "@/components/ui/toast-notification";

showSuccess("Success!");
showError("Error!");
```

## Styling

The component uses Tailwind CSS classes and CSS variables. All colors are defined in your `globals.css` file, so you can customize the appearance by updating your design system colors.

No hard-coded colors! Everything respects your theme. 🎨

## Accessibility

- ✅ ARIA labels for close button
- ✅ Keyboard support (ESC to dismiss)
- ✅ Screen reader friendly
- ✅ Focus management

## Browser Support

Works in all modern browsers that support:
- CSS Grid
- CSS Variables
- Framer Motion
- ES6+

## Examples

See `toast-notification.examples.tsx` for comprehensive usage examples.

## License

Part of the Rental Room project.
