// Export all custom icons from the lucide-icons file
export * from './lucide-icons';

// Also export from the direct exports file to ensure all icons are available
export * from '../icons-fix';

// Direct exports for problematic icons to ensure they're available
export {
  Star,
  HardDrive,
  EyeOff,
  MousePointer,
  Volume2,
  Brain,
  FileSpreadsheet,
  Image
} from '../icons-fix';
