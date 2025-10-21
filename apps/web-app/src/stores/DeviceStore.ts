import { create } from 'zustand';

export interface DeviceInfo {
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
}

interface DeviceStore {
  deviceInfo: DeviceInfo;
  setDeviceInfo: (deviceInfo: DeviceInfo) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  deviceInfo: {
    isMobile: false,
    screenWidth: 0,
    screenHeight: 0,
  },
  setDeviceInfo: (deviceInfo) => set({ deviceInfo }),
}));
