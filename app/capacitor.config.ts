import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.classmate.app',
  appName: 'ClassMate',
  webDir: 'dist',
  backgroundColor: '#f5f6f8',
  android: {
    allowMixedContent: false,
  },
}

export default config
