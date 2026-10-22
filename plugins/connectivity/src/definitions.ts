/**
 * @napacitor/connectivity 类型定义。
 * 封装 .NET MAUI Connectivity API:网络状态检测与监听。
 */
import type { PluginListenerHandle } from '@napacitor/core';

/** 网络连接类型。 */
export enum ConnectionType {
  /** 无网络连接。 */
  None = 'NONE',
  /** WiFi。 */
  WiFi = 'WIFI',
  /** 蜂窝网络(2G/3G/4G/5G)。 */
  Cellular = 'CELLULAR',
  /** 以太网。 */
  Ethernet = 'ETHERNET',
  /** 蓝牙网络。 */
  Bluetooth = 'BLUETOOTH',
  /** 未知类型。 */
  Unknown = 'UNKNOWN',
}

/** 网络访问级别。 */
export enum NetworkAccess {
  /** 完全互联网访问。 */
  Internet = 'INTERNET',
  /** 受限互联网访问(如 captive portal)。 */
  ConstrainedInternet = 'CONSTRAINED_INTERNET',
  /** 仅本地网络。 */
  Local = 'LOCAL',
  /** 无网络。 */
  None = 'NONE',
  /** 未知。 */
  Unknown = 'UNKNOWN',
}

/** 网络状态。 */
export interface NetworkStatus {
  /** 连接类型。 */
  connectionType: ConnectionType;
  /** 网络访问级别。 */
  networkAccess: NetworkAccess;
  /** 是否有网络(便捷字段)。 */
  isConnected: boolean;
}

/** connectivityChange 事件回调。 */
export type ConnectivityChangeCallback = (status: NetworkStatus) => void;

export interface ConnectivityPlugin {
  /** 获取当前网络状态。 */
  getStatus(): Promise<NetworkStatus>;
  /** 检查是否有互联网连接。 */
  hasInternetAccess(): Promise<boolean>;
  /** 监听网络状态变化。 */
  addListener(
    eventName: 'connectivityChange',
    callback: ConnectivityChangeCallback,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 移除该插件全部监听器。 */
  removeAllListeners(): Promise<void>;
}
