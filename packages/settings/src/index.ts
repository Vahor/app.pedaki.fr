
export interface SettingsValueMap {
    default_region: string
    auto_renew: boolean
}


export type Settings = keyof SettingsValueMap;
export type SettingsValue<T extends Settings> = T extends keyof SettingsValueMap ? SettingsValueMap[T] : never;

