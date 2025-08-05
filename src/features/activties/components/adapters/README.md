# Activity Editor Adapter

## Problem Solved

The FabriQ platform has 14+ activity types, each with their own editor components. The new `UnifiedActivityCreator` expects editors to use `config`/`onChange` props, but all existing editors use `activity`/`onChange` props. 

Instead of manually updating 14+ components, we created a **Higher-Order Component (HOC)** that automatically adapts legacy editors.

## Solution: ActivityEditorAdapter HOC

### Benefits
- ✅ **Zero changes to existing editors** - All 14+ editors work without modification
- ✅ **Backward compatibility** - Existing code continues to work
- ✅ **Single point of maintenance** - One HOC handles all adaptation logic
- ✅ **Consistent behavior** - All editors get the same adaptation pattern
- ✅ **Future-proof** - New editors can easily be wrapped

### How It Works

1. **Automatic Prop Transformation**: Converts `config`/`onChange` to `activity`/`onChange`
2. **Default Activity Initialization**: Creates proper default activities for each type
3. **Seamless Integration**: Works with both registry-based and dynamic imports
4. **Type Safety**: Maintains full TypeScript support

### Usage

```typescript
// Automatic adaptation in UnifiedActivityCreator
const EditorComponent = autoAdaptEditor(LegacyEditor, 'multiple-choice');

// Manual adaptation
const AdaptedEditor = withActivityEditorAdapter(LegacyEditor, 'activity-type');
```

### Supported Activity Types

All 14+ activity types are automatically supported:
- multiple-choice
- true-false  
- multiple-response
- fill-in-the-blanks
- matching
- drag-and-drop
- drag-the-words
- flash-cards
- numeric
- sequence
- quiz
- reading
- video
- book
- manual-grading (already compatible)
- essay (already compatible)

### Architecture

```
UnifiedActivityCreator
    ↓ (config, onChange)
ActivityEditorAdapter HOC
    ↓ (activity, onChange)  
Legacy Editor Component
```

## Files Changed

1. **ActivityEditorAdapter.tsx** - The main HOC implementation
2. **UnifiedActivityCreator.tsx** - Updated to use the adapter
3. **Fixed Switch component** - Resolved infinite re-render issue

## Testing

Run the test suite to verify the adapter works correctly:

```bash
npm test ActivityEditorAdapter.test.tsx
```

## Migration Path

**Phase 1 (Current)**: All editors work via adapter
**Phase 2 (Future)**: Gradually update editors to native config/onChange pattern
**Phase 3 (Long-term)**: Remove adapter when all editors are updated

This approach allows immediate compatibility while providing a clear migration path.
